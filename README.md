# Copyright notice

This project is based upon @dgreenheck/ez-tree-vue which is MIT licensed.
Current implementation was assisted by *moonshotai/Kimi-K2.7-Code* and is MIT licensed 
as far as possible given the limitations of AI generated/modified content.


# @dgreenheck/ez-tree-vue

A Vue 3 wrapper around the procedural tree generator from `@dgreenheck/ez-tree`.

It renders a single configurable tree in a Three.js scene with bundled grass and skybox assets, so no CDN or runtime `public/` files are required.

## Installation

The host Vue 3 application must install:

```bash
npm install vue three
npm install -D vite @vitejs/plugin-vue @types/three
```

Then install this component package locally or from your npm registry.

## Usage

```vue
<script setup>
import { ref } from 'vue';
import { EzTreeView } from 'tree-component';

const options = ref({
  seed: 1234,
  type: 'deciduous',
  branch: { levels: 3 },
  leaves: { type: 'oak', tint: 0x6e8c3e },
});
</script>

<template>
  <EzTreeView
    :options="options"
    preset="Oak Medium"
    :grass-count="2000"
    :show-ground="true"
    :shadows="true"
    :show-controls="true"
    style="width: 100vw; height: 100vh;"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Object` | `{}` | Reactive EZ-Tree options object merged into the active preset. |
| `preset` | `String` | `null` | Built-in preset name (e.g. `'Oak Medium'`). |
| `autoGenerate` | `Boolean` | `true` | Regenerate the tree automatically when props change. |
| `grassCount` | `Number` | `2000` | Number of grass instances. |
| `skybox` | `Boolean` / `Object` | `true` | Skybox toggle or configuration (`sunAzimuth`, `sunElevation`, ...). |
| `showGround` | `Boolean` | `true` | Show ground plane. |
| `shadows` | `Boolean` | `true` | Enable shadow mapping. |
| `cameraTarget` | `Object` | `{x:0, y:25, z:0}` | OrbitControls target. |
| `cameraPosition` | `Object` | `{x:40, y:20, z:40}` | Initial camera position. |
| `showControls` | `Boolean` | `true` | Show a tiny built-in preset/seed control overlay. |
| `controlsPosition` | `String` | `'top-right'` | Position of the overlay. |

## Events

- `generate` — emitted after each tree generation. Payload: `{ vertices, triangles, ms }`.
- `error` — emitted for any runtime error during init or generation.

## Exposed methods

Use a template ref for advanced control:

```vue
<EzTreeView ref="treeView" ... />
```

- `generate()` — force regeneration with current options.
- `getTree()` — access the underlying `Tree` instance.

## Development

```bash
npm install
npm run dev      # run the local demo
npm run build    # build the demo app
npm run build:lib  # build the library bundle
npm run preview  # preview the production demo
```
