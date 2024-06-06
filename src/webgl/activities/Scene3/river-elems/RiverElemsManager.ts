import { vec3 } from "gl-matrix";

import Frog from "@webgl/activities/Scene3/frog/Frog";
import Time from "@webgl/Time";
import River from "@webgl/activities/Scene3/River";
import Particles from "@webgl/activities/Scene3/decor/Particles";
import PaintManager from "@webgl/activities/Scene3/water/PaintManager";
import RockManager, { RockElem } from "@webgl/activities/Scene3/river-elems/RockManager";
import LilypadManager, { LilypadElem } from "@webgl/activities/Scene3/river-elems/LilypadManager";
import { ElemData, ElemPoolManager } from "@webgl/activities/Scene3/ElemPoolManager";
import { ELEMS_ZONE_SIZE, FLOW_SPEED, HEATMAP_ZONE_SIZE, PAINT_MARGIN, RIVER_WIDTH } from "@webgl/activities/Scene3/constants";

const MAX_COUNT = 20;
const MAX_PAINT_COUNT = 70;
const MAX_ADD_TRIES = 20;
const MAX_OVERLAP_TRIES = 8;

const CVS_SIZE = 512;

const Z_BOUNDS = [ELEMS_ZONE_SIZE / 2, -ELEMS_ZONE_SIZE / 2];

const ATTRACTION = vec3.create();
const AVOIDANCE = vec3.create();
const REPULSION = vec3.create();
const Y_AXIS = vec3.fromValues(0, 1, 0);
const DIRECTION = vec3.create();

export default class RiverElemsManager {
  isSetup = false;
  heatmapInvalid = false;

  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  worldToCanvas = [1, 1];

  offset = 0;
  prevOffset = 0;

  constructor(private river: River) {
  }

  // --GETTERS--

  get frog(): Frog {
    return this.river.frog;
  }

  get rockManager(): RockManager {
    return this.river.rockManager;
  }

  get lilypadManager(): LilypadManager {
    return this.river.lilypadManager;
  }

  get waterPaintManager(): PaintManager {
    return this.river.water.paintManager;
  }

  get particlesManager(): Particles {
    return this.river.particles;
  }

  get rockList(): RockElem[] {
    return this.rockManager.elemList;
  }

  get lilypadList(): LilypadElem[] {
    return this.lilypadManager.elemList;
  }

  get waterPaintList(): ElemData[] {
    return this.waterPaintManager.elemList;
  }

  // --START/STOP--

  start() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = CVS_SIZE;
    this.canvas.height = CVS_SIZE * (HEATMAP_ZONE_SIZE / RIVER_WIDTH);
    this.worldToCanvas = [
      this.canvas.width / RIVER_WIDTH,
      this.canvas.height / HEATMAP_ZONE_SIZE,
    ];

    /// #if DEBUG
    // make canvas visible to debug
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.right = "0";
    this.canvas.style.maxHeight = "40vh";
    this.canvas.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    // document.body.append(this.canvas);
    /// #endif

    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

    this.offset = this.river.root.z;
    this.prevOffset = this.offset;

    this.setupElems();
    this.heatmapInvalid = true;
  }

  stop() {
    this.canvas.remove();
    this.canvas = null;
  }

  // --SETUP ELEMS--

  setupElems() {
    this.isSetup = true;

    this.setupRocks();
    this.updateHeatmap();

    this.setupLilypads();
    this.setupWaterPaint();
    this.setupParticles();
  }

  // ::ROCKS::

  setupRocks() {
    this.rockManager.currentZ = Z_BOUNDS[0];
    this.addRocks();

    if (this.frog.currentRock) return;

    let currentDist = Infinity;
    let currentRock = null;
    for (const rock of this.rockManager.mainRocks) {
      const dist = Math.abs(rock.node.z);

      if (dist <= currentDist) {
        currentRock = rock;
        currentDist = dist;
        continue;
      }

      this.river.setInitialRock(currentRock);
      break;
    }

    this.heatmapInvalid = true;
  }

  // ::LILYPADS::

  setupLilypads() {
    this.lilypadManager.currentZ = Z_BOUNDS[0];

    let addTries = 0;

    // add lilypads until the end of the river (up to MAX_COUNT elems & up to MAX_ADD_TRIES to add the elems)
    addLoop:
    while ((this.lilypadManager.currentZ + this.offset) > Z_BOUNDS[1] && this.lilypadList.length < MAX_COUNT && addTries < MAX_ADD_TRIES) {
      addTries++;

      const elem = this.lilypadManager.createElem();

      let overlapTries = 0;
      let isOverlapping = true;

      // avoid overlapping (up to MAX_OVERLAP_TRIES to place the elem)
      while (isOverlapping && overlapTries < MAX_OVERLAP_TRIES) {
        const [x, y, radius] = this.getHeatmapDimensions(elem.node.x, elem.node.z, elem.radius);

        const rectX = x - radius;
        const rectY = y - radius;
        const width = radius * 2 - Math.max(0, 0 - rectX);
        const height = radius * 2 - Math.max(0, 0 - rectY);

        // if the zone is null, elem is too far -> break the add loop
        if (width < 1 || height < 1) break addLoop;

        const heatmapZone = this.ctx.getImageData(Math.max(rectX, 0), Math.max(rectY, 0), width, height);

        // if the zone is empty, draw & add the elem
        if (!heatmapZone.data.includes(255)) {
          this.lilypadManager.addElem(elem);
          this.lilypadManager.updateZ(elem);
          isOverlapping = false;
          continue;
        }

        // if the zone is not empty, offset the elem and try again
        elem.node.z -= elem.radius * 2;

        overlapTries++;
      }
    }
  }

  // ::WATER PAINT::

  setupWaterPaint() {
    this.waterPaintManager.currentZ = Z_BOUNDS[0];
    this.addWaterPaint();
  }

  // ::PARTICLES::

  setupParticles() {
    this.particlesManager.updateBounds(
      [-RIVER_WIDTH * 0.3, 0.5, Z_BOUNDS[1]],
      [RIVER_WIDTH * 0.3, 5, Z_BOUNDS[0]]
    );

    this.particlesManager.addParticles();

    this.particlesManager.updateBounds(
      [-RIVER_WIDTH * 0.3, 0.5, Z_BOUNDS[1] - 4],
      [RIVER_WIDTH * 0.3, 5, Z_BOUNDS[1]]
    );
  }

  // --UPDATE ELEMS--

  removeElems() {
    this.remove(this.lilypadManager);

    if (this.prevOffset === this.offset) return;

    this.remove(this.rockManager);
    this.remove(this.waterPaintManager, true);
    this.removeParticles();
  }

  addElems() {
    this.addLilypads();

    if (this.prevOffset === this.offset) return;

    this.addRocks();
    this.addWaterPaint();
    this.addParticles();
  }

  // ::BASE::

  remove(manager: ElemPoolManager, checkAll = false) {
    // remove elems before the start of the river
    for (let i = 0; i < manager.elemList.length; i++) {
      const elem = manager.elemList[i];
      const z = elem.node.z - elem.radius + this.offset;

      if (z <= Z_BOUNDS[0]) {
        if (checkAll) continue;
        break;
      }

      manager.removeElem(i, elem);
    }
  }

  // ::ROCKS::

  addRocks() {
    let addTries = 0;

    // add elems until the end of the river (up to MAX_COUNT elems & up to MAX_ADD_TRIES to add the elems)
    while ((this.rockManager.currentZ + this.offset) > Z_BOUNDS[1] && this.rockManager.mainRocks.length < MAX_COUNT && addTries < MAX_ADD_TRIES) {
      addTries++;

      const elem = this.rockManager.createElem();
      this.rockManager.addElem(elem);

      // remove lilypad if new rock is overlapping
      for (const [index, lilypad] of this.lilypadList.entries()) {
        const distance = vec3.distance(elem.node.position, lilypad.node.position) - lilypad.radius;

        if (distance > elem.radius) continue;

        this.lilypadManager.removeElem(index, lilypad);
      }
    }
  }

  // ::LILYPADS::

  addLilypads() {
    const lastElem = this.lilypadList[this.lilypadList.length - 1];

    // add elem if the last elem is within bounds
    if (lastElem && (lastElem.node.z - lastElem.radius + this.offset) <= Z_BOUNDS[1]) return;

    this.lilypadManager.currentZ = Z_BOUNDS[1] - this.offset - 5 - Math.random() * 10;
    const elem = this.lilypadManager.createElem();
    this.lilypadManager.addElem(elem);
  }

  // ::WATER PAINT::

  addWaterPaint() {
    let addTries = 0;

    // add elems until the end of the river (up to MAX_PAINT_COUNT elems & up to MAX_ADD_TRIES to add the elems
    while ((this.waterPaintManager.currentZ + this.offset) > (Z_BOUNDS[1] - PAINT_MARGIN) && this.waterPaintList.length < MAX_PAINT_COUNT && addTries < MAX_ADD_TRIES) {
      addTries++;

      const elem = this.waterPaintManager.createElem(true);
      const smallerElemsCount = Math.floor(Math.random() * 2);

      for (let i = 0; i < smallerElemsCount; i++) {
        const smallerElem = this.waterPaintManager.createElem();
        this.waterPaintManager.addElem(smallerElem);
      }

      this.waterPaintManager.addElem(elem, true);
    }
  }

  // ::PARTICLES::

  addParticles() {
    this.particlesManager.addParticles();
  }

  removeParticles(){
    // remove elems before the start of the river
    for (let i = 0; i < this.particlesManager.particlesData.length; i++) {
      const elemZ = this.particlesManager.particlesData[i].z;
      const z = elemZ + this.offset;

      if (z <= Z_BOUNDS[0]) continue;

      this.particlesManager.removeParticle(i);
    }
  }

  // --FLOW--

  updateLilypads(speed: number) {
    for (const lilypad of this.lilypadList) {
      lilypad.target[2] = lilypad.node.z + 5;

      // compute attraction
      vec3.subtract(ATTRACTION, lilypad.target, lilypad.node.position);
      vec3.normalize(ATTRACTION, ATTRACTION);

      // compute repulsion & avoidance
      REPULSION.set([0, 0, 0]);
      AVOIDANCE.set([0, 0, 0]);
      let obstacleProximity = 0;
      for (const rock of this.rockList) {
        const distance = vec3.distance(lilypad.node.position, rock.node.position) - lilypad.radius - rock.radius;

        if (distance > rock.radius) continue;

        obstacleProximity = 1 - distance / rock.radius;

        // compute repulsion
        vec3.subtract(REPULSION, lilypad.node.position, rock.node.position);

        // compute avoidance
        Y_AXIS[1] = REPULSION[0] >= 0 ? 1 : -1;
        vec3.cross(AVOIDANCE, REPULSION, Y_AXIS);

        // normalize
        vec3.normalize(REPULSION, REPULSION);
        vec3.normalize(AVOIDANCE, AVOIDANCE);
        break;
      }

      // add attraction, repulsion & avoidance
      vec3.scale(ATTRACTION, ATTRACTION, 1 - obstacleProximity);
      vec3.scaleAndAdd(DIRECTION, ATTRACTION, AVOIDANCE, obstacleProximity * 0.8);
      vec3.scaleAndAdd(DIRECTION, DIRECTION, REPULSION, obstacleProximity * 0.2);

      // scale the direction
      vec3.scale(DIRECTION, DIRECTION, Time.dt * FLOW_SPEED * speed);
      // add random movement
      DIRECTION[0] += Math.cos(Time.time * 0.001 + lilypad.seed * Math.PI) * 0.1 * Time.dt * FLOW_SPEED;
      // update lilypad rotation
      lilypad.node.rotateY(DIRECTION[0]);
      // update lilypad position
      vec3.add(lilypad.node.position, lilypad.node.position, DIRECTION);

      lilypad.node.invalidate();
      lilypad.node.updateWorldMatrix();
    }
  }

  updateFlowElems(speed: number) {
    this.updateLilypads(speed);
  }

  // --HEATMAP--

  getHeatmapDimensions(nodeX: number, nodeZ: number, radius: number): [number, number, number] {
    const x = this.canvas.width * 0.5 + nodeX * this.worldToCanvas[0];
    const y = this.canvas.height * 0.5 + nodeZ * this.worldToCanvas[1];
    const canvasRadius = radius * this.worldToCanvas[0];
    return [x, y, canvasRadius];
  }

  drawElem(x: number, y: number, radius: number) {
    this.ctx.globalCompositeOperation = "lighten";

    const radiusColor = radius * 2 / this.canvas.width * 255;
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    gradient.addColorStop(0, `rgba(255, ${255}, ${radiusColor}, 1)`);
    gradient.addColorStop(0.5, `rgba(255, ${255 / 2}, ${radiusColor}, 1)`);
    gradient.addColorStop(1, `rgba(0, 0, ${radiusColor}, 1)`);

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(
      x, y,
      radius * 2,
      0, Math.PI * 2
    );
    this.ctx.fill();
  }

  updateHeatmap() {
    if (!this.heatmapInvalid) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const rock of this.rockList) {
      for (const [index, radius] of rock.radiusList.entries()) {
        const [x, y, hmRadius] = this.getHeatmapDimensions(
          rock.renderableNodes[index]._wposition[0],
          rock.renderableNodes[index]._wposition[2],
          radius
        );
        this.drawElem(x, y, hmRadius);
      }
    }

    this.heatmapInvalid = false;
  }

  // --PRE-RENDER--

  preRender(speedProgress: number) {
    if (!this.isSetup) return;

    this.prevOffset = this.offset;
    this.offset = this.river.root.z;

    if (this.offset !== this.prevOffset)
      this.heatmapInvalid = true;

    this.removeElems();
    this.updateHeatmap();
    this.updateFlowElems(1 + speedProgress * 4);
    this.addElems();
  }
}