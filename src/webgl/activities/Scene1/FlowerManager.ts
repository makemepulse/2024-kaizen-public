import Scene1 from "./Scene1";
import Node from "nanogl-node";
import Time from "@webgl/Time";
import { vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import { ISheet } from "@theatre/core";
import AppService from "@/services/AppService";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { CatmullRomCurve } from "../Scene2/utils/CatmullRom";
import { BUTTERFLY_OFFSET, CAMERA_BEHIND_VALUE, ORIGIN } from "./constants";

const V3_A = vec3.create();
export default class FlowerManager {

  private radius = 7;
  private numIt: number;
  private pathRadius = 7;
  public nullList: any[];
  private pathList: vec3[];
  private numFlowers: number;
  public catmullRom: CatmullRomCurve;

  private sheetPerfectVariants: ISheet[] = [];

  public speed = { value: 0.3 };
  private speedBoostS = { value: 0.0 };
  private speedBoostM = { value: 0.0 };
  private speedBoostL = { value: 0.0 };
  private butterflyFlight = { value: 0.0 };

  private sheetSuccess: ISheet;

  private speedTheatre: TheatreFloat;
  private speedBoostSTheatre: TheatreFloat;
  private speedBoostMTheatre: TheatreFloat;
  private speedBoostLTheatre: TheatreFloat;
  private butterflyFlightTheatre: TheatreFloat;

  private xPos = 0;
  private distance = 0;
  public xPosButterfly = 0;
  public xPostButterflyLookAt = 0;
  private xPostButterflyPrevius = 0;

  private cameraOffset = CAMERA_BEHIND_VALUE;
  private butterflyOffset = ORIGIN + BUTTERFLY_OFFSET;
  private distanceCamera: number;
  private distanceButterfly: number;

  constructor(private renderer: Renderer
  ) {
    this.numIt = 0;
    this.nullList = [];
    this.pathList = [];
    this.numFlowers = 200;

    // Points for the CatmullRom curve
    const points = [
      vec3.fromValues(0, 0, 80),
      vec3.fromValues(0, 0, 70),
      vec3.fromValues(-3, 0, 60),
      vec3.fromValues(-7, 0, 50),
      vec3.fromValues(-9, 0, 40),
      vec3.fromValues(-7, 0, 30),
      vec3.fromValues(-5, 0, 20),
      vec3.fromValues(-3, 0, 10),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(5, 0, -10),
      vec3.fromValues(8, 0, -20),
      vec3.fromValues(10, 0, -30),
      vec3.fromValues(11, 0, -40),
      vec3.fromValues(8, 0, -50),
      vec3.fromValues(5, 0, -60),
      vec3.fromValues(0, 0, -70),
      vec3.fromValues(0, 0, -80),
    ];

    this.catmullRom = new CatmullRomCurve(points);

    this.generateButterflyPath();
    this.generateFlowers();

    // Theatre animations
    this.sheetSuccess = AppService.state.machine.context.theatreProject.project.sheet("scene1-success");

    /// #if DEBUG
    Scene1.guiFolder.range(this.speed, "value", 0, 0.3).setLabel("Flower move");
    /// #endif
  }

  start() {
    this.speedTheatre = new TheatreFloat(this.speed, this.sheetSuccess, "FlowerSpeed");
    this.butterflyFlightTheatre = new TheatreFloat(this.butterflyFlight, this.sheetSuccess, "Butterfly Flight Flower");

    if (this.sheetPerfectVariants[0]) this.speedBoostSTheatre = new TheatreFloat(this.speedBoostS, this.sheetPerfectVariants[0], "FlowerSpeedBoostS");
    if (this.sheetPerfectVariants[1]) this.speedBoostMTheatre = new TheatreFloat(this.speedBoostM, this.sheetPerfectVariants[1], "FlowerSpeedBoostM");
    if (this.sheetPerfectVariants[2]) this.speedBoostLTheatre = new TheatreFloat(this.speedBoostL, this.sheetPerfectVariants[2], "FlowerSpeedBoostL");
  }

  stop() {
    this.speedTheatre?.dispose();
    this.speedBoostSTheatre?.dispose();
    this.speedBoostMTheatre?.dispose();
    this.speedBoostLTheatre?.dispose();
    this.butterflyFlightTheatre?.dispose();
  }

  setAlternateSheet(sheets: ISheet[]) {
    this.sheetPerfectVariants = sheets;
  }

  randomPoint() {
    return vec3.fromValues(
      Math.random() * 200 - 100,
      0,
      Math.random() * 160 - 80
    );
  }

  getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Butterfly path generation
  generateButterflyPath() {
    for (let t = 0; t <= 1; t += 0.02) {
      this.pathList.push(vec3.fromValues(this.catmullRom.getPoint(t)[0], this.catmullRom.getPoint(t)[1], this.catmullRom.getPoint(t)[2]));
    }
  }

  // Flower generation
  generateFlowers() {
    let count = 0;
    while (this.nullList.length < this.numFlowers && this.numIt < 1000) {
      this.numIt++;
      const p = this.randomPoint();
      if (this.isPointOnPath(p)) {
        continue;
      }
      if (this.isPointOnOtherFlower(p)) {
        continue;
      }

      // Flower parameters
      const flower = new Node();
      flower.position.set(p);

      const flowerScale = this.getRandomArbitrary(0.4, 1.0);
      flower.scale.set([flowerScale, flowerScale, flowerScale]);

      const flowerRotationZ = this.getRandomArbitrary(-Math.PI / 12, Math.PI / 12);
      flower.rotateZ(flowerRotationZ + Math.PI / 2);

      // const flowerRotationY = this.getRandomArbitrary(-Math.PI / 12, Math.PI / 12);
      // flower.rotateY(flowerRotationY);

      const flowerRotationX = this.getRandomArbitrary(-Math.PI / 4, Math.PI / 4);
      // flower.rotateX(flowerRotationX);
      this.nullList.push(flower);

      const renderableIndex = Math.round(Math.random());
      const offsetScale = this.getRandomArbitrary(0.0, 0.75);
      this.nullList[count].extras = { randomOffset: Math.random() * Math.PI * 2, randomOffsetRotation: Math.random(), isLeftOrRight: 0, flowerRenderable: renderableIndex, offsetScale: offsetScale };
      count++;
    }
  }

  isPointOnPath(p: vec3) {
    for (let i = 0; i < this.pathList.length; i++) {
      if (vec3.distance(this.pathList[i], p) < this.pathRadius) {
        return true;
      }
    }
    return false;
  }

  isPointOnOtherFlower(p: vec3) {
    for (let i = 0; i < this.nullList.length; i++) {
      if (vec3.distance(this.nullList[i].position, p) < this.radius) {
        return true;
      }
    }
    return false;
  }

  checkNullList(nullList: any) {
    for (let i = 0; i < nullList.length; i++) {
      if (nullList[i].position[2] > 80) {
        nullList[i].position[2] = -80;
        // Roll a dice and if it fails change the scale to 0
        const dice = Math.random();
        if (dice < 0.1) {
          nullList[i].setScale(0);
        } else {
          nullList[i].setScale(this.getRandomArbitrary(0.5, 1.0));
        }
      }
    }
  }

  preRender(renderer: Renderer) {
    this.distance += (this.speed.value + this.speedBoostS.value + this.speedBoostM.value + this.speedBoostL.value) * Time.scaledDt * 0.1;

    this.distanceButterfly = ORIGIN + (this.distance - this.butterflyOffset);
    this.distanceButterfly = this.distanceButterfly % 160;

    this.distanceCamera = ORIGIN + (this.distance - this.butterflyOffset - this.cameraOffset);
    this.distanceCamera = this.distanceCamera % 160;

    this.xPos = this.catmullRom.getPoint((this.distance) / 160)[0];
    this.xPosButterfly = this.catmullRom.getPoint((this.distanceButterfly) / 160)[0];
    this.xPostButterflyLookAt = this.catmullRom.getPoint((this.distanceButterfly + 2) / 160)[0];

    for (const nullInstance of this.nullList) {
      nullInstance.position[2] += (this.speed.value + this.speedBoostS.value + this.speedBoostM.value + this.speedBoostL.value) * Time.scaledDt * 0.1;
      nullInstance.invalidate();
      nullInstance.updateWorldMatrix();
    }
    renderer.camera.updateWorldMatrix();

    // Sort the flowers by distance to the camera
    vec3.set(V3_A, renderer.camera._wmatrix[12], renderer.camera._wmatrix[13], renderer.camera._wmatrix[14]);
    this.checkNullList(this.nullList);
    this.nullList.sort((a, b) => {
      const distA = vec3.distance(a.position, V3_A);
      const distB = vec3.distance(b.position, V3_A);

      return distB - distA;
    });

    this.xPostButterflyPrevius = this.xPosButterfly;
  }
}