const TIME_UNITS = ['minutes', 'hours', 'seconds', 'min', 'hr', 'sec', 'mins', 'hrs', 'secs'];

export const isTimeUnit = (unit?: string): boolean =>
  !!unit && TIME_UNITS.some((u) => unit.toLowerCase() === u || unit.toLowerCase().startsWith(u));
