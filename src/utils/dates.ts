import { endOfMonth, endOfWeek, endOfYear, format, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

export type DateRangePreset = 'week' | 'month' | 'year';

export function toISODate(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export function getPresetRange(preset: DateRangePreset, now: Date = new Date()) {
  switch (preset) {
    case 'week': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return { from: toISODate(start), to: toISODate(end) };
    }
    case 'month': {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return { from: toISODate(start), to: toISODate(end) };
    }
    case 'year': {
      const start = startOfYear(now);
      const end = endOfYear(now);
      return { from: toISODate(start), to: toISODate(end) };
    }
  }
}

