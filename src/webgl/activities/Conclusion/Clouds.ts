import Node from "nanogl-node";
import Camera from "nanogl-camera";
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import ArrayBuffer from "nanogl/arraybuffer";
import IndexBuffer from "nanogl/indexbuffer";
import { ISheet } from "@theatre/core";
import { mat4, quat } from "gl-matrix";
import { ICameraLens } from "nanogl-camera/ICameraLens";

import lerp from "@/utils/Lerp";
import Time from "@webgl/Time";
import Renderer from "@webgl/Renderer";
import Programs from "@webgl/glsl/programs";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import AssetDatabase from "@webgl/resources/AssetDatabase";
import { smoothstep } from "@webgl/math";

const M4 = mat4.create();
const QUAT_A = quat.create();
const QUAT_B = quat.create();
const QUAT_C = quat.create();

const START_Z = 200;
const BASE_SCALE = 1.2;
const CLOUD_NODE_INTERVAL = 200;
const CLOUDS_PER_ROW = 5;
const CLOUDS_Z_SCALE = 50;
const CLOUDS_X_SCALE = 3;

export class Clouds {
  cam: Camera<ICameraLens>;

  buffer: ArrayBuffer;
  quadData: Float32Array;
  bufferIndex: IndexBuffer;

  prg: Program;
  _noiseTex: Texture2D;
  cloudsTex: Texture2D[] = [];

  rootNode: Node;
  cloudsNode: (Node | null)[] = [];
  rootTargetZ = 0;

  sheet: ISheet;
  cloudsProgress = { value: 0 };
  cloudsProgressTheatre: TheatreFloat;

  constructor(private renderer: Renderer) {
    this.quadData = new Float32Array([
      -1.0, -1.0, 1.0, 0.0, 0.0,
      1.0, -1.0, 1.0,  1.0, 0.0,
      1.0, 1.0, 1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0, 0.0, 1.0,
    ]);

    this.prg = Programs(renderer.gl).get("intro-clouds");

    this._noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;
  }

  // --SETUP--

  setGeo() {
    this.buffer = new ArrayBuffer(this.renderer.gl, this.quadData);
    this.bufferIndex = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));

    this.buffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);

    this.rootNode = new Node();
    for (let i = 0; i < 8 * CLOUDS_PER_ROW; i++) {
      const n = new Node();
      n.position.set([0,0,0]);
      n.scale.set([2 * BASE_SCALE * CLOUDS_Z_SCALE, 1 * 0.48 * CLOUDS_X_SCALE, 1]);
      n.invalidate();
      n.updateWorldMatrix();
      this.rootNode.add(n);
      this.cloudsNode.push(n);
    }
  }

  setNodeRotation(node: Node, i: number) {
    const yRotation = Math.PI * 0.5  - Math.random() * 0.05;
    const xRotation = Math.PI * 0.5 - Math.random() * 0.05;
    const zRotation = Math.random() > 0.5 ? Math.PI : 0;

    const cloudPosIdx = i % CLOUDS_PER_ROW;
    quat.identity(QUAT_A);
    quat.identity(QUAT_B);
    quat.identity(QUAT_C);
    quat.identity(node.rotation);

    if(cloudPosIdx === 1 || cloudPosIdx === 2 || cloudPosIdx === 4) {
      quat.rotateY(QUAT_A, QUAT_A, yRotation);
      quat.rotateX(QUAT_B, QUAT_A, xRotation);
      quat.rotateZ(QUAT_C, QUAT_B, zRotation);
      node.rotation.set(QUAT_C);
    } else {
      quat.rotateY(QUAT_A, QUAT_A, yRotation);
      quat.rotateZ(QUAT_B, QUAT_A, zRotation);
      node.rotation.set(QUAT_B);
    }

    node.invalidate();
    node.updateWorldMatrix();
  }

  setupClouds() {
    this.rootNode.position.set([0, 0, START_Z]);
    this.rootNode.invalidate();
    this.rootNode.updateWorldMatrix();

    const maxZ = CLOUD_NODE_INTERVAL * Math.floor(this.cloudsNode.length / CLOUDS_PER_ROW);

    for (let i = 0; i < this.cloudsNode.length; i++) {
      const xWidth = 30;
      const node = this.cloudsNode[i];
      const cloudPosIdx = i % CLOUDS_PER_ROW;
      const isMiddleClouds = cloudPosIdx === 1 || cloudPosIdx === 2;

      let x = 0;

      switch (cloudPosIdx) {
      case 0:
        x = xWidth * 0.5 + xWidth * 2 * Math.random();
        break;
      case 1:
        x = 4 + Math.random() * 10;
        break;
      case 2:
        x = -4 + Math.random() * -10;
        break;
      case 3:
        x = -xWidth * 0.5 - xWidth * 2 * Math.random();
        break;
      default:
        x = xWidth * ((Math.random() - 0.5) * 2);
      }

      const y = 5 + Math.random() * 10 + 5 * +(isMiddleClouds);
      const baseZ = Math.floor(i / 4) * CLOUD_NODE_INTERVAL;

      const z = Math.min(maxZ, baseZ - CLOUD_NODE_INTERVAL / 4 * Math.random());

      node.position.set([x, y, z]);

      const xScale = 2 * BASE_SCALE * (CLOUDS_Z_SCALE / 4 + CLOUDS_Z_SCALE * Math.random());
      const yScale = 0.48 * CLOUDS_X_SCALE + CLOUDS_X_SCALE * 2 * Math.random();
      node.scale[0] = xScale;
      node.scale[1] = yScale;

      this.setNodeRotation(node, i);

      if(i === this.cloudsNode.length - 1) {
        this.rootTargetZ = -CLOUDS_Z_SCALE * 2.25 - z;
      }
    }

    //Hide some clouds
    for (let i = 0; i < this.cloudsNode.length; i+=CLOUDS_PER_ROW) {
      const hideCloud = Math.random() > 0.2;
      if (!hideCloud) continue;
      const hiddenCloud = Math.round(Math.random() * CLOUDS_PER_ROW);
      this.cloudsNode[i + hiddenCloud] = null;
    }
  }

  // --LOAD--

  async load(): Promise<void> {
    const cloudsSrc = [
      "intro/clouds-2/cloud-1.webp",
      "intro/brushWhite.webp",
    ];
    for (const url of cloudsSrc) {
      const texRes = AssetDatabase.getTexture(url, this.renderer.gl, {
        alpha: true,
        smooth: false,
        wrap: "repeat",
      });
      await texRes.load();
      this.cloudsTex.push(texRes.texture);
    }
  }

  // --START/STOP--

  start() {
    this.cam = this.renderer.camera;

    this.setGeo();
    this.setupClouds();

    this.cloudsProgressTheatre = new TheatreFloat(this.cloudsProgress, this.sheet, "cloudsProgress");
  }

  stop() {
    this.buffer.dispose();
    this.bufferIndex.dispose();
    this.cloudsProgressTheatre.dispose();
  }

  // --RENDER--

  preRender() {
    const t = Time.time * 0.005;

    this.rootNode.position.set([
      Math.sin((t + 100) * 0.1) * 2,
      Math.sin(t * 0.15) * 1.5,
      lerp(START_Z, this.rootTargetZ, this.cloudsProgress.value)
    ]);

    this.rootNode.invalidate();
    this.rootNode.updateWorldMatrix();
  }

  render() {
    for (let i = 0; i < this.cloudsNode.length; i++) {
      const node = this.cloudsNode[i];

      if (!node) continue;

      const tex = this.cloudsTex[1];
      this.cam.modelViewProjectionMatrix(M4, node._wmatrix);

      const baseDist = Math.abs(this.renderer.camera._wposition[2] - node._wposition[2]);
      const dist = smoothstep(CLOUD_NODE_INTERVAL * 2, -50, baseDist);
      const alphaDist = Math.min(1, Math.max(0, dist));

      this.prg.use();
      this.prg.uMVP(M4);
      if(this.prg.uCamZ) this.prg.uCamZ(this.renderer.camera._wposition[2]);
      this.prg.uDiffuse(tex);
      this.prg.uAlpha(Math.min(1, this.cloudsProgress.value / 0.1));
      this.prg.uAlphaDist(alphaDist);
      this.prg.uNoise(this._noiseTex);
      this.prg.uIsTlClouds(1);
      this.prg.uTime(Time.time);
      this.buffer.attribPointer(this.prg);
      this.bufferIndex.bind();
      this.bufferIndex.drawTriangles();
    }
  }
}