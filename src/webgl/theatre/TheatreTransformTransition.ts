import Node from "nanogl-node";
import { vec3 } from "gl-matrix";
import { ISheet, ISheetObject, types } from "@theatre/core";

export type vec3Data = [number, number, number];

export default class TheatreTransformTransition {
  keyframes = {
    scale: [] as vec3[],
    lookAt: [] as vec3[],
    position: [] as vec3[],
  };
  currentLookAt = vec3.create();

  public updateValues = { position: false, lookAt: false, scale: false };

  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  constructor(
    private n: Node, private sheet: ISheet, private name: string,
    public updateWorldMatrix = true, public externalLookAt?: vec3
  ) {
    const obj = sheet.object(name, {
      scaleProgress: types.number(0),
      lookAtProgress: types.number(0),
      positionProgress: types.number(0),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      if (this.updateValues.position) {
        const { from, to, progress } = this.getCurrentKeyframes("position", values.positionProgress);
        vec3.lerp(this.n.position, from, to, progress);
      }

      if (this.updateValues.scale) {
        const { from, to, progress } = this.getCurrentKeyframes("scale", values.scaleProgress);
        vec3.lerp(this.n.scale, from, to, progress);
      }

      if (this.updateValues.lookAt) {
        const { from, to, progress } = this.getCurrentKeyframes("lookAt", values.lookAtProgress);
        vec3.lerp(this.currentLookAt, from, to, progress);
        if (!externalLookAt) {
          this.n.lookAt(this.currentLookAt);
        } else {
          vec3.copy(this.externalLookAt, this.currentLookAt);
        }
      }

      this.n.invalidate();
      if (updateWorldMatrix) this.n.updateWorldMatrix();
    });

    this._obj = obj;
  }

  get obj() {
    return this._obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }

  setKeyframes(
    { position, lookAt, scale }:
      { position?: vec3Data[], lookAt?: vec3Data[], scale?: vec3Data[] }
  ) {
    if (position) {
      this.keyframes.position = position.map(data => vec3.fromValues(...data));
      this.updateValues.position = true;
    }
    if (lookAt) {
      this.keyframes.lookAt = lookAt.map(data => vec3.fromValues(...data));
      this.updateValues.lookAt = true;
    }
    if (scale) {
      this.keyframes.scale = scale.map(data => vec3.fromValues(...data));
      this.updateValues.scale = true;
    }
  }

  getCurrentKeyframes(key: "position" | "scale" | "lookAt", progress: number) {
    const keyframes = this.keyframes[key];
    const currentStep = Math.max(0, Math.floor(progress));
    const targetStep = Math.min(currentStep + 1, keyframes.length - 1);

    return {
      from: keyframes[currentStep],
      to: keyframes[targetStep],
      progress: progress % 1
    };
  }

  disable() {
    this.updateValues.position = false;
    this.updateValues.lookAt = false;
    this.updateValues.scale = false;
  }
}