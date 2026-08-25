export class Clouds extends THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> {
    constructor();
    material: THREE.MeshBasicMaterial;
    geometry: THREE.PlaneGeometry;
    update(elapsedTime: any): void;
}
import * as THREE from 'three';
