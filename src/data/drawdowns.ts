import type { DailyBar } from './types';

/** Periodo en el que el cierre está a N% o más por debajo del ATH vigente. */
export interface DrawdownZone {
  /** Primera sesión del periodo (inclusive). */
  start: string;
  /** Última sesión del periodo (inclusive). */
  end: string;
}

/**
 * Calcula franjas de drawdown desde máximos históricos.
 *
 * Mientras el ATH vigente es A, el umbral es A * (1 - nPercent/100).
 * Una zona empieza en la primera sesión con cierre <= umbral y termina
 * en la última sesión aún bajo el umbral, al recuperarse por encima o
 * al marcarse un nuevo ATH.
 */
export function computeDrawdownZones(
  bars: DailyBar[],
  nPercent: number,
): DrawdownZone[] {
  if (bars.length === 0 || !Number.isFinite(nPercent) || nPercent <= 0) {
    return [];
  }

  const zones: DrawdownZone[] = [];
  let ath = Number.NEGATIVE_INFINITY;
  let zoneStart: string | null = null;

  const closeOpenZone = (endDate: string): void => {
    if (zoneStart !== null) {
      zones.push({ start: zoneStart, end: endDate });
      zoneStart = null;
    }
  };

  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i]!;
    const prevDate = i > 0 ? bars[i - 1]!.date : bar.date;

    if (bar.close > ath) {
      if (zoneStart !== null) {
        closeOpenZone(prevDate);
      }
      ath = bar.close;
      continue;
    }

    const threshold = ath * (1 - nPercent / 100);
    if (bar.close <= threshold) {
      if (zoneStart === null) {
        zoneStart = bar.date;
      }
    } else if (zoneStart !== null) {
      closeOpenZone(prevDate);
    }
  }

  if (zoneStart !== null) {
    closeOpenZone(bars[bars.length - 1]!.date);
  }

  return zones;
}

/** Sustituye `{n}` en la plantilla del tooltip. */
export function formatDrawdownTooltip(template: string, nPercent: number): string {
  return template.replaceAll('{n}', String(nPercent));
}
