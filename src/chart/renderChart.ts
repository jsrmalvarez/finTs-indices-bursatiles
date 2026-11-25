import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from 'lightweight-charts';
import type { DailyBar } from '../data/types';

export interface ChartHandle {
  update(bars: DailyBar[]): void;
  destroy(): void;
}

const CHART_COLORS = {
  background: 'transparent',
  text: '#5c6670',
  grid: 'rgba(28, 36, 44, 0.06)',
  line: '#0f6e56',
  areaTop: 'rgba(15, 110, 86, 0.28)',
  areaBottom: 'rgba(15, 110, 86, 0.02)',
  crosshair: '#1c242c',
};

function toLineData(bars: DailyBar[]): LineData[] {
  return bars.map((bar) => ({
    time: bar.date as Time,
    value: bar.close,
  }));
}

export function mountChart(container: HTMLElement): ChartHandle {
  const chart: IChartApi = createChart(container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: CHART_COLORS.background },
      textColor: CHART_COLORS.text,
      fontFamily: 'Lato, system-ui, sans-serif',
    },
    grid: {
      vertLines: { color: CHART_COLORS.grid },
      horzLines: { color: CHART_COLORS.grid },
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: {
        color: CHART_COLORS.crosshair,
        labelBackgroundColor: CHART_COLORS.crosshair,
      },
      horzLine: {
        color: CHART_COLORS.crosshair,
        labelBackgroundColor: CHART_COLORS.crosshair,
      },
    },
    rightPriceScale: {
      borderVisible: false,
    },
    timeScale: {
      borderVisible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    localization: {
      locale: 'es-ES',
      priceFormatter: (price: number) =>
        new Intl.NumberFormat('es-ES', {
          maximumFractionDigits: price >= 1000 ? 2 : 4,
        }).format(price),
    },
  });

  const series: ISeriesApi<'Area'> = chart.addAreaSeries({
    lineColor: CHART_COLORS.line,
    topColor: CHART_COLORS.areaTop,
    bottomColor: CHART_COLORS.areaBottom,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
  });

  return {
    update(bars: DailyBar[]) {
      series.setData(toLineData(bars));
      chart.timeScale().fitContent();
    },
    destroy() {
      chart.remove();
    },
  };
}
