import { eventTagColor, formatCredibility } from './format';

describe('formatCredibility', () => {
  it('formats a score to /100', () => {
    expect(formatCredibility(85.4)).toBe('85/100');
  });

  it('clamps out-of-range scores', () => {
    expect(formatCredibility(-10)).toBe('0/100');
    expect(formatCredibility(150)).toBe('100/100');
  });
});

describe('eventTagColor', () => {
  it('maps known event types to colors', () => {
    expect(eventTagColor('rainfall')).toBe('#3388ff');
    expect(eventTagColor('cyclone')).toBe('#9933cc');
  });

  it('falls back to gray for unknown types', () => {
    expect(eventTagColor('unknown')).toBe('#888888');
  });
});
