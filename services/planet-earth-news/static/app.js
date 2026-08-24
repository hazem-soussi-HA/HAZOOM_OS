"use strict";

const els = {
  home: document.getElementById("home"),
  articles: document.getElementById("articles"),
  videos: document.getElementById("videos"),
  artCount: document.getElementById("art-count"),
  vidCount: document.getElementById("vid-count"),
  status: document.getElementById("status"),
  health: document.getElementById("health"),
  posture: document.getElementById("posture"),
  search: document.getElementById("search"),
  q: document.getElementById("q"),
  refresh: document.getElementById("refresh"),
  lightbox: document.getElementById("lightbox"),
  lbVideo: document.getElementById("lb-video"),
  lbTitle: document.getElementById("lb-title"),
};

// Extract a YouTube video id from a watch/embed/short URL. Returns "" if none.
function ytId(url) {
  const m = String(url || "").match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : "";
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function relTime(iso) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (isNaN(t)) return esc(iso);
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

function render(items) {
  const articles = items.filter((i) => i.kind !== "video");
  const videos = items.filter((i) => i.kind === "video");

  els.artCount.textContent = articles.length;
  els.vidCount.textContent = videos.length;

  els.articles.innerHTML = articles.length
    ? articles.map(articleCard).join("")
    : '<div class="empty">No headlines match.</div>';
  els.videos.innerHTML = videos.length
    ? videos.map(videoCard).join("")
    : '<div class="empty">No videos match.</div>';
}

function verifiedBadge(i) {
  if (i.hz_t && i.hz_sig) {
    return '<span class="vbadge" title="hazoom-signed provenance · ' + esc(i.hz_t) + '">✓ signed</span>';
  }
  return "";
}

function articleCard(i) {
  return `<div class="card">
    <a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.title)}</a>
    <div class="meta"><span class="src">${esc(i.source)}</span>${verifiedBadge(i)}<span>${relTime(i.published)}</span></div>
    ${i.summary ? `<div class="sum">${esc(i.summary)}</div>` : ""}
  </div>`;
}

function videoCard(i) {
  const vid = ytId(i.link);
  // If we can embed it, make the card open the in-page lightbox; otherwise
  // fall back to opening the original link in a new tab.
  const openAttr = vid
    ? `class="play" data-vid="${esc(vid)}" data-title="${esc(i.title)}" role="button" tabindex="0"`
    : `href="${esc(i.link)}" target="_blank" rel="noopener"`;
  const thumb = i.thumbnail
    ? `<a ${openAttr}><img src="${esc(i.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer" />${vid ? '<span class="play-ic">▶</span>' : ""}</a>`
    : "";
  return `<div class="card video">
    ${thumb}
    <div>
      <a ${openAttr}>${esc(i.title)}</a>
      <div class="meta"><span class="src">${esc(i.source)}</span>${verifiedBadge(i)}<span>${relTime(i.published)}</span></div>
    </div>
  </div>`;
}

// --- in-page video lightbox -------------------------------------------------
function openVideo(vid, title) {
  if (!vid) return;
  const origin = window.location.origin;
  els.lbVideo.innerHTML =
    '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(vid) +
    '?autoplay=1&rel=0&origin=' + encodeURIComponent(origin) +
    '" title="' + esc(title) + '" allow="autoplay; encrypted-media; picture-in-picture" ' +
    'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>';
  els.lbTitle.textContent = title || "Watch on YouTube";
  els.lbTitle.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(vid);
  els.lightbox.hidden = false;
  els.lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeVideo() {
  els.lightbox.hidden = true;
  els.lightbox.setAttribute("aria-hidden", "true");
  els.lbVideo.innerHTML = "";  // stop playback + drop the YouTube connection
  document.body.style.overflow = "";
}

function renderPosture(sec, statuses) {
  if (!sec) return;
  const chips = [];
  // Bind posture
  if (sec.lan_exposed) {
    chips.push(`<span class="chip danger"><span class="dot"></span>LAN exposed · <b>${esc(sec.bind)}</b></span>`);
  } else {
    chips.push(`<span class="chip"><span class="dot"></span>Loopback · <b>${esc(sec.bind)}</b></span>`);
  }
  // SSRF / redirect guards
  chips.push(`<span class="chip"><span class="dot"></span>SSRF guard <b>on</b></span>`);
  chips.push(`<span class="chip"><span class="dot"></span>Redirect guard <b>on</b></span>`);
  chips.push(`<span class="chip"><span class="dot"></span>Payload cap <b>${Math.round(sec.payload_cap / 1024 / 1024)} MB</b></span>`);

  // Per-source health pills
  if (Array.isArray(statuses)) {
    const ok = statuses.filter((s) => s.ok).length;
    const total = statuses.length;
    const cls = ok === total ? "" : ok === 0 ? "danger" : "warn";
    chips.push(`<span class="chip ${cls}"><span class="dot"></span>Sources <b>${ok}/${total}</b> live</span>`);
  }
  els.posture.innerHTML = chips.join("");
}

function renderSourceErrors(errs) {
  if (!Array.isArray(errs) || !errs.length) return;
  const items = errs.map((e) => `${esc(e.source)}: ${esc(e.error)}`).join(" · ");
  els.status.className = "status err";
  return "⚠ " + items;
}

async function load(q = "", fresh = false) {
  els.status.textContent = "Fetching the world…";
  els.status.className = "status";
  // skeleton placeholders
  els.articles.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  els.videos.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  try {
    const url = "/api/feed" + (q ? "?q=" + encodeURIComponent(q) : "") +
      (fresh ? (q ? "&" : "?") + "fresh=1" : "");
    const headers = {};
    if (window.PEN_TOKEN) headers["Authorization"] = "Bearer " + window.PEN_TOKEN;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("API " + res.status);
    const data = await res.json();

    render(data.items || []);
    renderPosture(data.security, data.source_status);

    const errs = data.source_errors || [];
    let msg = `Loaded ${data.count} items · ${data.sources_configured} sources configured · ${data.generated_at}`;
    const errMsg = renderSourceErrors(errs);
    if (errMsg) msg += " · " + errMsg;
    els.status.textContent = msg;
    els.health.textContent = "● API healthy";
  } catch (e) {
    els.articles.innerHTML = "";
    els.videos.innerHTML = "";
    els.status.className = "status err";
    els.status.textContent = "Failed to reach backend: " + e.message;
    els.health.textContent = "● API down";
  }
}

// Real refresh: clear the search box, go back to the homepage view, and fetch
// fresh (bypass the in-process cache) — exactly what clicking the globe does.
function refreshAll() {
  els.q.value = "";
  load("", true);
}

els.search.addEventListener("submit", (ev) => {
  ev.preventDefault();
  load(els.q.value.trim());
});
els.refresh.addEventListener("click", refreshAll);
els.home.addEventListener("click", refreshAll);

// Open the lightbox from any video card (event delegation on the videos grid).
function playFromTarget(t) {
  const trigger = t.closest ? t.closest(".play") : null;
  if (trigger) {
    openVideo(trigger.getAttribute("data-vid"), trigger.getAttribute("data-title"));
    return true;
  }
  return false;
}
els.videos.addEventListener("click", (ev) => {
  if (playFromTarget(ev.target)) ev.preventDefault();
});
els.videos.addEventListener("keydown", (ev) => {
  if ((ev.key === "Enter" || ev.key === " ") && playFromTarget(ev.target)) ev.preventDefault();
});
els.lightbox.addEventListener("click", (ev) => {
  if (ev.target.hasAttribute("data-close")) closeVideo();
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !els.lightbox.hidden) closeVideo();
});

load();
