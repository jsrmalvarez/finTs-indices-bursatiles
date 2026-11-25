/**
 * Descarga series diarias históricas desde Yahoo Finance (chart API).
 * Escribe CSV Date,Open,High,Low,Close,Volume en data/raw/<id>.csv
 *
 * Corte por defecto: hasta 2025-12-31.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEX_CATALOG } from '../src/data/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');

const END_DATE = process.env.DATA_END_DATE ?? '2025-12-31';
const START_DATE = process.env.DATA_START_DATE ?? '1950-01-01';
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface YahooChartResponse {
  chart: {
    result: Array<{
      timestamp?: number[];
      indicators: {
        quote: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
}

function toUnix(dateIso: string): number {
  return Math.floor(Date.parse(`${dateIso}T00:00:00Z`) / 1000);
}

function utcDateFromUnix(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function chartUrl(symbol: string, period1: number, period2: number): string {
  const params = new URLSearchParams({
    period1: String(period1),
    period2: String(period2),
    interval: '1d',
    events: 'history',
    includeAdjustedClose: 'true',
  });
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, attempts = 8): Promise<Response> {
  let lastStatus = 0;
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
      if (response.status === 429 || response.status >= 500) {
        lastStatus = response.status;
        const wait = 4000 * (i + 1);
        console.warn(`\n  reintento ${i + 1}/${attempts} (HTTP ${response.status}, espera ${wait}ms)`);
        await sleep(wait);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      await sleep(4000 * (i + 1));
    }
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`HTTP ${lastStatus || 'desconocido'} tras ${attempts} intentos`);
}

async function downloadSymbol(symbol: string): Promise<string> {
  const period1 = toUnix(START_DATE);
  // Fin exclusivo del día siguiente en UTC para no perder la sesión del END_DATE
  // (p. ej. cierre USA 31-dic a las 14:30Z).
  const period2 = toUnix(END_DATE) + 24 * 3600;
  const response = await fetchWithRetry(chartUrl(symbol, period1, period2));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} para ${symbol}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  if (payload.chart.error) {
    throw new Error(`${payload.chart.error.code}: ${payload.chart.error.description}`);
  }

  const result = payload.chart.result?.[0];
  if (!result?.timestamp?.length) {
    throw new Error(`Sin datos para ${symbol}`);
  }

  const quote = result.indicators.quote[0];
  const rows: string[] = [];

  for (let i = 0; i < result.timestamp.length; i += 1) {
    const close = quote.close?.[i];
    if (close == null || !Number.isFinite(close) || close <= 0) {
      continue;
    }
    const date = utcDateFromUnix(result.timestamp[i]!);
    if (date < START_DATE || date > END_DATE) {
      continue;
    }
    const open = quote.open?.[i] ?? close;
    const high = quote.high?.[i] ?? close;
    const low = quote.low?.[i] ?? close;
    const volume = quote.volume?.[i] ?? 0;
    rows.push([date, open, high, low, close, volume ?? 0].join(','));
  }

  if (rows.length === 0) {
    throw new Error(`Serie vacía tras filtrar ${symbol}`);
  }

  return `Date,Open,High,Low,Close,Volume\n${rows.join('\n')}\n`;
}

async function main(): Promise<void> {
  await mkdir(RAW_DIR, { recursive: true });
  console.log(`Descargando índices Yahoo Finance (diario, ${START_DATE} → ${END_DATE})…`);

  for (const meta of INDEX_CATALOG) {
    process.stdout.write(`  ${meta.id} (${meta.yahooSymbol})… `);
    try {
      const csv = await downloadSymbol(meta.yahooSymbol);
      const outPath = path.join(RAW_DIR, `${meta.id}.csv`);
      await writeFile(outPath, csv, 'utf8');
      const lines = csv.trim().split(/\r?\n/).length - 1;
      const first = csv.split('\n')[1]?.slice(0, 10) ?? '?';
      const last = csv.trim().split('\n').at(-1)?.slice(0, 10) ?? '?';
      console.log(`ok (${lines} sesiones, ${first} → ${last})`);
    } catch (error) {
      console.log('ERROR');
      console.error(error);
      process.exitCode = 1;
    }

    await sleep(2500);
  }
}

main();
