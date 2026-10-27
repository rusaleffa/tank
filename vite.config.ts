import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: './',

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@core': resolve(__dirname, 'src/core'),
            '@entities': resolve(__dirname, 'src/entities'),
            '@levels': resolve(__dirname, 'src/levels'),
        },
    },

    build: {
        target: 'es2022',
        sourcemap: true,
        minify: 'esbuild',
        outDir: 'dist',
        emptyOutDir: true,
    },

    server: {
        port: 5173,
        open: true,
        host: true,
    },

    preview: {
        port: 4173,
        open: true,
    },
});