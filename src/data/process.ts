import type { DailyBar, IndexDataFile, IndexSeries } from './types';
import type { IndexId } from '../labels/es_ES';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Normaliza una fecha a YYYY-MM-DD si es válida. */
export function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (ISO_DATE.test(trimmed)) {
    return trimmed;
  }

  // Stooq / algunos CSV: YYYY-MM-DD ya; otros: DD-MMM-YYYY o YYYYMMDD
  const ymd = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (ymd) {
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }

  const slash = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(trimmed);
  if (slash) {
    return `${slash[1]}-${slash[2].padStart(2, '0')}-${slash[3].padStart(2, '0')}`;
  }

  return null;
}

export function parseClose(raw: string): number | null {
  const value = Number.parseFloat(raw.trim().replace(',', ''));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * Parsea CSV diario con cabecera Date,Open,High,Low,Close,Volume
 * (formato Stooq / Yahoo).
 */
export function parseDailyCsv(csv: string): DailyBar[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].toLowerCase().split(',');
  const dateIdx = header.findIndex((h) => h === 'date' || h === 'fecha');
  const closeIdx = header.findIndex((h) => h === 'close' || h === 'cierre');

  if (dateIdx < 0 || closeIdx < 0) {
    throw new Error('CSV sin columnas Date/Close');
  }

  const bars: DailyBar[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',');
    const date = normalizeDate(cols[dateIdx] ?? '');
    const close = parseClose(cols[closeIdx] ?? '');
    if (!date || close === null) {
      continue;
    }
    bars.push({ date, close });
  }

  return sortBarsAscending(bars);
}

export function sortBarsAscending(bars: DailyBar[]): DailyBar[] {
  return [...bars].sort((a, b) => a.date.localeCompare(b.date));
}

/** Elimina duplicados conservando el último cierre del día. */
export function dedupeBars(bars: DailyBar[]): DailyBar[] {
  const map = new Map<string, number>();
  for (const bar of bars) {
    map.set(bar.date, bar.close);
  }
  return sortBarsAscending(
    [...map.entries()].map(([date, close]) => ({ date, close })),
  );
}

/** Recorta la serie para incluir solo fechas <= endDate (inclusive). */
export function clipToEndDate(bars: DailyBar[], endDate: string): DailyBar[] {
  return bars.filter((bar) => bar.date <= endDate);
}

/** Recorta la serie para incluir solo fechas >= startDate (inclusive). */
export function clipToStartDate(bars: DailyBar[], startDate: string): DailyBar[] {
  return bars.filter((bar) => bar.date >= startDate);
}

export function toDataFile(
  id: IndexId,
  name: string,
  currency: string,
  source: string,
  bars: DailyBar[],
): IndexDataFile {
  const clean = dedupeBars(bars);
  return {
    id,
    name,
    currency,
    source,
    from: clean[0]?.date ?? '',
    to: clean[clean.length - 1]?.date ?? '',
    dates: clean.map((b) => b.date),
    closes: clean.map((b) => b.close),
  };
}

export function fromDataFile(file: IndexDataFile): IndexSeries {
  const bars: DailyBar[] = file.dates.map((date, i) => ({
    date,
    close: file.closes[i]!,
  }));
  return { id: file.id, bars };
}

export interface SeriesStats {
  count: number;
  from: string;
  to: string;
  lastClose: number | null;
  minClose: number | null;
  maxClose: number | null;
}

export function computeStats(bars: DailyBar[]): SeriesStats {
  if (bars.length === 0) {
    return {
      count: 0,
      from: '',
      to: '',
      lastClose: null,
      minClose: null,
      maxClose: null,
    };
  }

  let minClose = bars[0]!.close;
  let maxClose = bars[0]!.close;
  for (const bar of bars) {
    if (bar.close < minClose) minClose = bar.close;
    if (bar.close > maxClose) maxClose = bar.close;
  }

  return {
    count: bars.length,
    from: bars[0]!.date,
    to: bars[bars.length - 1]!.date,
    lastClose: bars[bars.length - 1]!.close,
    minClose,
    maxClose,
  };
}

/** Formatea un número de cierre para es_ES. */
export function formatClose(value: number, locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 1000 ? 2 : 4,
    minimumFractionDigits: 2,
  }).format(value);
}

/** Formatea fecha ISO a presentación es_ES. */
export function formatDate(iso: string, locale = 'es-ES'): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
