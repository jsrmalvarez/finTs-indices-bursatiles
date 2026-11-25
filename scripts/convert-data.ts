/**
 * Convierte CSV de data/raw a JSON compacto en public/data.
 * Aplica dedupe, orden ascendente y recorte hasta DATA_END_DATE.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clipToEndDate,
  parseDailyCsv,
  toDataFile,
} from '../src/data/process.ts';
import { INDEX_CATALOG } from '../src/data/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const OUT_DIR = path.join(ROOT, 'public', 'data');

const END_DATE = process.env.DATA_END_DATE ?? '2025-12-31';

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Convirtiendo a JSON (hasta ${END_DATE})…`);

  const manifest: Array<{
    id: string;
    from: string;
    to: string;
    points: number;
  }> = [];

  for (const meta of INDEX_CATALOG) {
    const rawPath = path.join(RAW_DIR, `${meta.id}.csv`);
    process.stdout.write(`  ${meta.id}… `);

    try {
      const csv = await readFile(rawPath, 'utf8');
      const bars = clipToEndDate(parseDailyCsv(csv), END_DATE);
      const file = toDataFile(
        meta.id,
        meta.name,
        meta.currency,
        `yahoo:${meta.yahooSymbol}`,
        bars,
      );

      await writeFile(
        path.join(OUT_DIR, `${meta.id}.json`),
        `${JSON.stringify(file)}\n`,
        'utf8',
      );

      manifest.push({
        id: meta.id,
        from: file.from,
        to: file.to,
        points: file.dates.length,
      });

      console.log(`${file.from} → ${file.to} (${file.dates.length} sesiones)`);
    } catch (error) {
      console.log('ERROR');
      console.error(error);
      process.exitCode = 1;
    }
  }

  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify({ endDate: END_DATE, indices: manifest }, null, 2)}\n`,
    'utf8',
  );

  console.log('Listo: public/data/');
}

main();
