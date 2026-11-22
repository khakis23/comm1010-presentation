import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        presenter: resolve(import.meta.dirname, 'index.html'),
        voter: resolve(import.meta.dirname, 'vote.html'),
      },
    },
  },
});
