<script setup>
import { ref } from 'vue';
import { TreePreset } from 'tree-component';
import EzTreeView from './components/EzTreeView.vue';
import checkerboardImage from './assets/textures/background/checkerboard.jpg';

import { onMounted, onUnmounted } from 'vue';


// tree.options.bark.type
// need to control in branch => growth direction: strength, angle: level 1 (no 0), length: level 0 and 1, radius: level 0
// and camera: distance, fov, position, rotation 
// and background display image on/off

const healthOption = ref(2); // 0-4, 0=worst, 4=best

const branchVariants = [
  { length: { 0: 15, 1: 15 }, radius: { 0: 1. }, angle: { 1: 120.0 }, force: {strength: .001} },
  { length: { 0: 20, 1: 15 }, radius: { 0: 2.0 }, angle: { 1: 100.0 }, force: {strength: .001} },
  { length: { 0: 30, 1: 20 }, radius: { 0: 3.0 }, angle: { 1: 80.0 }, force: {strength: .002} },
  { length: { 0: 35, 1: 25 }, radius: { 0: 3.5 }, angle: { 1: 60.0 }, force: {strength: .003} },
  { length: { 0: 35, 1: 25 }, radius: { 0: 4.0 }, angle: { 1: 50.0 }, force: {strength: .005} },
];

const leaveVariants = [
  { count: 2, color: 0x865e3c },
  { count: 3, color: 0xf5c211 },
  { count: 8, color: 0x368269 },
  { count: 12, color: 0x6e8c3e },
  { count: 20, color: 0x6e8c3e }
];

const options = ref({
  seed: 1234,
  type: 'deciduous',
  branch: branchVariants[healthOption.value],
  leaves: { type: 'oak', tint: leaveVariants[healthOption.value].color },
});

const backendUrl = ref("http://localhost:8080/php");


const leafColor = ref(leaveVariants[healthOption.value].color);
const leafCount = ref(leaveVariants[healthOption.value].count);
const selectedPreset = ref('Ash Medium');
const showBackground = ref(false);
const orientations = ['camera', 'xy', 'xz', 'yz', 'equirectangular'];
const backgroundOrientation = ref(orientations[0]);
const stats = ref(null);
const cameraTarget = ref({ x: 0, y: 25, z: 0 });
// close: x=70, far: x=200

const camDistSelection = ref(1); // 0=close, 1=far
const camDist = [70,200];
const cameraPosition = ref({ x: 40, y: 30, z: camDist[camDistSelection.value] });
const showControls = ref(false);


function onPresetChange(name) {
  selectedPreset.value = name;
  console.log('preset changed:', name);
}

function onSeedChange(seed) {
  options.value.seed = seed;
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

const pollTimer = ref(null);
const pollCounter = ref(0);
const pollDelay = 200 // milliseconds 5000; // milliseconds
const pollScaling = 50

const sendPoll = async () => {
  if (pollCounter.value % pollScaling === 0) {
    console.log('sending poll with seed:', options.value.seed);
  }
  try {
    const response = await fetch(`${backendUrl.value}/poll.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: options.value.seed })
    });
    const data = await response.json();
    if (pollCounter.value % pollScaling === 0) {
      console.log('poll response:', data);
    }
    // check poll response for health and dist, and update options and cameraPosition accordingly
    // skipp if values match current values to avoid unnecessary updates
    
    if (data && Object.keys(data).length > 0) {
      // Update options based on the response
      if (data.health !== undefined) {
        // make sure options.branch and options.leaves are updated based on healthOption as well
        if (data.health !== healthOption.value) {
          healthOption.value = data.health;
          options.value.branch = branchVariants[healthOption.value];
          leafColor.value = leaveVariants[healthOption.value].color;
          leafCount.value = leaveVariants[healthOption.value].count;
          if (pollCounter.value % pollScaling === 0) {
            console.log('updated health from poll:', data.health);
          }
        }
      }
      if (data.dist !== undefined) {
        // make sure cameraPosition is updated based on camDistSelection as well
        if (data.dist !== camDistSelection.value) {
          camDistSelection.value = data.dist;
          cameraPosition.value = { x: 40, y: 30, z: camDist[camDistSelection.value] };
          if (pollCounter.value % pollScaling === 0) {
            console.log('updated camera distance from poll:', data.dist, cameraPosition.value);
          }
        }
      }
      if (data.bg !== undefined) {
        // make sure showBackground is updated based on bg value
        if (showBackground.value === false && data.bg !== "") {
          showBackground.value = true;
          if (pollCounter.value % pollScaling === 0) {
            console.log('updated background from poll:', data.bg);
          }
        } else if (showBackground.value === true && data.bg === "") {
          showBackground.value = false;
          if (pollCounter.value % pollScaling === 0) {
            console.log('updated background from poll:', data.bg);
          }
        }
      }
      // Add more updates here if needed
    }
    pollCounter.value++;
  } catch (error) {
    console.error('poll error:', error);
  }
};

onMounted(() => {
  // check if we have an url parameter ?backend given. if yes, derive backendUrl from it
  // Parse the query string (e.g., "?foo=bar&baz=qux")
  const urlParams = new URLSearchParams(window.location.search);
  // Get a specific parameter by key
  const be = urlParams.get('backend');
  console.log('be param:', be);  
  if ((be !== undefined) && (be !== "")) {
    backendUrl.value = backendUrl.value.replace("localhost",be)
    console.log("New backend url ", backendUrl.value)
  }
  pollTimer.value = setInterval(sendPoll, pollDelay); // Poll every pollDelay milliseconds
  onUnmounted(() => clearInterval(pollTimer.value));
});

onUnmounted(() => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
  console.log('Component unmounted, cleanup if necessary');
});



</script>

<template>
  <div class="container">
    <EzTreeView
      class="viewer"
      :preset="selectedPreset"
      :options="options"
      :leaf-color="leafColor"
      :leaf-count="leafCount"
      :background-image="showBackground ? { src: checkerboardImage, orientation: backgroundOrientation } : null"
      :grass-count="2000"
      :show-ground="true"
      :shadows="true"
      :show-controls="showControls"
      :camera-target="cameraTarget"
      :camera-position="cameraPosition"
      @generate="(s) => (stats = s)"
    />
    <div class="controls" v-if="showControls">
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
      <label>
        Orientation
        <select v-model="backgroundOrientation">
          <option v-for="o in orientations" :key="o" :value="o">{{ o }}</option>
        </select>
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
