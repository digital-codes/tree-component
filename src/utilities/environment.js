import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { simplex2d } from './noise.js';

import grassColor from '../assets/textures/ground/grass.jpg';
import dirtColor from '../assets/textures/ground/dirt_color.jpg';
import dirtNormal from '../assets/textures/ground/dirt_normal.jpg';
import grassModel from '../assets/models/grass.glb';

import skyboxVert from '../assets/shaders/skybox.vert?raw';
import skyboxFrag from '../assets/shaders/skybox.frag?raw';

// ===================== Skybox =====================

export class Skybox extends THREE.Mesh {
  constructor(options = {}) {
    super();
    this.name = 'Skybox';

    const sunAzimuth = options.sunAzimuth ?? 90;
    const sunElevation = options.sunElevation ?? 30;
    const sunColor =
      options.sunColor instanceof THREE.Color
        ? options.sunColor
        : new THREE.Color(options.sunColor ?? 0xffe5b0);
    const skyColorLow =
      options.skyColorLow instanceof THREE.Color
        ? options.skyColorLow
        : new THREE.Color(options.skyColorLow ?? 0x6fa2ef);
    const skyColorHigh =
      options.skyColorHigh instanceof THREE.Color
        ? options.skyColorHigh
        : new THREE.Color(options.skyColorHigh ?? 0x2053ff);
    const sunSize = options.sunSize ?? 1;

    this.geometry = new THREE.SphereGeometry(900, 32, 32);
    this.material = new THREE.ShaderMaterial({
      vertexShader: skyboxVert,
      fragmentShader: skyboxFrag,
      uniforms: {
        uSunAzimuth: { value: sunAzimuth },
        uSunElevation: { value: sunElevation },
        uSunColor: { value: sunColor },
        uSkyColorLow: { value: skyColorLow },
        uSkyColorHigh: { value: skyColorHigh },
        uSunSize: { value: sunSize },
      },
      side: THREE.BackSide,
    });

    this.sun = new THREE.DirectionalLight();
    this.sun.name = 'Sun';
    this.sun.intensity = 5;
    this.sun.color.copy(sunColor);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize = new THREE.Vector2(1024, 1024);
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    this.sun.shadow.bias = -0.001;
    this.sun.shadow.normalBias = 0.02;

    this.ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.ambient.name = 'Ambient';

    this.updateSunPosition();
  }

  updateSkyFromUniforms() {
    this.sun.color.copy(this.material.uniforms.uSunColor.value);
    this.updateSunPosition();
  }

  updateSunPosition() {
    const el = THREE.MathUtils.degToRad(this.material.uniforms.uSunElevation.value);
    const az = THREE.MathUtils.degToRad(this.material.uniforms.uSunAzimuth.value);
    this.sun.position.set(
      100 * Math.cos(el) * Math.sin(az),
      100 * Math.sin(el),
      100 * Math.cos(el) * Math.cos(az)
    );
  }
}

// ===================== Ground =====================

let groundAssetsLoaded = false;
let groundTextures = {
  grass: null,
  dirt: null,
  dirtNormal: null,
};

async function loadGroundTextures() {
  if (groundAssetsLoaded) return;
  const loader = new THREE.TextureLoader();
  groundTextures.grass = await loader.loadAsync(new URL(grassColor, import.meta.url).href);
  groundTextures.grass.wrapS = THREE.RepeatWrapping;
  groundTextures.grass.wrapT = THREE.RepeatWrapping;
  groundTextures.grass.colorSpace = THREE.SRGBColorSpace;

  groundTextures.dirt = await loader.loadAsync(new URL(dirtColor, import.meta.url).href);
  groundTextures.dirt.wrapS = THREE.RepeatWrapping;
  groundTextures.dirt.wrapT = THREE.RepeatWrapping;
  groundTextures.dirt.colorSpace = THREE.SRGBColorSpace;

  groundTextures.dirtNormal = await loader.loadAsync(new URL(dirtNormal, import.meta.url).href);
  groundTextures.dirtNormal.wrapS = THREE.RepeatWrapping;
  groundTextures.dirtNormal.wrapT = THREE.RepeatWrapping;

  groundAssetsLoaded = true;
}

export class Ground extends THREE.Mesh {
  constructor(options = {}) {
    super();
    this.options = options;
    this.rotation.x = -Math.PI / 2;
    this.receiveShadow = true;

    loadGroundTextures().then(() => {
      this.geometry = new THREE.PlaneGeometry(2000, 2000);
      this.material = new THREE.MeshStandardMaterial({
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.01,
        normalMap: groundTextures.dirtNormal,
        metalness: 0.0,
        roughness: 1.0,
      });

      this.material.onBeforeCompile = (shader) => {
        shader.uniforms.uGrassTexture = { value: groundTextures.grass };
        shader.uniforms.uDirtTexture = { value: groundTextures.dirt };
        shader.uniforms.uNoiseScale = { value: options.scale ?? 100 };
        shader.uniforms.uPatchiness = { value: options.patchiness ?? 0.7 };

        // Vertex shader needs to pass world position to fragment shader.
        shader.vertexShader = `
          varying vec3 vWorldPosition;
          ` + shader.vertexShader;

        const hasWorldPos = shader.vertexShader.includes('#include <worldpos_vertex>');
        if (hasWorldPos) {
          shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
            vWorldPosition = worldPosition.xyz;
            `
          );
        } else {
          shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            `void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            `
          );
        }

        shader.fragmentShader = `
          varying vec3 vWorldPosition;
          uniform sampler2D uGrassTexture;
          uniform sampler2D uDirtTexture;
          uniform float uNoiseScale;
          uniform float uPatchiness;
          ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
          `void main() {`,
          `
          vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }
          vec2 mod289(vec2 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }
          vec3 permute(vec3 x) {
            return mod289(((x * 34.0) + 1.0) * x);
          }
          float simplex2d(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
            m = m * m;
            m = m * m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
          void main() {`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          vec2 uv = vec2(vWorldPosition.x, vWorldPosition.z);
          vec3 grassC = texture2D(uGrassTexture, uv / 30.0).rgb;
          vec3 dirtC = texture2D(uDirtTexture, uv / 30.0).rgb;
          float n = 0.5 + 0.5 * simplex2d(uv / uNoiseScale);
          float s = smoothstep(uPatchiness - 0.1, uPatchiness + 0.1, n);
          vec4 sampledDiffuseColor = vec4(mix(grassC, dirtC, s), 1.0);
          diffuseColor *= sampledDiffuseColor;
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <normal_fragment_maps>',
          `
          vec3 mapN = texture2D(normalMap, uv / 30.0).xyz * 2.0 - 1.0;
          mapN.xy *= normalScale;
          normal = normalize(tbn * mapN);
          `
        );
      };
    });
  }
}

// ===================== Grass =====================

let grassAssetsLoaded = false;
let grassMeshTemplate = null;

async function loadGrassAssets() {
  if (grassAssetsLoaded) return;
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(new URL(grassModel, import.meta.url).href);
  grassMeshTemplate = gltf.scene.children[0];
  grassAssetsLoaded = true;
}

export class Grass extends THREE.Object3D {
  constructor(options = {}) {
    super();
    this.options = {
      instanceCount: options.instanceCount ?? 2000,
      maxInstanceCount: options.maxInstanceCount ?? 25000,
      scale: options.scale ?? 100,
      patchiness: options.patchiness ?? 0.7,
      size: options.size ?? { x: 5, y: 4, z: 5 },
      sizeVariation: options.sizeVariation ?? { x: 1, y: 2, z: 1 },
      ...options,
    };

    loadGrassAssets().then(() => {
      this.generate();
    });
  }

  get instanceCount() {
    return this.grassMesh?.count ?? this.options.instanceCount;
  }

  set instanceCount(value) {
    if (this.grassMesh) this.grassMesh.count = value;
  }

  generate() {
    if (!grassMeshTemplate) return;

    const material = new THREE.MeshStandardMaterial({
      map: grassMeshTemplate.material?.map ?? null,
      emissive: new THREE.Color(0x308040),
      emissiveIntensity: 0.05,
      alphaTest: 0.5,
      metalness: 0.0,
      roughness: 1.0,
      side: THREE.DoubleSide,
    });
    material.color.multiplyScalar(0.6);

    this.grassMesh = new THREE.InstancedMesh(
      grassMeshTemplate.geometry,
      material,
      this.options.maxInstanceCount
    );

    const dummy = new THREE.Object3D();
    let count = 0;
    for (let i = 0; i < this.options.maxInstanceCount; i++) {
      const r = 10 + Math.random() * 500;
      const theta = Math.random() * 2.0 * Math.PI;
      const p = new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta));

      const n = 0.5 + 0.5 * simplex2d(new THREE.Vector2(p.x / this.options.scale, p.z / this.options.scale));
      if (n > this.options.patchiness && Math.random() + 0.6 > this.options.patchiness) continue;

      dummy.position.copy(p);
      dummy.rotation.set(0, 2 * Math.PI * Math.random(), 0);
      dummy.scale.set(
        this.options.sizeVariation.x * Math.random() + this.options.size.x,
        this.options.sizeVariation.y * Math.random() + this.options.size.y,
        this.options.sizeVariation.z * Math.random() + this.options.size.z
      );
      dummy.updateMatrix();

      const color = new THREE.Color(0.25 + Math.random() * 0.1, 0.3 + Math.random() * 0.3, 0.1);
      this.grassMesh.setMatrixAt(count, dummy.matrix);
      this.grassMesh.setColorAt(count, color);
      count++;
    }

    this.grassMesh.count = Math.min(count, this.options.instanceCount);
    this.grassMesh.receiveShadow = true;
    this.grassMesh.castShadow = true;
    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.grassMesh.instanceColor.needsUpdate = true;

    this.add(this.grassMesh);
  }
}

// ===================== Environment =====================

export class Environment extends THREE.Object3D {
  constructor(config = {}) {
    super();
    this.config = config;
    this.skybox = new Skybox(config.skybox === true ? {} : (config.skybox || {}));
    this.ground = new Ground(config);
    this.grass = new Grass(config);

    if (config.skybox !== false) {
      this.add(this.skybox);
      this.add(this.skybox.sun);
      this.add(this.skybox.ambient);
    }
    if (config.showGround !== false) this.add(this.ground);
    if (config.grassCount !== 0) this.add(this.grass);
  }

  updateConfig(config) {
    if (config.grassCount !== undefined) {
      this.grass.instanceCount = config.grassCount;
    }
    if (config.shadows !== undefined) {
      this.grass.traverseVisible((o) => {
        if (o.isMesh) {
          o.castShadow = config.shadows;
          o.receiveShadow = config.shadows;
        }
      });
      this.skybox.sun.castShadow = config.shadows;
      this.ground.receiveShadow = config.shadows;
    }
    if (config.showGround !== undefined && this.ground.visible !== config.showGround) {
      this.ground.visible = config.showGround;
    }
    if (config.skybox !== undefined) {
      const skyOn = config.skybox !== false;
      if (this.skybox.visible !== skyOn || this.skybox.sun.visible !== skyOn || this.skybox.ambient.visible !== skyOn) {
        this.skybox.visible = skyOn;
        this.skybox.sun.visible = skyOn;
        this.skybox.ambient.visible = skyOn;
      }
      if (typeof config.skybox === 'object') {
        const u = this.skybox.material.uniforms;
        if (config.skybox.sunAzimuth !== undefined) u.uSunAzimuth.value = config.skybox.sunAzimuth;
        if (config.skybox.sunElevation !== undefined) u.uSunElevation.value = config.skybox.sunElevation;
        this.skybox.updateSkyFromUniforms();
      }
    }
  }
}
