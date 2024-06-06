import { Ref, ref } from "vue";
import Program from "nanogl/program";
import { LocalConfig } from "nanogl-state/GLState";
import Renderer from "@webgl/Renderer";
import { Activity } from "@webgl/activities/Activity";
import Texture2D from "nanogl/texture-2d";
import { mat4, vec3 } from "gl-matrix";
import Camera from "nanogl-camera";
import OrthographicLens from "nanogl-camera/ortho-lens";
import type Archive from "@webgl/activities/Archives/Archive";
import AppService from "@/services/AppService";
import IndexBuffer from "nanogl/indexbuffer";
import ArrayBuffer from "nanogl/arraybuffer";
import Node from "nanogl-node";
import Programs from "@webgl/glsl/programs";
import gui from "@webgl/dev/gui";
import PublicPath from "@/core/PublicPath";
import ScrollNormalizer, { ScrollDirection } from "@/utils/ScrollNormalizer";
import { debounce } from "@/utils/Debounce";

const ORIGIN = vec3.create();
const M4 = mat4.create();

export default class ArchivesManager implements Activity {
  cfg: LocalConfig;
  buffer: ArrayBuffer;
  bufferIndex: IndexBuffer;
  quadData: Float32Array;
  prg: Program;
  node: Node;

  private static worker: Worker;

  tPlaceholder: Texture2D;

  archiveCam: Camera<OrthographicLens>;
  archives: Archive[];
  currentArchive: number;
  nextArchive?: number;

  uSaturation: number;

  wNoise: Texture2D;

  accumulatedDeltaY = 0;
  threshold = 100;
  canChangeStep: Ref<boolean>;
  eventTriggered = false;
  startY = 0;
  scrollNormalizer: ScrollNormalizer;
  onTouchMoveDebounced: (event: TouchEvent) => void;
  // changeStateSubscription: Subscription;

  constructor(private renderer: Renderer) {
    this.quadData = new Float32Array([
      -1.0, -1.0, 1.0, 0.0, 0.0,
      1.0, -1.0, 1.0, 1.0, 0.0,
      1.0, 1.0, 1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0, 0.0, 1.0,
    ]);

    this.prg = Programs(this.renderer.gl).get("archivesManager");
    this.wNoise = this.renderer.scene.texturePool.get("whiteNoise").texture;

    this.createCamera();

    this.uSaturation = 1.15;

    this.canChangeStep = ref(true);

    if (!ArchivesManager.worker) {
      const workerUrl = PublicPath("js/archives.worker.js");
      ArchivesManager.worker = new Worker(workerUrl);

      this.initWorkerMessage();
    }

    /// #if DEBUG
    this.createDebug();
    /// #endif

    this.scrollNormalizer = new ScrollNormalizer((direction: ScrollDirection) => {
      this.onNavigation(direction);
    }, { threshold: 100, cooldownTime: 1000 });
    this.onTouchMoveDebounced = debounce(this.onTouchMove, 100);
  }

  private initWorkerMessage() {
    ArchivesManager.worker.onmessage = ({ data }) => {
      const { imageBase64, layerIndex, frameIndex, key } = data;
      const archive = this.archives[key];
      if (archive) {
        archive.handleWorkerMessage(imageBase64, layerIndex, frameIndex);
      }
    };
  }

  public static getWorker(): Worker {
    return ArchivesManager.worker;
  }

  createDebug() {
    const fld = gui.folder("Archives");
    fld.add(this, "uSaturation", { min: 0, max: 2, step: 0.01 });
  }

  createRenderQuad() {
    this.buffer = new ArrayBuffer(this.renderer.gl, this.quadData);
    this.bufferIndex = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));
    this.buffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);

    this.node = new Node();
    this.node.scale.set([1.6, 1, 1.6]);
    this.node.invalidate();
    this.node.updateWorldMatrix();
  }

  createCamera() {
    this.archiveCam = new Camera<OrthographicLens>(new OrthographicLens());
    this.archiveCam.lens.near = 0.1;
    this.archiveCam.lens.far = 50;
    this.archiveCam.z = 5;
    this.archiveCam.lookAt(ORIGIN);
  }

  onResize() {
    const rx = Math.max(window.innerHeight / window.innerWidth, 1.0);
    const ry = Math.max(window.innerWidth / window.innerHeight, 1.0);
    const scale = 1;

    this.archiveCam.lens.setBound(
      -scale * ry,
      scale * ry,
      -scale * rx,
      scale * rx
    );
  }

  // --LOAD/UNLOAD--
  async initArchives() {
    const Archive = (await import("@webgl/activities/Archives/Archive")).default;
    this.archives = [];
    for (let i = 0; i < 4; i++) {
      this.archives.push(new Archive(this.renderer, this.archiveCam, i));
    }
  }

  async load(): Promise<any> {
    await this.initArchives();
  }

  unload() {
    this.stop();
    this.archives.forEach(archive => archive.stop());
  }

  // --START/STOP--
  start() {
    // this.changeStateSubscription = AppService.state.subscribe((state) => {
    //   if(state.event?.type === "SKIP" && !state.changed) {
    //     this.onChangeState(state, true);
    //   } else if(!state.context.archiveTransition){
    //     this.onChangeState(state);
    //   }
    // });
    const machineStep = AppService.state.getSnapshot().context.step;
    this.currentArchive = machineStep || 0;
    this.nextArchive = undefined;

    this.createRenderQuad();
    this.onResize();

    this.renderer.postprocess.enabled = false;

    this.tPlaceholder = new Texture2D(this.renderer.gl, this.renderer.gl.RGBA);
    this.tPlaceholder.fromData(1, 1, new Uint8Array([0, 0, 0, 0]));

    this.archives[this.currentArchive].start();
    // this.archives[1].start();

    window.addEventListener("resize", this.onResize.bind(this));
    window.addEventListener("wheel", this.scrollNormalizer.handleScroll, { passive: false });
    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMoveDebounced, { passive: false });
  }

  onScroll = (event: WheelEvent) => {
    if (this.eventTriggered) return;

    this.accumulatedDeltaY += event.deltaY;

    if (Math.abs(this.accumulatedDeltaY) >= this.threshold) {
      const direction = this.accumulatedDeltaY > 0 ? "down" : "up";
      this.onNavigation(direction);
      this.accumulatedDeltaY = 0;
    }
  }

  onTouchStart = (event: TouchEvent) => {
    this.startY = event.touches[0].clientY;
    this.eventTriggered = false;
  }

  onTouchMove = (event: TouchEvent) => {
    if (this.eventTriggered) return;

    const touchY = event.touches[0].clientY;
    const deltaY = this.startY - touchY;

    if (Math.abs(deltaY) >= this.threshold) {
      const direction = deltaY > 0 ? "down" : "up";
      this.onNavigation(direction);
      this.startY = touchY;
    }
  }

  setArchive = async (nextArchive: number,) => {
    const oldStep = AppService.state.getSnapshot().context.step;
    const isNextLoaded = this.archives[nextArchive]?.allImgLoaded;

    if (this.eventTriggered || !isNextLoaded || oldStep === nextArchive) return;

    this.eventTriggered = true;

    this.archives[oldStep].resumeAnimation();
    await this.archives[oldStep].canNextEnter();
    this.nextArchive = nextArchive;
    this.archives[this.nextArchive].start();

    // console.log('onNavigation', this.nextArchive, oldStep, direction);
    await this.archives[oldStep].animationEnded();

    this.currentArchive = this.nextArchive;
    this.archives[oldStep].stop();
  }

  gotoArchive = async (step: number) => {
    if (this.eventTriggered) return;

    await this.setArchive(step);

    AppService.state.send("SET_STEP", { step });

    this.eventTriggered = false;
  }

  onNavigation = async (direction: string) => {
    if (this.eventTriggered) return;

    const machineStep = AppService.state.getSnapshot().context.step;
    let nextArchive = direction === "up" ? machineStep - 1 : machineStep + 1;

    const isLooping = nextArchive > this.archives.length - 1 || nextArchive < 0;
    if (isLooping) {
      // AppService.state.send("RESET_SCROLL");
      if (nextArchive < 0) {
        nextArchive = this.archives.length - 1;
      } else {
        nextArchive = 0;
      }
    }

    await this.setArchive(nextArchive);

    if (!isLooping) {
      if (direction === "up") {
        AppService.state.send("PREV");
      } else {
        AppService.state.send("NEXT");
      }
    } else {
      AppService.state.send("SET_STEP", { step: nextArchive });
    }

    this.eventTriggered = false;
  }

  async animeOut() {
    this.archives[this.currentArchive].resumeAnimation();
    await this.archives[this.currentArchive].animationEnded();
    this.renderer.scene.prepareTransition(true);
    AppService.state.send("GO_TO_SCENE");
  }

  stop(): void {
    this.archives.forEach(archive => archive.stop());

    this.renderer.postprocess.enabled = true;

    this.buffer.dispose();
    this.bufferIndex.dispose();
    this.tPlaceholder.dispose();

    if (this.archives.every(archive => archive.allImgLoaded)) {
      ArchivesManager.worker.terminate();
    }

    window.removeEventListener("resize", this.onResize.bind(this));
    window.removeEventListener("wheel", this.scrollNormalizer.handleScroll);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMoveDebounced);
  }

  // --RENDER--
  preRender(): void {
    this.canChangeStep.value = !this.eventTriggered;

    this.archives[this.currentArchive]?.preRender();
    // this.archives[1]?.preRender();

    if (this.nextArchive !== undefined && this.nextArchive !== this.currentArchive) {
      this.archives[this.nextArchive]?.preRender();
    }
  }

  rttPass(): void {
    this.archives[this.currentArchive]?.rttPass();
    // this.archives[1]?.rttPass();
    if (this.nextArchive !== undefined && this.nextArchive !== this.currentArchive) {
      this.archives[this.nextArchive]?.rttPass();
    }
  }

  render(): void {
    this.renderer.gl.clearColor(239 / 255, 234 / 255, 218 / 255, 0);
    this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT);

    this.archiveCam.updateWorldMatrix();
    this.archiveCam.updateViewProjectionMatrix(
      this.renderer.viewport.width,
      this.renderer.viewport.height
    );
    this.archiveCam.modelViewProjectionMatrix(M4, this.node._wmatrix);


    // this.archives[this.currentArchive]?.render();
    // if(this.nextArchive !== undefined && this.nextArchive !== this.currentArchive) {
    //   this.archives[this.nextArchive]?.render();
    // }

    this.prg.use();
    this.prg.uMVP(M4);

    this.prg.uSaturation(this.uSaturation);
    this.prg.uWNoiseTex(this.wNoise);
    this.prg.uRez(this.renderer.viewport.width, this.renderer.viewport.height);
    this.prg.uCurrentTex(this.archives[this.currentArchive].fbo.getColorTexture());
    // this.prg.uNextTex(this.archives[1].fbo.getColor());
    if (this.nextArchive !== undefined && this.nextArchive !== this.currentArchive) {
      this.prg.uNextTex(this.archives[this.nextArchive].fbo.getColorTexture());
    } else {
      this.prg.uNextTex(this.tPlaceholder);
    }
    this.buffer.attribPointer(this.prg);
    this.bufferIndex.bind();
    this.bufferIndex.drawTriangles();
  }
}