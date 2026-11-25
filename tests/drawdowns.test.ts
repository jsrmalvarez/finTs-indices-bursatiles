import { describe, expect, it } from 'vitest';
import {
  computeDrawdownSessionStats,
  computeDrawdownZones,
  formatDrawdownSessionsStat,
  formatDrawdownTooltip,
} from '../src/data/drawdowns';
import type { DailyBar } from '../src/data/types';

function bars(values: Array<[string, number]>): DailyBar[] {
  return values.map(([date, close]) => ({ date, close }));
}

describe('computeDrawdownZones', () => {
  it('marca zona bajo el umbral del ATH y la cierra al recuperar', () => {
    const data = bars([
      ['2003-05-08', 100],
      ['2003-05-09', 98],
      ['2003-05-10', 95],
      ['2003-05-11', 94],
      ['2003-05-12', 96],
      ['2003-05-13', 97],
    ]);

    expect(computeDrawdownZones(data, 5)).toEqual([
      { start: '2003-05-10', end: '2003-05-11' },
    ]);
  });

  it('abre una nueva zona si vuelve a caer antes del siguiente ATH', () => {
    const data = bars([
      ['2003-05-08', 100],
      ['2003-05-09', 94],
      ['2003-05-10', 96],
      ['2003-05-11', 93],
      ['2003-05-12', 101],
    ]);

    expect(computeDrawdownZones(data, 5)).toEqual([
      { start: '2003-05-09', end: '2003-05-09' },
      { start: '2003-05-11', end: '2003-05-11' },
    ]);
  });

  it('cierra la zona al marcar un nuevo ATH', () => {
    const data = bars([
      ['2003-05-08', 100],
      ['2003-05-09', 90],
      ['2003-05-10', 91],
      ['2003-05-11', 110],
    ]);

    expect(computeDrawdownZones(data, 5)).toEqual([
      { start: '2003-05-09', end: '2003-05-10' },
    ]);
  });

  it('devuelve vacío si no hay drawdown suficiente', () => {
    const data = bars([
      ['2003-05-08', 100],
      ['2003-05-09', 99],
      ['2003-05-10', 98],
    ]);
    expect(computeDrawdownZones(data, 5)).toEqual([]);
  });

  it('tolera series vacías o N inválida', () => {
    expect(computeDrawdownZones([], 5)).toEqual([]);
    expect(computeDrawdownZones(bars([['2003-05-08', 100]]), 0)).toEqual([]);
  });
});

describe('formatDrawdownTooltip', () => {
  it('interpola N', () => {
    expect(formatDrawdownTooltip('bajado un {n}% o más', 5)).toBe(
      'bajado un 5% o más',
    );
  });
});

describe('computeDrawdownSessionStats', () => {
  it('cuenta sesiones en zonas y redondea el porcentaje a entero', () => {
    const data = bars([
      ['2003-05-08', 100],
      ['2003-05-09', 94],
      ['2003-05-10', 96],
      ['2003-05-11', 93],
      ['2003-05-12', 101],
    ]);
    const zones = computeDrawdownZones(data, 5);
    expect(computeDrawdownSessionStats(data, zones)).toEqual({
      inZones: 2,
      total: 5,
      percentOfTime: 40,
    });
  });

  it('formatea la etiqueta de sesiones', () => {
    expect(
      formatDrawdownSessionsStat('Sesiones: {count} ({pct}% del tiempo)', {
        inZones: 1238,
        total: 4000,
        percentOfTime: 32,
      }),
    ).toBe('Sesiones: 1238 (32% del tiempo)');
  });
});
