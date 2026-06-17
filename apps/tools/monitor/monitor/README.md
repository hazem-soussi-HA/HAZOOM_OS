# Sky Radar Monitor — Dashboard

Browser-only monitoring dashboard with radar visualization and export.

## Quick start
```bash
# serve locally
python3 -m http.server 8080
# open http://localhost:8080
```

## UI
- 6-sector radar (latency, packetLoss, jitter, throughput, errors, uptime)
- Auto-refresh every 2s with mock data
- Start / Pause / Reset controls
- Export JSON / CSV
- Ambient WebGL background

## Switching to live data
Replace `src/monitor.js` `generateSample()` with a fetch to your metric endpoint, e.g.:
```js
async function fetchMetrics() {
  var res = await fetch('https://your-metrics/api/now');
  var json = await res.json();
  return { timestamp: Date.now(), values: json };
}
```
Then call `addSample()` with that payload.

## Metric mapping (default mock ranges)
- latency: 0–150 ms
- packetLoss: 0–10 %
- jitter: 0–60 ms
- throughput: 0–100 Mbps
- errors: 0–20
- uptime: seconds

## Notes
- No external dependencies
- Self-contained (single HTML + JS + CSS)
- Works offline
