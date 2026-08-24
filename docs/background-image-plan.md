# Background Image Plan

## Status
- [x] Add `BackgroundImage` plane behind the tree (in `src/utilities/environment.js`)
- [x] Keep procedural shader skybox visible when no image is provided
- [x] Add `backgroundImage` prop to `EzTreeView.vue` and wire through `Environment`
- [x] Add 16:9 checkerboard test image + App toggle checkbox
- [ ] Verify correct orientation/scale after the camera-rotation fix is tested
- [ ] Replace test checkerboard with real orchard image when available

## Current Implementation

### `src/utilities/environment.js`
- New `export class BackgroundImage extends THREE.Mesh`
  - Loads a 2D image texture asynchronously.
  - Sizes the plane so it fills the camera viewport at a fixed distance (`~950` units).
  - Copies the camera orientation each frame so the plane stays perpendicular to the view direction.
  - Uses an opaque `MeshBasicMaterial` with `depthTest: true`, `depthWrite: false`, placed far along the camera look direction, so the tree/ground occlude it but it covers the sky.
- `Environment` accepts `config.backgroundImage`.
  - If present, creates a `BackgroundImage`, hides the procedural `Skybox` mesh, but keeps `Sun`/`Ambient` lights.
  - If absent, shows only the procedural skybox.
  - `updateConfig` supports toggling the image at runtime.

### `src/components/EzTreeView.vue`
- Added `backgroundImage` prop.
- Passes it to `Environment` and re-reacts to changes via `updateConfig`.
- Calls `environment.update(t, camera)` each animation frame so the background plane tracks the camera.

### `src/App.vue`
- Imports `checkerboard.jpg`.
- Added a `Background` checkbox; when checked, binds `backgroundImage` to the checkerboard, otherwise `null`.

### Asset
- `src/assets/textures/background/checkerboard.jpg` (1920x1080, 8x8 colored squares) for testing.

## Next Steps
1. Test the latest build at the running preview server to confirm the checkerboard is behind the tree and the orientation stays upright/natural when orbiting.
2. If natural parallax is too distracting, switch to `scene.background` (static) or CSS background.
3. Swap `checkerboardImage` in `App.vue` for the real orchard image import/path.
