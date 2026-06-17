import { formatTime, getRankSuffix } from '../utils/format';

export function updateHUD(
  speedKmh: number, nitro: number, lap: number,
  gameTime: number, currentLapTime: number, rank: number,
) {
  document.getElementById('speed-number')!.textContent = speedKmh.toString();
  document.getElementById('nitro-fill')!.style.width = nitro + '%';
  document.getElementById('lap')!.textContent = lap.toString();
  document.getElementById('time')!.textContent = formatTime(gameTime);
  document.getElementById('current-lap')!.textContent = formatTime(currentLapTime);
  document.getElementById('rank-badge')!.textContent = getRankSuffix(rank);
}

export function updateLapTimes(lapTimes: number[], bestLap: number) {
  const el = document.getElementById('lap-times');
  if (!el || lapTimes.length === 0) return;
  el.innerHTML = lapTimes.map((t, i) =>
    `<div style="color:${t === bestLap ? '#0f0' : '#0ff'}">L${i + 1}: ${formatTime(t)}${t === bestLap ? ' ⭐' : ''}</div>`
  ).join('');
}
