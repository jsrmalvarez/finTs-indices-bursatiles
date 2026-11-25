import type { IndexId } from '../labels/es_ES';
import { fromDataFile } from './process';
import type { IndexDataFile, IndexSeries } from './types';

const cache = new Map<IndexId, IndexSeries>();

export async function loadIndexSeries(id: IndexId): Promise<IndexSeries> {
  const hit = cache.get(id);
  if (hit) {
    return hit;
  }

  const response = await fetch(`./data/${id}.json`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const file = (await response.json()) as IndexDataFile;
  if (file.id !== id || !Array.isArray(file.dates) || !Array.isArray(file.closes)) {
    throw new Error('Formato de datos inválido');
  }
  if (file.dates.length !== file.closes.length) {
    throw new Error('Fechas y cierres desalineados');
  }

  const series = fromDataFile(file);
  cache.set(id, series);
  return series;
}

export function clearSeriesCache(): void {
  cache.clear();
}
