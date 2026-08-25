/**
 * Trellis structure for guiding tree branch growth
 * Creates a grid of cylinders that branches can be attracted to
 */
export class Trellis extends THREE.Group<THREE.Object3DEventMap> {
    /**
     * @param {Object} options Trellis configuration
     */
    constructor(options: any);
    options: any;
    material: THREE.MeshStandardMaterial;
    hCylinderGeo: THREE.CylinderGeometry;
    vCylinderGeo: THREE.CylinderGeometry;
    /**
     * Generate the trellis geometry
     */
    generate(): void;
    /**
     * Find the nearest point on the trellis grid to a given position
     * @param {THREE.Vector3} position
     * @returns {THREE.Vector3}
     */
    getNearestPoint(position: THREE.Vector3): THREE.Vector3;
    /**
     * Clean up geometry and materials
     */
    dispose(): void;
}
import * as THREE from 'three';
