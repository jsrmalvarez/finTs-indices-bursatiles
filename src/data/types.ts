import type { IndexId } from '../labels/es_ES';

/** Punto diario de cotización (cierre). */
export interface DailyBar {
  date: string;
  close: number;
}

/** Serie procesada lista para gráfica y métricas. */
export interface IndexSeries {
  id: IndexId;
  bars: DailyBar[];
}

/** Formato compacto servido como JSON estático. */
export interface IndexDataFile {
  id: IndexId;
  name: string;
  currency: string;
  source: string;
  from: string;
  to: string;
  /** Fechas ISO YYYY-MM-DD en orden ascendente. */
  dates: string[];
  /** Cierres alineados con dates. */
  closes: number[];
}

export interface IndexMeta {
  id: IndexId;
  /** Símbolo Yahoo Finance. */
  yahooSymbol: string;
  /** Nombre técnico para metadatos. */
  name: string;
  currency: string;
}

export const INDEX_CATALOG: readonly IndexMeta[] = [
  {
    id: 'sp500',
    yahooSymbol: '^GSPC',
    name: 'S&P 500',
    currency: 'USD',
  },
  {
    id: 'djia',
    yahooSymbol: '^DJI',
    name: 'Dow Jones Industrial Average',
    currency: 'USD',
  },
  {
    id: 'nasdaq',
    yahooSymbol: '^IXIC',
    name: 'NASDAQ Composite',
    currency: 'USD',
  },
  {
    id: 'ibex35',
    yahooSymbol: '^IBEX',
    name: 'IBEX 35',
    currency: 'EUR',
  },
  {
    id: 'eurostoxx50',
    yahooSymbol: '^STOXX50E',
    name: 'Euro Stoxx 50',
    currency: 'EUR',
  },
  {
    id: 'msciWorld',
    // ETF proxy líquido del MSCI World (serie diaria pública)
    yahooSymbol: 'URTH',
    name: 'MSCI World (URTH)',
    currency: 'USD',
  },
] as const;

export function getIndexMeta(id: IndexId): IndexMeta {
  const meta = INDEX_CATALOG.find((item) => item.id === id);
  if (!meta) {
    throw new Error(`Índice desconocido: ${id}`);
  }
  return meta;
}
