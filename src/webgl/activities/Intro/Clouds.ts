import Renderer from "@webgl/Renderer";
import Camera from "nanogl-camera";
import ArrayBuffer from "nanogl/arraybuffer";
import IndexBuffer from "nanogl/indexbuffer";
import Program from "nanogl/program";
import Node from "nanogl-node";
import Texture2D from "nanogl/texture-2d";
import { mat4, quat, vec3 } from "gl-matrix";
import { ICameraLens } from "nanogl-camera/ICameraLens";
import Time from "@webgl/Time";
import { smoothstep } from "@webgl/math";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { ISheet } from "@theatre/core";
import gui from "@webgl/dev/gui";


const M4 = mat4.create();
const QUAT_A = quat.create();
const QUAT_B = quat.create();
const QUAT_C = quat.create();

const V3_A = vec3.create();

const BASE_SCALE = 1.2;

const NODE_TL_INTERVAL = 200;

const TIMELINE_CLOUDS_Z_SCALE = 50;
const TIMELINE_CLOUDS_X_SCALE = 3;
const TIMELINE_CLOUDS_PER_ROW = 5;

export class Clouds {
  buffer: ArrayBuffer;
  quadData: Float32Array;
  bufferIndex: IndexBuffer;
  prg: Program;

  _noiseTex: Texture2D;

  cloudsNode: Node[] = [];
  cloudsNodeTimeline: Node[] = [];
  cloudsTex: Texture2D[] = [];
  rootNode: Node;

  cloudsAlpha = 1;
  cloudsMovement = 1;
  introCloudsDone = false;
  timelineCloudsDone = false;
  progress = 0;

  cam: Camera<ICameraLens>;

  rootNodeTransforms = {
    z: 200,
    x: 0,
    y: 0,
  }
  timelineMaxZ = 0;
  timelineCloudsHidden: number[] = [];

  params = { baseZRootNode: 0 };

  tl: any//gsap.core.Timeline;

  timelineCloudsProgressTheatre: TheatreFloat;
  timelineCloudsProgress = { value: 0 };
  introSheet: ISheet;
  introTransitionSheet: ISheet;

  cloudAnimStarted = false;

  progressTimeline = { value: 0 };

  constructor(private renderer: Renderer) {
    this.quadData = new Float32Array([
      -1.0, -1.0, 1.0, 0.0, 0.0,
      1.0, -1.0, 1.0, 1.0, 0.0,
      1.0, 1.0, 1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0, 0.0, 1.0,
    ]);

    this._noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;
    /// #if DEBUG
    const fd = gui.folder("Intro");
    fd.add(this.progressTimeline, "value", { min: 0, max: 1 });
    /// #endif
  }

  setGeo() {
    this.buffer = new ArrayBuffer(this.renderer.gl, this.quadData);
    this.bufferIndex = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));

    this.buffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);

    this.cloudsNode = [];
    for (let i = 0; i < 2; i++) {
      const n = new Node();

      n.position.set([0, 0, 0]);
      n.scale.set([2 * BASE_SCALE, 1 * 0.48, 1]);

      n.invalidate();
      n.updateWorldMatrix();
      this.cloudsNode.push(n);
    }

    this.rootNode = new Node();
    for (let i = 0; i < 8 * TIMELINE_CLOUDS_PER_ROW; i++) {
      const n = new Node();
      n.position.set([0, 0, 0]);
      n.scale.set([2 * BASE_SCALE * TIMELINE_CLOUDS_Z_SCALE, 1 * 0.48 * TIMELINE_CLOUDS_X_SCALE, 1]);
      n.invalidate();
      n.updateWorldMatrix();
      this.rootNode.add(n);
      this.cloudsNodeTimeline.push(n);
    }
  }

  setBaseTransformsTlClouds() {
    this.rootNode.position.set([this.rootNodeTransforms.x, this.rootNodeTransforms.y, this.rootNodeTransforms.z]);
    this.rootNode.invalidate();
    this.rootNode.updateWorldMatrix();

    const maxZ = NODE_TL_INTERVAL * Math.floor(this.cloudsNodeTimeline.length / TIMELINE_CLOUDS_PER_ROW);

    for (let i = 0; i < this.cloudsNodeTimeline.length; i++) {
      const xWidth = 30;
      const node = this.cloudsNodeTimeline[i];
      const cloudPosIdx = i % TIMELINE_CLOUDS_PER_ROW;
      const isOdd = i % 2 === 0;
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
      const baseZ = Math.floor(i / 4) * NODE_TL_INTERVAL;

      const z = Math.min(maxZ, baseZ - NODE_TL_INTERVAL / 4 * Math.random());
      // const z = Math.min(maxZ, baseZ);

      node.position.set([x, y, z]);

      const xScale = 2 * BASE_SCALE * (TIMELINE_CLOUDS_Z_SCALE / 4 + TIMELINE_CLOUDS_Z_SCALE * Math.random());
      const yScale = 0.48 * TIMELINE_CLOUDS_X_SCALE + TIMELINE_CLOUDS_X_SCALE * 2 * Math.random();
      node.scale[0] = xScale;
      node.scale[1] = yScale;

      this.setNodeRotation(node, i);

      if (i === this.cloudsNodeTimeline.length - 1) {
        this.timelineMaxZ = -TIMELINE_CLOUDS_Z_SCALE * 2.25 + z * -1;
      }
    }

    //Hide some clouds
    for (let i = 0; i < this.cloudsNodeTimeline.length; i += TIMELINE_CLOUDS_PER_ROW) {
      const hasHiddenClouds = Math.random() > 0.2;
      const hiddenCloud = Math.round(Math.random() * TIMELINE_CLOUDS_PER_ROW);
      if (hasHiddenClouds) {
        this.timelineCloudsHidden.push(i + hiddenCloud);
      }
    }

    // this.timelineMaxZ = NODE_TL_INTERVAL * (this.cloudsNodeTimeline.length / 4) * -1;
  }

  setNodeRotation(node: Node, i: number) {
    const yRotation = Math.PI * 0.5 - Math.random() * 0.05;
    const xRotation = Math.PI * 0.5 - Math.random() * 0.05;
    const zRotation = Math.random() > 0.5 ? Math.PI : 0;

    const cloudPosIdx = i % TIMELINE_CLOUDS_PER_ROW;
    quat.identity(QUAT_A);
    quat.identity(QUAT_B);
    quat.identity(QUAT_C);
    quat.identity(node.rotation);

    if (cloudPosIdx === 1 || cloudPosIdx === 2 || cloudPosIdx === 4) {
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

  async setupTimelineAnimation() {
    const gsapAll = await import("gsap/all");
    const gsap = gsapAll.gsap;
    const totalDuration = 50;
    this.tl = gsap.timeline({
      paused: false
    });
    this.tl.addLabel("start", 0);
    this.tl.to(this.rootNodeTransforms, {
      z: this.timelineMaxZ,
      duration: totalDuration,
    }, "start");
  }

  async loadClouds() {
    const AssetDatabase = (await import("@webgl/resources/AssetDatabase")).default;
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

  async load(): Promise<void> {
    await Promise.all([
      this.loadClouds()
    ]);
  }

  async start() {
    const Programs = (await import("@webgl/glsl/programs")).default;
    this.prg = Programs(this.renderer.gl).get("intro-clouds");

    this.setGeo();

    this.cam = this.renderer.camera;
    this.setBaseTransformsTlClouds();
    await this.setupTimelineAnimation();

    this.timelineCloudsProgressTheatre = new TheatreFloat(this.timelineCloudsProgress, this.introSheet, "timelineCloudsProgress");
  }

  stop() {
    this.buffer.dispose();
    this.bufferIndex.dispose();
    this.timelineCloudsProgressTheatre.dispose();
  }

  async onClick() {
    const gsapAll = await import("gsap/all");
    const gsap = gsapAll.gsap;
    this.introCloudsDone = true;
    // gsap.to(this, {
    //   cloudsAlpha: 2,
    //   duration: 5,
    //   ease: "quart.inOut",
    // });
    return;
    this.cloudAnimStarted = true;
    gsap.to(this, {
      cloudsMovement: 2,
      cloudsAlpha: 0,
      duration: 4,
      ease: "quart.inOut",
      onComplete: () => {
        this.introCloudsDone = true;
        this.cloudsAlpha = 1;
      }
    });
  }

  async goToTlEnd() {
    const gsapAll = await import("gsap/all");
    const gsap = gsapAll.gsap;
    return gsap.to(this, {
      cloudsAlpha: 0,
      duration: 0.5,
      onComplete: () => {
        this.timelineCloudsDone = true;
        this.cloudsAlpha = 1;
      }
    });
  }

  updateCloudsIntro() {
    for (let i = 0; i < this.cloudsNode.length; i++) {
      const node = this.cloudsNode[i];

      let x = 0;
      if (i === 0) {
        x = 3 + 1 * this.cloudsMovement;
      } else {
        x = -1.5 - 1 * this.cloudsMovement;
      }

      let y = 0;
      if (i === 0) {
        y = 1;
      } else {
        y = 0.8;
      }

      node.position.set([x, y, 3]);
      node.invalidate();
      node.updateWorldMatrix();
    }
  }

  updateCloudsTimeline() {
    for (let i = 0; i < this.cloudsNodeTimeline.length; i++) {
      const node = this.cloudsNodeTimeline[i];


      const yRotation = Math.PI * 0.5 - Math.random() * 0.05;
      const xRotation = Math.PI * 0.5 - Math.random() * 0.05;

      const cloudPosIdx = i % TIMELINE_CLOUDS_PER_ROW;
      quat.identity(QUAT_A);
      quat.identity(QUAT_B);
      quat.identity(node.rotation);

      if (cloudPosIdx === 1 || cloudPosIdx === 2) {
        quat.rotateY(QUAT_A, QUAT_A, yRotation);
        quat.rotateX(QUAT_B, QUAT_A, xRotation);
        node.rotation.set(QUAT_B);
      } else {
        quat.rotateY(QUAT_A, QUAT_A, yRotation);
        node.rotation.set(QUAT_A);
      }

      node.invalidate();
      node.updateWorldMatrix();
    }
  }

  // playIntro() {
  //   const tl = gsap.timeline();
  //   tl.to(this, {
  //     cloudsMovement: 0,
  //     duration: 1.7,
  //     ease: "power2.out",
  //   }, 0);
  //   tl.to(this, {
  //     cloudsAlpha: 1,
  //     duration: 1,
  //     // ease: "power1.inOut",
  //   }, 0);
  // }

  preRender() {
    if(!this.tl) return;
    // this.tl.progress(this.progressTimeline.value);
    this.tl.progress(this.timelineCloudsProgress.value);
    if (this.timelineCloudsProgress.value >= 1 && !this.timelineCloudsDone) this.timelineCloudsDone = true;

    // this.updateProgress();
    this.updateCloudsIntro();
    // this.updateCloudsTimeline();
    // this.setBaseTransformsTlClouds();

    const t = Time.time * 0.005;

    this.rootNode.position.set([
      Math.sin((t + 100) * 0.1) * 2,
      Math.sin(t * 0.15) * 1.5,
      this.rootNodeTransforms.z
    ]);

    this.rootNode.invalidate();
    this.rootNode.updateWorldMatrix();
  }

  rttPass() { }

  renderClouds(clouds: Node[], isTimelineClouds = true) {
    if(!this.tl) return;
    for (let i = 0; i < clouds.length; i++) {
      const node = clouds[i];
      const tex = this.cloudsTex[1];
      this.cam.modelViewProjectionMatrix(M4, node._wmatrix);

      const baseDist = Math.abs(this.renderer.camera._wposition[2] - node._wposition[2]);
      const dist = smoothstep(NODE_TL_INTERVAL * 2, -50, baseDist);
      // dist -= smoothstep(40, -10, baseDist);
      let alphaDist = Math.min(1, Math.max(0, dist));
      // const alphaDist = 1;
      // if(i=== 0)
      //   console.log(baseDist, smoothstep(5, 0, baseDist));

      const useNoise = isTimelineClouds ? 1 : 0;
      alphaDist = isTimelineClouds ? alphaDist : 1;


      this.prg.use();
      this.prg.uMVP(M4);
      if (this.prg.uCamZ) this.prg.uCamZ(this.renderer.camera._wposition[2]);
      // this.prg.uDist(baseDist);
      this.prg.uDiffuse(tex);
      this.prg.uAlpha(isTimelineClouds ? Math.min(1, (this.timelineCloudsProgress.value * this.cloudsAlpha) / 0.05) : this.cloudsAlpha);
      this.prg.uAlphaDist(alphaDist);
      this.prg.uNoise(this._noiseTex);
      this.prg.uIsTlClouds(useNoise);
      // this.prg.uFirstRow(+(isTimelineClouds && i < 4));
      this.prg.uTime(Time.time);
      this.buffer.attribPointer(this.prg);
      this.bufferIndex.bind();
      if (!this.timelineCloudsHidden.includes(i) || !isTimelineClouds) {
        this.bufferIndex.drawTriangles();
      }
    }
  }

  render() {
    if (this.introCloudsDone && !this.timelineCloudsDone) {
      this.renderClouds(this.cloudsNodeTimeline);
    }
    // else {
    //   this.renderClouds(this.cloudsNode, false);
    // }
  }
}