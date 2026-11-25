# Índices bursátiles

Sitio estático para consultar series **diarias históricas** de índices bursátiles (sin tiempo real). Interfaz en español de España (`es_ES`); todo el texto visible sale de etiquetas.

## Índices

| Id | Serie | Yahoo Finance |
| --- | --- | --- |
| `sp500` | S&P 500 | `^GSPC` |
| `djia` | Dow Jones Industrial Average | `^DJI` |
| `nasdaq` | NASDAQ Composite | `^IXIC` |
| `ibex35` | IBEX 35 | `^IBEX` |
| `eurostoxx50` | Euro Stoxx 50 | `^STOXX50E` |
| `msciWorld` | MSCI World (ETF URTH como proxy) | `URTH` |

Los datos se recortan por defecto hasta **2025-12-31**.

## Requisitos

- Node.js 18+
- npm

## Comandos

```bash
npm install

# Descargar CSV y generar JSON en public/data/
npm run data:refresh

# Desarrollo (servidor local)
npm run dev

# Tests
npm test

# Build de producción (salida en dist/, apto para GitHub Pages)
npm run build

# Previsualizar el build
npm run preview
```

Variables opcionales:

- `DATA_END_DATE=2025-12-31` — fecha de corte inclusiva para descarga/conversión.

## Despliegue estático

`npm run build` genera `dist/`. Puedes publicar esa carpeta en GitHub Pages, Netlify, Cloudflare Pages, etc. La base de Vite es relativa (`./`) para que funcione en subrutas.

## Estructura

- `src/labels/es_ES.ts` — textos de UI
- `src/data/` — tipos, carga y procesamiento
- `scripts/` — descarga y conversión de datos
- `public/data/` — JSON servido con el sitio
- `tests/` — Vitest
