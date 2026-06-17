export function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${Math.floor(s).toString().padStart(2, '0')}.${Math.floor((s % 1) * 100).toString().padStart(2, '0')}`;
}

export function getRankSuffix(pos: number): string {
  const suffixes = ['1st', '2nd', '3rd', '4th', '5th'];
  return suffixes[pos - 1] || '1st';
}
