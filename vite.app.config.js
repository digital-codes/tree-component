import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@dgreenheck/ez-tree': resolve(__dirname, 'src/lib/index.js'),
    },
  },
  plugins: [vue()],
  assetsInclude: ['**/*.frag', '**/*.vert', '**/*.glb'],
});
