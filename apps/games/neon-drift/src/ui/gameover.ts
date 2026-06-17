import { formatTime, getRankSuffix } from '../utils/format';
import { audio } from '../audio/engine';

export function showGameOver(
  gameTime: number, bestLap: number, topSpeed: number, rank: number,
  lapTimes: number[],
) {
  document.getElementById('game-over')!.style.display = 'flex';
  document.getElementById('final-time')!.textContent = formatTime(gameTime);
  document.getElementById('best-lap')!.textContent = formatTime(bestLap === Infinity ? gameTime : bestLap);
  document.getElementById('top-speed')!.textContent = topSpeed.toString();
  document.getElementById('final-position')!.textContent = getRankSuffix(rank);

  const breakdownEl = document.getElementById('lap-breakdown')!;
  if (lapTimes.length > 0) {
    let html = '<div style="margin-bottom:5px;color:#f80">LAP TIMES:</div>';
    lapTimes.forEach((t, i) => {
      const isBest = t === bestLap;
      html += `<div style="margin:3px 0">${i + 1}. <span style="color:${isBest ? '#0f0' : '#0ff'}">${formatTime(t)}</span>${isBest ? ' ⭐' : ''}</div>`;
    });
    breakdownEl.innerHTML = html;
  }

  audio.playRaceEnd();
}

export function hideGameOver() {
  document.getElementById('game-over')!.style.display = 'none';
}
