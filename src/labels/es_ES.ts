/** Etiquetas de interfaz en español de España (es_ES). */
export const labels = {
  appTitle: 'Índices bursátiles',
  appSubtitle: 'Series diarias históricas hasta el último año cerrado',
  selectIndex: 'Índice',
  selectIndexHint: 'Elige un índice para mostrar su cotización diaria de cierre',
  loading: 'Cargando datos…',
  errorLoad: 'No se han podido cargar los datos del índice.',
  errorEmpty: 'No hay datos disponibles para este índice.',
  rangeLabel: 'Periodo visible',
  lastClose: 'Último cierre',
  firstDate: 'Desde',
  lastDate: 'Hasta',
  points: 'Sesiones',
  chartClose: 'Cierre',
  chartDate: 'Fecha',
  footerNote: 'Datos históricos diarios. Sin cotización en tiempo real.',
  indices: {
    sp500: 'S&P 500',
    djia: 'Dow Jones (DJIA)',
    nasdaq: 'NASDAQ Composite',
    ibex35: 'IBEX 35',
    eurostoxx50: 'Euro Stoxx 50',
    msciWorld: 'MSCI World',
  },
} as const;

export type Labels = typeof labels;
export type IndexId = keyof typeof labels.indices;
