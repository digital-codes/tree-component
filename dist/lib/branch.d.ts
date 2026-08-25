export class Branch {
    /**
     * Generates a new branch
     * @param {THREE.Vector3} origin The starting point of the branch
     * @param {THREE.Euler} orientation The starting orientation of the branch
     * @param {number} length The length of the branch
     * @param {number} radius The radius of the branch at its starting point
     */
    constructor(origin?: THREE.Vector3, orientation?: THREE.Euler, length?: number, radius?: number, level?: number, sectionCount?: number, segmentCount?: number);
    origin: THREE.Vector3;
    orientation: THREE.Euler;
    length: number;
    radius: number;
    level: number;
    sectionCount: number;
    segmentCount: number;
}
import * as THREE from 'three';
