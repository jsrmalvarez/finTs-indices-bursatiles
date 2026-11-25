import { describe, expect, it } from 'vitest';
import { getIndexMeta, INDEX_CATALOG } from '../src/data/types';
import { labels } from '../src/labels/es_ES';

describe('catálogo de índices', () => {
  it('tiene etiqueta es_ES para cada índice', () => {
    for (const meta of INDEX_CATALOG) {
      expect(labels.indices[meta.id]).toBeTruthy();
      expect(getIndexMeta(meta.id).yahooSymbol).toBeTruthy();
    }
  });

  it('incluye los mercados pedidos', () => {
    const ids = INDEX_CATALOG.map((m) => m.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'sp500',
        'djia',
        'nasdaq',
        'ibex35',
        'eurostoxx50',
        'msciWorld',
      ]),
    );
  });
});
