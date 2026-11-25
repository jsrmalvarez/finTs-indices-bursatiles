import { mountChart, type ChartHandle } from '../chart/renderChart';
import {
  computeDrawdownZones,
  formatDrawdownTooltip,
} from '../data/drawdowns';
import { computeStats, formatClose, formatDate } from '../data/process';
import { loadIndexSeries } from '../data/load';
import { INDEX_CATALOG, type DailyBar } from '../data/types';
import { labels, type IndexId } from '../labels/es_ES';

const DEFAULT_INDEX: IndexId = 'sp500';
const DEFAULT_DRAWDOWN_PCT = 5;

export function createApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="shell">
      <header class="hero">
        <h1 class="brand" aria-label="${labels.appTitle}">
          <span class="brand-financial">${labels.brandFinancial}</span>
          <span class="brand-transurfing">${labels.brandTransurfing}</span>
        </h1>
      </header>

      <section class="panel" aria-label="${labels.appTitle}">
        <div class="controls">
          <div class="field">
            <label for="index-select">${labels.selectIndex}</label>
            <select id="index-select">
              ${INDEX_CATALOG.map(
                (item) =>
                  `<option value="${item.id}">${labels.indices[item.id]}</option>`,
              ).join('')}
            </select>
          </div>

          <aside class="drawdown-panel" aria-labelledby="drawdown-title">
            <div class="drawdown-heading">
              <h2 id="drawdown-title" class="drawdown-title">${labels.drawdownTitle}</h2>
              <button
                type="button"
                class="help-tip"
                id="drawdown-help"
                aria-label="${labels.drawdownHelpAria}"
                aria-describedby="drawdown-tooltip"
              >?</button>
              <p class="help-tooltip" id="drawdown-tooltip" role="tooltip" hidden></p>
            </div>
            <div class="drawdown-slider">
              <label class="drawdown-slider-label" for="drawdown-n">
                <span class="visually-hidden">${labels.drawdownSliderLabel}</span>
                <span id="drawdown-n-value"></span>
              </label>
              <input
                type="range"
                id="drawdown-n"
                min="1"
                max="30"
                step="1"
                value="${DEFAULT_DRAWDOWN_PCT}"
              />
            </div>
          </aside>
        </div>

        <dl class="stats" id="stats" hidden>
          <div class="stat">
            <dt>${labels.lastClose}</dt>
            <dd data-stat="lastClose">—</dd>
          </div>
          <div class="stat">
            <dt>${labels.firstDate}</dt>
            <dd data-stat="from">—</dd>
          </div>
          <div class="stat">
            <dt>${labels.lastDate}</dt>
            <dd data-stat="to">—</dd>
          </div>
          <div class="stat">
            <dt>${labels.points}</dt>
            <dd data-stat="count">—</dd>
          </div>
        </dl>

        <div class="chart-wrap">
          <div class="chart-stack">
            <div class="chart-bands" id="chart-bands" aria-hidden="true"></div>
            <div class="chart-host" id="chart" role="img" aria-label="${labels.chartClose}"></div>
          </div>
          <div class="status" id="status">${labels.loading}</div>
        </div>
      </section>

      <p class="footer">${labels.footerNote}</p>
    </div>
  `;

  const select = root.querySelector<HTMLSelectElement>('#index-select')!;
  const status = root.querySelector<HTMLElement>('#status')!;
  const stats = root.querySelector<HTMLElement>('#stats')!;
  const chartHost = root.querySelector<HTMLElement>('#chart')!;
  const bandsLayer = root.querySelector<HTMLElement>('#chart-bands')!;
  const slider = root.querySelector<HTMLInputElement>('#drawdown-n')!;
  const sliderValue = root.querySelector<HTMLElement>('#drawdown-n-value')!;
  const helpBtn = root.querySelector<HTMLButtonElement>('#drawdown-help')!;
  const tooltip = root.querySelector<HTMLElement>('#drawdown-tooltip')!;
  const chart: ChartHandle = mountChart(chartHost, bandsLayer);

  let requestId = 0;
  let currentBars: DailyBar[] = [];

  function drawdownPercent(): number {
    return Number.parseInt(slider.value, 10);
  }

  function refreshDrawdownUi(): void {
    const n = drawdownPercent();
    sliderValue.textContent = `${n}${labels.drawdownPercentSuffix}`;
    tooltip.textContent = formatDrawdownTooltip(labels.drawdownTooltip, n);
    chart.setZones(computeDrawdownZones(currentBars, n));
  }

  async function showIndex(id: IndexId): Promise<void> {
    const current = ++requestId;
    status.hidden = false;
    status.classList.remove('error');
    status.textContent = labels.loading;
    stats.hidden = true;

    try {
      const series = await loadIndexSeries(id);
      if (current !== requestId) return;

      if (series.bars.length === 0) {
        currentBars = [];
        status.classList.add('error');
        status.textContent = labels.errorEmpty;
        chart.update([]);
        chart.setZones([]);
        return;
      }

      currentBars = series.bars;
      chart.update(series.bars);
      refreshDrawdownUi();
      const summary = computeStats(series.bars);
      setStat('lastClose', summary.lastClose === null ? '—' : formatClose(summary.lastClose));
      setStat('from', summary.from ? formatDate(summary.from) : '—');
      setStat('to', summary.to ? formatDate(summary.to) : '—');
      setStat('count', summary.count.toLocaleString('es-ES'));
      stats.hidden = false;
      status.hidden = true;
    } catch {
      if (current !== requestId) return;
      currentBars = [];
      chart.update([]);
      chart.setZones([]);
      status.classList.add('error');
      status.textContent = labels.errorLoad;
    }
  }

  function setStat(key: string, value: string): void {
    const el = stats.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = value;
  }

  function setTooltipOpen(open: boolean): void {
    tooltip.hidden = !open;
    helpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  select.value = DEFAULT_INDEX;
  select.addEventListener('change', () => {
    void showIndex(select.value as IndexId);
  });

  slider.addEventListener('input', () => {
    refreshDrawdownUi();
  });

  helpBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    setTooltipOpen(tooltip.hidden);
  });
  helpBtn.addEventListener('mouseenter', () => setTooltipOpen(true));
  helpBtn.addEventListener('mouseleave', () => setTooltipOpen(false));
  helpBtn.addEventListener('focus', () => setTooltipOpen(true));
  helpBtn.addEventListener('blur', () => setTooltipOpen(false));
  document.addEventListener('click', () => setTooltipOpen(false));

  refreshDrawdownUi();
  setTooltipOpen(false);
  void showIndex(DEFAULT_INDEX);

  window.addEventListener(
    'beforeunload',
    () => {
      chart.destroy();
    },
    { once: true },
  );
}
