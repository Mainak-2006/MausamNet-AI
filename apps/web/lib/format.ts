export function formatCredibility(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  return `${Math.round(clamped)}/100`;
}

export function eventTagColor(eventType: string): string {
  const colors: Record<string, string> = {
    rainfall: '#3388ff',
    flood: '#0000cc',
    thunderstorm: '#ffcc00',
    heatwave: '#ff4444',
    strong_wind: '#44cc44',
    cyclone: '#9933cc',
    drought: '#ff8800',
    other: '#888888',
  };
  return colors[eventType] ?? '#888888';
}
