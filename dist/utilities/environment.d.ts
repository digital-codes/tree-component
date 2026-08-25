import { Clouds } from './clouds';
export class Skybox extends THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> {
    constructor(options?: {});
    geometry: THREE.SphereGeometry;
    material: THREE.ShaderMaterial;
    sun: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
    updateSkyFromUniforms(): void;
    updateSunPosition(): void;
}
export class BackgroundImage extends THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> {
    constructor(src: any, options?: {});
    options: {
        distance: any;
        opacity: any;
        orientation: any;
    };
    update(camera: any): void;
    _updateCamera(camera: any): void;
    _updateWorldAxis(camera: any): void;
}
export class Ground extends THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> {
    constructor(options?: {});
    options: {};
}
export class Grass extends THREE.Object3D<THREE.Object3DEventMap> {
    constructor(options?: {});
    options: {
        instanceCount: any;
        maxInstanceCount: any;
        scale: any;
        patchiness: any;
        size: any;
        sizeVariation: any;
    };
    set instanceCount(value: any);
    get instanceCount(): any;
    generate(): void;
    grassMesh: THREE.InstancedMesh<any, THREE.MeshStandardMaterial, THREE.InstancedMeshEventMap>;
}
export class Environment extends THREE.Object3D<THREE.Object3DEventMap> {
    constructor(config?: {});
    config: {};
    skybox: Skybox;
    ground: Ground;
    grass: Grass;
    clouds: Clouds;
    setBackgroundImage(srcOrObject: any): void;
    backgroundImage: BackgroundImage;
    updateConfig(config: any): void;
    update(time: any, camera: any): void;
}
import * as THREE from 'three';
