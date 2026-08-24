import * as THREE from 'three';
import { TreePreset } from '@dgreenheck/ez-tree';

import BarkColor from '../assets/textures/bark/Bark006_1K-JPG_Color.jpg';
import BarkNormal from '../assets/textures/bark/Bark006_1K-JPG_NormalGL.jpg';
import BarkRoughness from '../assets/textures/bark/Bark006_1K-JPG_Roughness.jpg';

import AshLeaf from '../assets/textures/leaves/ash.png';
import AspenLeaf from '../assets/textures/leaves/aspen.png';
import OakLeaf from '../assets/textures/leaves/oak.png';
import PineLeaf from '../assets/textures/leaves/pine.png';

const textureLoader = new THREE.TextureLoader();

function asUrl(maybeUrl) {
  return typeof maybeUrl === 'string' ? maybeUrl : new URL(maybeUrl, import.meta.url).href;
}

function loadColor(url) {
  const texture = textureLoader.load(url.href ?? url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function loadLinear(url) {
  return textureLoader.load(url.href ?? url);
}

const leafMapByType = {
  ash: loadColor(new URL(AshLeaf, import.meta.url).href),
  aspen: loadColor(new URL(AspenLeaf, import.meta.url).href),
  oak: loadColor(new URL(OakLeaf, import.meta.url).href),
  pine: loadColor(new URL(PineLeaf, import.meta.url).href),
};

const barkMaps = {
  color: loadColor(new URL(BarkColor, import.meta.url).href),
  normal: loadLinear(new URL(BarkNormal, import.meta.url).href),
  roughness: loadLinear(new URL(BarkRoughness, import.meta.url).href),
};

export function getBarkMaps() {
  return barkMaps;
}

export function getLeafMap(type) {
  return leafMapByType[type] ?? leafMapByType.oak;
}

export function applyTreeTextures(tree) {
  tree.options.bark.maps.color = barkMaps.color;
  tree.options.bark.maps.normal = barkMaps.normal;
  tree.options.bark.maps.roughness = barkMaps.roughness;
  tree.options.leaves.map = getLeafMap(tree.options.leaves.type);
}

export function loadPresetWithTextures(tree, name, generate = false) {
  const preset = TreePreset[name];
  if (!preset) return;
  const copy = structuredClone(preset);
  tree.options.copy(copy, tree.options);
  applyTreeTextures(tree);
  if (generate) {
    tree.generate();
  }
}
