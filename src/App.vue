<script setup>
import { ref } from 'vue';
import EzTreeView from './components/EzTreeView.vue';

const options = ref({
  seed: 1234,
  type: 'deciduous',
  branch: { levels: 3 },
  leaves: { type: 'oak', tint: 0x6e8c3e },
});

const stats = ref(null);
</script>

<template>
  <EzTreeView
    style="width: 100vw; height: 100vh;"
    preset="Oak Medium"
    :options="options"
    :grass-count="2000"
    :show-ground="true"
    :shadows="true"
    :show-controls="true"
    @generate="(s) => (stats = s)"
  />
  <div v-if="stats" class="stats">
    {{ stats.vertices.toLocaleString() }} vertices / {{ stats.triangles.toLocaleString() }} triangles / {{ Math.round(stats.ms) }} ms
  </div>
</template>

<style>
html, body { margin: 0; padding: 0; }
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
