import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from 'lightweight-charts';
import type { DrawdownZone } from '../data/drawdowns';
import type { DailyBar } from '../data/types';

export interface ChartHandle {
  update(bars: DailyBar[]): void;
  setZones(zones: DrawdownZone[]): void;
  destroy(): void;
}

const CHART_COLORS = {
  background: 'transparent',
  text: '#5c6670',
  grid: 'rgba(28, 36, 44, 0.06)',
  line: '#0f6e56',
  crosshair: '#1c242c',
  band: 'rgba(120, 128, 136, 0.28)',
};

function toLineData(bars: DailyBar[]): LineData[] {
  return bars.map((bar) => ({
    time: bar.date as Time,
    value: bar.close,
  }));
}

export function mountChart(
  container: HTMLElement,
  bandsLayer: HTMLElement,
): ChartHandle {
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

  const series: ISeriesApi<'Line'> = chart.addLineSeries({
    color: CHART_COLORS.line,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: true,
  });

  let zones: DrawdownZone[] = [];

  const paintZones = (): void => {
    const timeScale = chart.timeScale();
    const paneWidth = timeScale.width();
    const halfBar = (timeScale.options().barSpacing ?? 6) / 2;
    bandsLayer.replaceChildren();

    for (const zone of zones) {
      const raw1 = timeScale.timeToCoordinate(zone.start as Time);
      const raw2 = timeScale.timeToCoordinate(zone.end as Time);

      if (raw1 === null && raw2 === null) {
        continue;
      }
      const x1 = raw1 === null ? 0 : Number(raw1);
      const x2 = raw2 === null ? paneWidth : Number(raw2);

      const left = Math.min(x1, x2) - halfBar;
      const right = Math.max(x1, x2) + halfBar;
      const width = Math.max(right - left, 1);
      if (right < 0 || left > paneWidth) {
        continue;
      }

      const band = document.createElement('div');
      band.className = 'chart-band';
      band.style.left = `${left}px`;
      band.style.width = `${width}px`;
      band.style.background = CHART_COLORS.band;
      bandsLayer.appendChild(band);
    }
  };

  chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
    paintZones();
  });
  chart.timeScale().subscribeVisibleTimeRangeChange(() => {
    paintZones();
  });

  const resizeObserver = new ResizeObserver(() => {
    paintZones();
  });
  resizeObserver.observe(container);

  return {
    update(bars: DailyBar[]) {
      series.setData(toLineData(bars));
      chart.timeScale().fitContent();
      requestAnimationFrame(paintZones);
    },
    setZones(nextZones: DrawdownZone[]) {
      zones = nextZones;
      paintZones();
    },
    destroy() {
      resizeObserver.disconnect();
      chart.remove();
      bandsLayer.replaceChildren();
    },
  };
}
