#!/usr/bin/env python3
"""
Read a letter aloud through the kernel's own /api/speak route, one paragraph
at a time, then stitch the results into a single WAV.

Speaking it in chunks rather than one request is not just convenience: the
route caps input at 2000 characters, and paragraph-sized chunks also give the
natural pauses a real reading needs.

usage: speak.py <letter.html> <out.wav> [--rate 145] [--voice ar]
"""
import html, json, math, re, sys, urllib.request, urllib.error, wave, struct

API = "http://127.0.0.1:3000/api/speak"

def token():
    req = urllib.request.Request(
        "http://127.0.0.1:3000/api/auth/login",
        data=json.dumps({"username": "hazem", "password": "hazem"}).encode(),
        headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=15)).get("token")

def strip_html(path):
    raw = open(path, encoding="utf-8").read()
    body = raw.split('<div class="w">', 1)[-1]
    body = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', body, flags=re.S | re.I)
    body = re.sub(r'<hr\s*/?>', '\n\n', body, flags=re.I)
    body = re.sub(r'</(p|h1|h2|div|blockquote)>', '\n\n', body, flags=re.I)
    body = re.sub(r'<[^>]+>', '', body)
    body = html.unescape(body)
    # collapse whitespace, keep paragraph breaks
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in body.split('\n')]
    paras = [l for l in lines if l]
    return paras

def speak(text, tok, voice, rate, retries=4):
    """POST to /api/speak, backing off when the limiter says 429."""
    delay = 1.0
    for attempt in range(retries):
        req = urllib.request.Request(
            API, data=json.dumps({"text": text, "voice": voice, "rate": rate}).encode(),
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + tok})
        try:
            return urllib.request.urlopen(req, timeout=45).read()
        except urllib.error.HTTPError as e:
            body = e.read()
            if e.code == 429 and attempt < retries - 1:
                # the route is capped at 240 requests/minute; a long letter is
                # ~45 requests, and a re-run stacks on top of the last
                time.sleep(delay); delay *= 2
                continue
            raise RuntimeError(f"HTTP {e.code}: {body[:120].decode('utf-8','replace')}")
    raise RuntimeError("rate limited after retries")

def parse_wav(data):
    """Return (framerate, channels, width, pcm_bytes).

    espeak-ng writes a WAV header with a placeholder length when streaming to
    stdout — getnframes() on it reports ~1e9 frames for a one-word sample.
    So the 'data' chunk is located and read directly instead of trusting the
    header, and espeak's real output rate (22050) is taken from the header,
    which is correct.
    """
    if len(data) < 12 or data[:4] != b'RIFF' or data[8:12] != b'WAVE':
        raise ValueError('not a RIFF/WAVE stream')
    pos = 12
    fmt = None
    while pos + 8 <= len(data):
        cid = data[pos:pos+4]
        size = struct.unpack('<I', data[pos+4:pos+8])[0]
        body = data[pos+8:pos+8+size]
        if cid == b'fmt ':
            fmt = struct.unpack('<HHIIHH', body[:16])
        elif cid == b'data':
            # clamp to what we actually hold; header size is a lie here
            pcm = body if size <= len(body) else data[pos+8:]
            if fmt is None:
                raise ValueError('data chunk before fmt')
            return fmt[2], fmt[1], fmt[5], pcm
        pos += 8 + size + (size & 1)
    raise ValueError('no data chunk')

def trim_silence(pcm, width_bytes, threshold=0.004, keep=0.02):
    """Strip leading/trailing near-silence, keeping a short natural margin.

    espeak pads every utterance with dead air. Concatenated as-is, 45 chunks
    left 103 s of exact digital silence in a 368 s file — 28% dead air, which
    reads as the voice constantly interrupting itself.
    """
    n = len(pcm) // width_bytes
    def silent(i):
        v = struct.unpack_from('<h', pcm, i * width_bytes)[0] / 32768
        return abs(v) < threshold
    a = 0
    while a < n - 1 and silent(a): a += 1
    b = n - 1
    while b > a and silent(b): b -= 1
    keepn = int(keep * 22050)
    a = max(0, a - keepn); b = min(n, b + 1 + keepn)
    return pcm[a * width_bytes:(b + 1) * width_bytes]

def crossfade_edges(pcm, width_bytes, ms=12):
    """Fade in and out so a chunk cannot click against its neighbour."""
    n = len(pcm) // width_bytes
    f = max(1, int(0.012 * 22050))
    if n < 2 * f: return pcm
    out = bytearray(pcm)
    for i in range(f):
        g = i / f
        vi = struct.unpack_from('<h', out, i * width_bytes)[0]
        struct.pack_into('<h', out, i * width_bytes, int(vi * g))
        j = n - 1 - i
        vj = struct.unpack_from('<h', out, j * width_bytes)[0]
        struct.pack_into('<h', out, j * width_bytes, int(vj * g))
    return bytes(out)

# ── post-processing ──────────────────────────────────────────────
# Measured on the raw espeak output: the presence band (1.5–2.5 kHz) sat
# 11.5 dB BELOW the body, with a 26 dB hole at 2 kHz. That band carries
# consonant intelligibility, and that hole is what made the voice unfocusable
# — not the level, and not the brightness. So: fill the hole, add a little air,
# take the glare off, and even out the dynamics.

def _biquad(x, b0, b1, b2, a1, a2):
    """Direct Form I. Coefficients already normalised by a0."""
    y = [0.0] * len(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1 = x1, v
        y2, y1 = y1, o
        y[i] = o
    return y

def peaking(x, sr, f0, gain_db, q=0.9):
    A = 10 ** (gain_db / 40.0)
    w0 = 2 * math.pi * f0 / sr
    al = math.sin(w0) / (2 * q)
    c = math.cos(w0)
    a0 = 1 + al / A
    return _biquad(x, (1 + al * A) / a0, (-2 * c) / a0, (1 - al * A) / a0,
                   (-2 * c) / a0, (1 - al / A) / a0)

def high_shelf(x, sr, f0, gain_db):
    A = 10 ** (gain_db / 40.0)
    w0 = 2 * math.pi * f0 / sr
    c, s = math.cos(w0), math.sin(w0)
    al = s / 2 * math.sqrt(2)
    sq = 2 * math.sqrt(A) * al
    a0 = (A + 1) - (A - 1) * c + sq
    return _biquad(x,
        (A * ((A + 1) + (A - 1) * c + sq)) / a0,
        (-2 * A * ((A - 1) + (A + 1) * c)) / a0,
        (A * ((A + 1) + (A - 1) * c - sq)) / a0,
        (2 * ((A - 1) - (A + 1) * c)) / a0,
        ((A + 1) - (A - 1) * c - sq) / a0)

def lowpass(x, sr, f0, q=0.7071):
    w0 = 2 * math.pi * f0 / sr
    al = math.sin(w0) / (2 * q)
    c = math.cos(w0)
    a0 = 1 + al
    return _biquad(x, ((1 - c) / 2) / a0, (1 - c) / a0, ((1 - c) / 2) / a0,
                   (-2 * c) / a0, (1 - al) / a0)

def compress(x, sr, thresh_db=-22.0, ratio=3.0, atk=0.004, rel=0.18):
    th = 10 ** (thresh_db / 20.0)
    ca, cr = math.exp(-1 / (atk * sr)), math.exp(-1 / (rel * sr))
    envv = 0.0
    y = [0.0] * len(x)
    for i, v in enumerate(x):
        a = abs(v)
        envv = a if a > envv else ca * envv + (1 - ca) * a
        envv = envv if a > envv else cr * envv + (1 - cr) * envv
        g = 1.0
        if envv > th:
            over = envv / th
            g = (1 / over) ** (1.0 - 1.0 / ratio)
        y[i] = v * g
    return y

def polish(x, sr, presence_db=10.0, air_db=3.0, ceiling=0.89):
    x = peaking(x, sr, 2200, presence_db, q=0.9)
    x = peaking(x, sr, 3200, presence_db * 0.5, q=1.0)
    x = high_shelf(x, sr, 6500, air_db)
    x = lowpass(x, sr, 9500, q=0.7071)
    x = compress(x, sr)
    pk = max(abs(v) for v in x) or 1.0
    g = ceiling / pk
    # soft-clip the last 2% rather than hard-limit it
    return [math.tanh(v * g * 1.05) * 0.95 for v in x]

def main():
    src = sys.argv[1]
    out = sys.argv[2]
    rate = 125; voice = "ar"          # 140 was rushed; espeak Arabic reads better slower
    gap_s = 0.26
    if "--rate" in sys.argv:  rate = int(sys.argv[sys.argv.index("--rate") + 1])
    if "--voice" in sys.argv: voice = sys.argv[sys.argv.index("--voice") + 1]
    if "--gap" in sys.argv:   gap_s = float(sys.argv[sys.argv.index("--gap") + 1])

    tok = token()
    paras = strip_html(src)
    print(f"{len(paras)} paragraphs · voice {voice} · rate {rate} · gap {gap_s}s")

    SR = CH = WD = None
    pcm = bytearray()
    trimmed = 0
    for i, p in enumerate(paras, 1):
        if len(p) > 1900:
            p = p[:1900]
        try:
            raw = speak(p, tok, voice, rate)
            sr, ch, wd, chunk = parse_wav(raw)
        except Exception as e:
            print(f"  [{i:2d}] failed: {e}")
            continue
        # fmt[5] is BITS per sample (16), not bytes.
        if wd not in (8, 16, 24, 32) or ch < 1 or sr < 4000:
            print(f"  [{i:2d}] implausible format {sr}Hz/{ch}ch/{wd}bit — skipped")
            continue
        if SR is None:
            SR, CH, WD = sr, ch, wd
        if (sr, ch, wd) != (SR, CH, WD):
            print(f"  [{i:2d}] format changed to {sr}/{ch}/{wd} — skipped")
            continue
        wb = WD // 8
        before = len(chunk)
        chunk = trim_silence(chunk, wb)
        trimmed += before - len(chunk)
        if not chunk:
            print(f"  [{i:2d}] silent — skipped")
            continue
        pcm += crossfade_edges(chunk, wb)
        fb = CH * wb
        pcm += b'\x00' * int(gap_s * SR) * fb
        secs = len(pcm) / (SR * fb)
        print(f"  [{i:2d}] {len(p):4d} ch  raw {before/wb/SR:5.2f}s → used {len(chunk)/wb/SR:5.2f}s"
              f"  total {secs/60:5.2f}min  {p[:40]}…")

    if SR is None:
        raise SystemExit("no audio was produced — every request failed")
    fb = CH * (WD // 8)
    raw_bytes = len(pcm)

    # 16-bit signed PCM -> floats -> polish -> back
    n = len(pcm) // 2
    xs = list(struct.unpack('<%dh' % n, bytes(pcm)))
    f = polish([v / 32768 for v in xs], SR)
    pcm = bytearray(struct.pack('<%dh' % n, *[max(-32768, min(32767, int(v * 32768))) for v in f]))

    total = len(pcm) / (SR * fb)
    with wave.open(out, "wb") as o:
        o.setnchannels(CH); o.setsampwidth(WD // 8); o.setframerate(SR)
        o.writeframes(bytes(pcm))
    print(f"\ntrimmed {trimmed/SR/fb:.1f}s of dead air")
    print(f"polished: presence +10 dB @2.2k, air +3 dB @6.5k, lp 9.5k, 3:1 compression")
    print(f"wrote {out}  {int(total)//60}m {int(total)%60:02d}s  {SR}Hz mono")

if __name__ == "__main__":
    main()
