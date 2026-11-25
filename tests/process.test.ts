import { describe, expect, it } from 'vitest';
import {
  clipToEndDate,
  computeStats,
  dedupeBars,
  formatClose,
  formatDate,
  fromDataFile,
  normalizeDate,
  parseClose,
  parseDailyCsv,
  sortBarsAscending,
  toDataFile,
} from '../src/data/process';
import type { DailyBar } from '../src/data/types';

const sampleCsv = `Date,Open,High,Low,Close,Volume
2020-01-02,100,110,99,105,1000
2020-01-03,105,108,101,102,1200
bad-row
2020-01-01,98,100,97,99,800
`;

describe('normalizeDate', () => {
  it('acepta ISO', () => {
    expect(normalizeDate('2025-12-31')).toBe('2025-12-31');
  });

  it('acepta YYYYMMDD', () => {
    expect(normalizeDate('20251231')).toBe('2025-12-31');
  });

  it('rechaza basura', () => {
    expect(normalizeDate('ayer')).toBeNull();
  });
});

describe('parseClose', () => {
  it('parsea números válidos', () => {
    expect(parseClose('1234.56')).toBe(1234.56);
  });

  it('rechaza no positivos', () => {
    expect(parseClose('0')).toBeNull();
    expect(parseClose('-1')).toBeNull();
    expect(parseClose('abc')).toBeNull();
  });
});

describe('parseDailyCsv', () => {
  it('parsea, limpia y ordena', () => {
    const bars = parseDailyCsv(sampleCsv);
    expect(bars.map((b) => b.date)).toEqual([
      '2020-01-01',
      '2020-01-02',
      '2020-01-03',
    ]);
    expect(bars[1]?.close).toBe(105);
  });

  it('falla sin cabecera Close', () => {
    expect(() => parseDailyCsv('Date,Open\n2020-01-01,1')).toThrow(/Close/i);
  });
});

describe('dedupe y clip', () => {
  const bars: DailyBar[] = [
    { date: '2024-01-01', close: 10 },
    { date: '2024-01-01', close: 11 },
    { date: '2025-06-01', close: 12 },
    { date: '2026-01-02', close: 13 },
  ];

  it('dedupe conserva el último del día', () => {
    expect(dedupeBars(bars)).toEqual([
      { date: '2024-01-01', close: 11 },
      { date: '2025-06-01', close: 12 },
      { date: '2026-01-02', close: 13 },
    ]);
  });

  it('recorta hasta fin de 2025', () => {
    expect(clipToEndDate(sortBarsAscending(bars), '2025-12-31').map((b) => b.date)).toEqual([
      '2024-01-01',
      '2024-01-01',
      '2025-06-01',
    ]);
  });
});

describe('to/from data file y stats', () => {
  it('roundtrip JSON compacto', () => {
    const bars: DailyBar[] = [
      { date: '2020-01-01', close: 100 },
      { date: '2020-01-02', close: 110 },
    ];
    const file = toDataFile('sp500', 'S&P 500', 'USD', 'test', bars);
    expect(file.from).toBe('2020-01-01');
    expect(file.to).toBe('2020-01-02');
    expect(fromDataFile(file).bars).toEqual(bars);
  });

  it('computeStats', () => {
    const stats = computeStats([
      { date: '2020-01-01', close: 100 },
      { date: '2020-01-02', close: 90 },
      { date: '2020-01-03', close: 120 },
    ]);
    expect(stats).toMatchObject({
      count: 3,
      from: '2020-01-01',
      to: '2020-01-03',
      lastClose: 120,
      minClose: 90,
      maxClose: 120,
    });
  });

  it('stats vacías', () => {
    expect(computeStats([])).toMatchObject({ count: 0, lastClose: null });
  });
});

describe('formatters es_ES', () => {
  it('formatea cierre y fecha', () => {
    expect(formatClose(1234.5)).toMatch(/1.?234/);
    expect(formatDate('2025-12-31')).toMatch(/2025/);
  });
});
