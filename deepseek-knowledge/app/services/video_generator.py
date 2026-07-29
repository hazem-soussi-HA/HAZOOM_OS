import os, uuid, tempfile, subprocess, asyncio, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from gtts import gTTS
from app.core.config import get_settings

settings = get_settings()

COLORS = [
    (10, 10, 40), (15, 10, 50), (20, 8, 45), (12, 15, 55),
    (8, 20, 48), (18, 12, 52), (14, 14, 60), (10, 18, 50),
]


class VideoGeneratorService:

    async def generate_video(self, script: str, title: str) -> dict:
        job_id = str(uuid.uuid4())[:8]
        out_dir = Path(settings.VIDEO_STORAGE_PATH)
        out_dir.mkdir(parents=True, exist_ok=True)
        output_path = out_dir / f"{job_id}.mp4"
        temp_dir = Path(tempfile.mkdtemp())

        try:
            segments = self._segment_script(script)
            audio_paths = []
            frame_paths = []
            durations = []

            for idx, seg in enumerate(segments):
                audio_path = temp_dir / f"audio_{idx:03d}.mp3"
                tts = gTTS(text=seg, lang="en", slow=False)
                tts.save(str(audio_path))
                audio_paths.append(audio_path)

                probe = await asyncio.create_subprocess_exec(
                    settings.FFMPEG_PATH, "-i", str(audio_path),
                    "-f", "null", "-",
                    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
                )
                _, stderr = await probe.communicate()
                dur = self._parse_duration(stderr.decode())
                if dur < 1.5:
                    dur = 2.0
                durations.append(dur)

                frame_path = temp_dir / f"frame_{idx:03d}.png"
                self._create_frame(
                    str(frame_path), seg, title,
                    idx, len(segments), dur,
                )
                frame_paths.append(frame_path)

            self._compose_video(
                str(output_path), frame_paths, audio_paths, durations,
            )

            size = os.path.getsize(output_path)
            return {
                "job_id": job_id,
                "path": str(output_path),
                "size": size,
                "url": f"/videos/download/{job_id}",
                "segments": len(segments),
                "duration": sum(durations),
            }

        finally:
            for f in frame_paths:
                f.unlink(missing_ok=True)
            for a in audio_paths:
                a.unlink(missing_ok=True)
            os.rmdir(temp_dir)

    def _segment_script(self, text: str) -> list:
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        return [s.strip() for s in sentences if s.strip()]

    def _create_frame(
        self, path: str, text: str, title: str,
        idx: int, total: int, duration: float,
    ):
        w, h = 640, 360
        bg = COLORS[idx % len(COLORS)]
        img = Image.new("RGB", (w, h), bg)
        draw = ImageDraw.Draw(img)

        try:
            title_font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22
            )
            body_font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18
            )
            small_font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12
            )
        except Exception:
            title_font = body_font = small_font = ImageFont.load_default()

        draw.text((20, 12), title, fill=(100, 180, 255), font=title_font)

        lines = self._wrap_text(text, body_font, w - 40)
        y_start = 80
        for i, line in enumerate(lines):
            draw.text((30, y_start + i * 30), line, fill=(220, 230, 255), font=body_font)

        progress = int((idx + 1) / total * w)
        bar_y = h - 6
        draw.rectangle([0, bar_y, w, bar_y + 4], fill=(30, 30, 60))
        draw.rectangle([0, bar_y, progress, bar_y + 4], fill=(33, 150, 243))

        page_text = f"{idx + 1} / {total}"
        bbox = draw.textbbox((0, 0), page_text, font=small_font)
        tw = bbox[2] - bbox[0]
        draw.text((w - tw - 12, h - 28), page_text, fill=(150, 170, 200), font=small_font)

        img.save(path, "PNG")

    def _wrap_text(self, text: str, font, max_width: int) -> list:
        words = text.split()
        lines = []
        current = []
        for word in words:
            test = " ".join(current + [word])
            bbox = font.getbbox(test)
            if bbox[2] > max_width and current:
                lines.append(" ".join(current))
                current = [word]
            else:
                current.append(word)
        if current:
            lines.append(" ".join(current))
        return lines if lines else [text]

    def _compose_video(
        self, output: str, frames: list,
        audios: list, durations: list,
    ):
        temp_dir = Path(frames[0]).parent
        concat_file = temp_dir / "concat.txt"

        with open(concat_file, "w") as f:
            for fp, dur in zip(frames, durations):
                f.write(f"file '{fp}'\nduration {dur:.2f}\n")

        video_raw = temp_dir / "video_raw.mp4"
        subprocess.run(
            [
                settings.FFMPEG_PATH, "-y", "-f", "concat", "-safe", "0",
                "-i", str(concat_file),
                "-c:v", "libx264", "-preset", "medium",
                "-crf", "30", "-pix_fmt", "yuv420p",
                "-r", "12",
                "-vf", "scale=640:360",
                "-an", str(video_raw),
            ],
            capture_output=True, check=False,
        )

        audio_list = temp_dir / "audio_list.txt"
        with open(audio_list, "w") as f:
            for ap in audios:
                f.write(f"file '{ap}'\n")

        audio_mixed = temp_dir / "audio_mixed.mp3"
        subprocess.run(
            [
                settings.FFMPEG_PATH, "-y", "-f", "concat", "-safe", "0",
                "-i", str(audio_list),
                "-c", "copy", str(audio_mixed),
            ],
            capture_output=True, check=False,
        )

        subprocess.run(
            [
                settings.FFMPEG_PATH, "-y",
                "-i", str(video_raw), "-i", str(audio_mixed),
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "64k",
                "-shortest",
                "-movflags", "+faststart",
                str(output),
            ],
            capture_output=True, check=False,
        )

        video_raw.unlink(missing_ok=True)
        audio_mixed.unlink(missing_ok=True)
        concat_file.unlink(missing_ok=True)
        audio_list.unlink(missing_ok=True)

    def _parse_duration(self, ffmpeg_stderr: str) -> float:
        import re
        match = re.search(r"Duration: (\d+):(\d+):(\d+)\.(\d+)", ffmpeg_stderr)
        if match:
            h, m, s, ms = map(int, match.groups())
            return h * 3600 + m * 60 + s + ms / 100
        return 2.0
