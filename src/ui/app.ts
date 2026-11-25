import { mountChart, type ChartHandle } from '../chart/renderChart';
import { computeStats, formatClose, formatDate } from '../data/process';
import { loadIndexSeries } from '../data/load';
import { INDEX_CATALOG } from '../data/types';
import { labels, type IndexId } from '../labels/es_ES';

const DEFAULT_INDEX: IndexId = 'sp500';

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
          <div class="chart-host" id="chart" role="img" aria-label="${labels.chartClose}"></div>
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
  const chart: ChartHandle = mountChart(chartHost);

  let requestId = 0;

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
        status.classList.add('error');
        status.textContent = labels.errorEmpty;
        chart.update([]);
        return;
      }

      chart.update(series.bars);
      const summary = computeStats(series.bars);
      setStat('lastClose', summary.lastClose === null ? '—' : formatClose(summary.lastClose));
      setStat('from', summary.from ? formatDate(summary.from) : '—');
      setStat('to', summary.to ? formatDate(summary.to) : '—');
      setStat('count', summary.count.toLocaleString('es-ES'));
      stats.hidden = false;
      status.hidden = true;
    } catch {
      if (current !== requestId) return;
      chart.update([]);
      status.classList.add('error');
      status.textContent = labels.errorLoad;
    }
  }

  function setStat(key: string, value: string): void {
    const el = stats.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = value;
  }

  select.value = DEFAULT_INDEX;
  select.addEventListener('change', () => {
    void showIndex(select.value as IndexId);
  });

  void showIndex(DEFAULT_INDEX);

  window.addEventListener(
    'beforeunload',
    () => {
      chart.destroy();
    },
    { once: true },
  );
}
