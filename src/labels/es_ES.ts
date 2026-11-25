/** Etiquetas de interfaz en español de España (es_ES). */
export const labels = {
  /** Nombre completo accesible / <title>. */
  appTitle: 'Financial Transurfing',
  /** Línea 1 de marca (Lato, mayúsculas como en el logo). */
  brandFinancial: 'FINANCIAL',
  /** Línea 2 de marca (Satisfy, capitalización del logo). */
  brandTransurfing: 'Transurfing',
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
  drawdownTitle: 'Pérdidas desde máximos históricos',
  drawdownHelpAria: 'Qué significan las zonas grises',
  /** Plantilla: `{n}` se sustituye por el porcentaje del control. */
  drawdownTooltip:
    'En gris se marcan los periodos en los que el índice ha bajado un {n}% o más desde el máximo histórico anterior',
  drawdownSliderLabel: 'Umbral de pérdida',
  drawdownPercentSuffix: ' %',
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
