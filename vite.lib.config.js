import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

import.meta.dirname
const __dirname = new URL('.', import.meta.url).pathname;



export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'EzTreeVue',
      fileName: (format) => `ez-tree-vue.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'three'],
      output: {
        globals: {
          vue: 'Vue',
          three: 'THREE',
        },
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@dgreenheck/ez-tree': resolve(__dirname, 'src/lib/index.js'),
    },
  },
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json', insertTypesEntry: true, rollupTypes: true })],
  assetsInclude: ['**/*.frag', '**/*.vert', '**/*.glb'],
});
