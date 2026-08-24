# Vue3 EZ-Tree Component Plan

> Spec-driven conversion of the existing `/src/app` demo into a bundled, embeddable Vue 3 single-file component.

## 1. Goal

Create a reusable Vue 3 component (`EzTreeView.vue`) that renders the procedural EZ-Tree in a Three.js scene:
- A single configurable tree at the scene origin.
- Simplified environment: grass ground and a skybox background.
- No wind/sunlight UI controls, no forest, no rocks, no clouds, no audio, no export UI.
- All assets (`bark`, `leaves`, `grass`, `ground` textures; `grass.glb`; skybox shaders) are bundled with Vite — no CDN or `/public` runtime assets.
- The component can be dropped into another Vue application as a tab/view.

## 2. Scope

### In scope
- New Vue 3 SFC under `src/components/EzTreeView.vue`.
- New lightweight environment classes (`Grass`, `Ground`, `Skybox`) based on the existing `src/app/environment.js`, `grass.js`, `ground.js`, and `skybox.js`, but simplified.
- Asset reorganization so Vite bundles all required image/model/shader files.
- Vite plugin/configuration updates so the Vue app builds to `dist/` and bundles everything.
- A small demo host page (`src/main.js` + `index.html`) so the component can be run standalone.
- TypeScript-compatible JSDoc / `.d.ts` emission via the existing `vite-plugin-dts`.
- `OrbitControls` exposure as a public prop, primarily for zooming (camera - tree distance), with sensible defaults.
- Full access to config settings of main tree via reactive props


### Out of scope
- UI panel (replaced by reactive props).
- Loading/splash screen.
- Forest/rocks/clouds/audio/export.
- Wind/sunlight runtime controls.
- `OrbitControls` exposure as a public prop (kept internal with sensible defaults).

## 3. Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Object` | `undefined` | **Reactive** EZ-Tree options object. When the prop changes (deeply), the tree is regenerated unless `autoGenerate` is `false`. Supports the full `TreeOptions` shape from `src/lib/options.js`. |
| `preset` | `String` | `undefined` | Name of a built-in preset (`'Ash Medium'`, `'Oak Large'`, etc.). If both `preset` and `options` change, the latest wins after initial mount. |
| `autoGenerate` | `Boolean` | `true` | If `false`, prop changes are reflected into the internal `TreeOptions` but `tree.generate()` is not called automatically. Useful for batch edits. Call `generate()` via template ref (exposed method). |
| `grassCount` | `Number` | `2000` | Number of rendered grass instances. `0` disables grass. |
| `skybox` | `Boolean` / `Object` | `true` | If `true`, default skybox. If an object, supports `{ sunAzimuth, sunElevation, sunColor, skyColorLow, skyColorHigh, sunSize }`. |
| `showGround` | `Boolean` | `true` | Toggle ground plane. |
| `shadows` | `Boolean` | `true` | Enable shadow mapping. |
| `cameraTarget` | `{ x, y, z }` | `{ x:0, y:25, z:0 }` | OrbitControls target. |
| `cameraPosition` | `{ x, y, z }` | `{ x:40, y:20, z:40 }` | Initial camera position. |

### Emits

| Event | Payload | When |
|-------|---------|------|
| `generate` | `{ vertices: number, triangles: number, ms: number }` | After each successful `tree.generate()` / `generateLODs()`. |
| `error` | `Error` | If tree generation or asset loading throws. |

### Exposed methods (template ref)

| Method | Description |
|--------|-------------|
| `generate()` | Forces a regeneration with current internal options. |
| `exportImage(type = 'image/png')` | Renders current view to a data URL. |
| `getTree()` | Returns the `Tree` instance for advanced users. |


### Debugging

Console.log messages for "start generate", "end generate", "orbit change"  and errors

## 4. Internal Architecture

```
EzTreeView.vue
├── <template>
│   └── <div ref="canvasContainer" class="ez-tree-view">
├── <script setup>
│   ├── imports: Vue, Three, OrbitControls, Tree, TreePreset, loadPresetWithTextures helpers
│   ├── props / emits / expose
│   ├── refs: container, renderer, scene, camera, controls, tree, environment
│   ├── lifecycle:
│   │   ├── onMounted  -> initScene(), loadInitialPresetOrOptions(), first generate()
│   │   ├── watch(props.options, deep) -> copyToInternal(), if autoGenerate then generate()
│   │   ├── watch(props.preset) -> loadPresetWithTextures(), generate()
│   │   ├── watch(props.grassCount / showGround / shadows / skybox) -> update environment
│   │   ├── watch(props.cameraTarget / cameraPosition) -> update camera
│   │   └── onBeforeUnmount -> dispose geometries/materials/textures, cancel rAF, remove resize listener
│   ├── animation loop -> render, controls.update(), tree.update(elapsedTime) for existing wind sway
│   └── resize handler -> renderer/camera sizes
```

### Asset loading helper
A small composable or plain module `src/components/use-tree-textures.js` will replace `src/app/textures.js` and load bundled assets using Vite-compatible URLs:

```js
import barkColor from '../assets/textures/bark/Bark001_1K-JPG/Bark001_1K-JPG_Color.jpg'
// …etc
new TextureLoader().load(new URL(barkColor, import.meta.url).href)
```

This guarantees no runtime 404s and no CDN in the final bundle.

## 5. Asset Layout

Move only the assets actually required by `EzTreeView.vue` from `src/app/public` into `src/assets` so Vite processes them:

```
src/assets/
├── textures/
│   ├── bark/
│   │   └── Bark001_1K-JPG/
│   │       ├── Bark001_1K-JPG_Color.jpg
│   │       ├── Bark001_1K-JPG_NormalGL.jpg
│   │       └── Bark001_1K-JPG_Roughness.jpg
│   ├── leaves/
│   │   ├── ash.png
│   │   ├── aspen.png
│   │   ├── oak.png
│   │   └── pine.png
│   └── ground/
│       ├── grass.jpg
│       ├── dirt_color.jpg
│       └── dirt_normal.jpg
├── models/
│   └── grass.glb
└── shaders/
    ├── skybox.frag
    └── skybox.vert
```

Only the default bark set (`Bark001`) is bundled by default; the helper will gracefully degrade to color-only if maps are missing.

## 6. Simplifications from original app

| Original feature | New behavior |
|------------------|--------------|
| Full UI module (`src/app/ui.js`) | Removed. Props + watchers drive all state. |
| Forest of 100 trees | Removed. Only one main tree. |
| Rocks / Clouds / audio | Removed. |
| Sun azimuth UI control | Internal fixed default; optional via `skybox` prop. |
| Wind strength UI control | Uses existing shader sway defaults from `Tree.createLeafMaterial()`. |
| Ground procedural shader | Simplified: use bundled grass/dirt textures with the existing shader but remove runtime options. |
| Grass flowers | Removed to avoid extra model dependencies; keep grass blade instancing. |
| GLTF/PNG export buttons | Removed. Optional `exportImage()` exposed method for snapshots. |
| `EffectComposer` + SMAA | Removed; rely on renderer antialias. Keeps bundle smaller. |

## 7. Configuration integration

The component consumes the same `TreeOptions` object the library uses. Internally it will:

1. Instantiate a fresh `TreeOptions()` as the baseline.
2. If `preset` is provided, `loadPresetWithTextures()` merges the preset (with bundled maps).
3. If `options` prop is provided, `TreeOptions.copy()` merges user-provided overrides on top.
4. Changes to `options` are watched deeply; regeneration is debounced 50 ms so rapid prop changes do not thrash the GPU.

Example host usage:

```vue
<script setup>
import { ref } from 'vue';
import EzTreeView from '@dgreenheck/ez-tree-vue';

const treeOptions = ref({
  seed: 42,
  type: 'deciduous',
  branch: { levels: 3 },
  leaves: { type: 'oak', tint: 0x6e8c3e },
});
</script>

<template>
  <EzTreeView
    :options="treeOptions"
    preset="Oak Medium"
    :grass-count="1500"
    :show-ground="true"
    :shadows="true"
    @generate="(stats) => console.log(stats)"
  />
</template>
```

## 8. Build artifacts

- `vite.app.config.js` will become the single app config for the Vue component demo.
- `vite.lib.config.js` will be updated to export the Vue component + library tree as an ES module / UMD package if desired.
- `package.json` scripts: `dev`, `build`, `build:lib`, `preview`.

## 9. Verification steps

1. `npm run build` completes without errors and emits a `dist/` folder containing all bundled assets.
2. `npm run preview` serves the component; the page shows one tree, grass, skybox.
3. A quick JSDoc typecheck with `npx tsc --noEmit -p tsconfig.json` passes.
4. No external network requests (no CDN) are made at runtime (verified via Network tab or `grep` for `http` in dist).

## 10. Open questions / possible modifications

- Should the component expose a `preset` prop or expect the host to pass the full options object?
- Should we keep a minimal built-in preset selector inside the component, or strictly props-driven?
- Do you want the grass/ground as separate Vue child components or kept as plain JS classes inside the SFC?
- Should default bark retain the multi-set switching capability, or is a single bundled bark set sufficient?

## 11. Required packages for a separate host app

When the component is used from a standalone Vue 3 app via `import EzTreeView from '/path/or/package/to/ez-tree-vue'`, the consuming app must install the following runtime and development dependencies:

| Package | Kind | Purpose |
|---------|------|---------|
| `vue` | `dependencies` | Vue 3 runtime required by the SFC. |
| `three` | `dependencies` | Core 3D library used throughout the tree generator and scene. |
| `vite` | `devDependencies` | Build tool for bundling the host app and the ES-module-compatible tree component. |
| `@vitejs/plugin-vue` | `devDependencies` | Compiles `.vue` single-file components. |
| `@types/three` | `devDependencies` | TypeScript definitions for Three.js (optional if the host app does not use TypeScript). |

The tree generator itself has no CDN or public-asset dependencies; all required textures, models, and shaders are bundled into the component by Vite. Therefore the host `vite` configuration only needs a standard Vue plugin setup and no special copy steps.

Example for a host `package.json`:

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "three": "^0.167.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "@types/three": "^0.169.0"
  }
}
```

If the component is published with declaration files, the host app should also reference its bundled `.d.ts` or install the published npm package normally.

## 12. Answers to open questions (topic 10)
- Expose a sensible default preset prop when none provided.
- Keep a minimal built-in preset select inside the component so it is usable standalone, but make it optional/conditional via a `showControls` prop.
- Grass/ground as plain JS classes used inside the SFC (not as separate Vue components).
- Single bundled bark set (`Bark001`) is sufficient; other bark variants can be added later by the host app supplying its own texture maps through the `options` prop.

Please review and apply any modifications. Once approved, I will generate the new code based on this plan.
