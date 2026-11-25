import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Evita fallos de tinypool con rutas Unicode (p. ej. "bursátiles")
    pool: 'forks',
    fileParallelism: false,
  },
});
