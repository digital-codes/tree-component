export function getBarkMaps(): {
    color: THREE.Texture;
    normal: THREE.Texture;
    roughness: THREE.Texture;
};
export function getLeafMap(type: any): any;
export function applyTreeTextures(tree: any): void;
export function loadPresetWithTextures(tree: any, name: any, generate?: boolean): void;
import * as THREE from 'three';
