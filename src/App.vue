<script setup>
import { ref } from 'vue';
import { TreePreset } from '@dgreenheck/ez-tree';
import EzTreeView from './components/EzTreeView.vue';
import checkerboardImage from './assets/textures/background/checkerboard.jpg';

const options = ref({
  seed: 1234,
  type: 'deciduous',
  branch: { levels: 3 },
  leaves: { type: 'oak', tint: 0x6e8c3e },
});

const leafColor = ref(0x6e8c3e);
const leafCount = ref(50);
const selectedPreset = ref('Oak Medium');
const showBackground = ref(false);
const stats = ref(null);

function onPresetChange(name) {
  selectedPreset.value = name;
  console.log('preset changed:', name);
}

function onSeedChange(seed) {
  console.log('seed changed:', seed);
}

function onLeafColorChange(color) {
  leafColor.value = color;
  console.log('leaf color changed:', color.toString(16));
}

function onLeafCountChange(value) {
  leafCount.value = Math.round(value);
  console.log('leaf count changed:', leafCount.value);
}

function hexString(hex) {
  return '#' + Math.round(hex).toString(16).padStart(6, '0');
}

function randomizeSeed() {
  options.value.seed = Math.floor(Math.random() * 65536);
  console.log('randomized seed:', options.value.seed);
}
</script>

<template>
  <div class="container">
    <EzTreeView
      class="viewer"
      :preset="selectedPreset"
      :options="options"
      :leaf-color="leafColor"
      :leaf-count="leafCount"
      :background-image="showBackground ? checkerboardImage : null"
      :grass-count="2000"
      :show-ground="true"
      :shadows="true"
      :show-controls="false"
      @generate="(s) => (stats = s)"
    />
    <div class="controls">
      <select :value="selectedPreset" @change="onPresetChange($event.target.value)">
        <option value="">Custom</option>
        <option v-for="key in Object.keys(TreePreset)" :key="key" :value="key">{{ key }}</option>
      </select>
      <button @click="randomizeSeed">Randomize Seed</button>
      <label>
        Leaf color
        <input
          type="color"
          :value="hexString(leafColor)"
          @input="onLeafColorChange(parseInt($event.target.value.slice(1), 16))"
        />
      </label>
      <label>
        Leaf count
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="leafCount"
          @input="onLeafCountChange(Number($event.target.value))"
        />
        <span>{{ leafCount }}</span>
      </label>
      <label>
        Background
        <input type="checkbox" v-model="showBackground" />
      </label>
    </div>
    <div v-if="stats" class="stats">
      {{ stats.vertices.toLocaleString() }} vertices / {{ stats.triangles.toLocaleString() }} triangles / {{ Math.round(stats.ms) }} ms
    </div>
  </div>
</template>

<style>
html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
.container { position: relative; width: 100vw; height: 100vh; }
.viewer { position: absolute; inset: 0; }
.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  color: #fff;
  font-family: system-ui, sans-serif;
  font-size: 13px;
}
.controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}
.controls input[type="range"] { flex: 1; }
.controls input[type="color"] { width: 32px; height: 22px; border: none; padding: 0; }
.controls select, .controls button {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.9);
  color: #111;
  cursor: pointer;
}
.stats {
  position: fixed;
  bottom: 10px;
  left: 10px;
  color: white;
  font-family: monospace;
  background: rgba(0,0,0,0.4);
  padding: 4px 8px;
  border-radius: 4px;
  pointer-events: none;
}
</style>
