import Node from "nanogl-node";
import { vec3 } from "gl-matrix";

export default class WaterPlane {
  node: Node;

  constructor(public position: vec3, public rotationY: number, public scale: number, public blendThreshold: number, public blendOpacity: number, public rotationSpeed: number) {
    this.node = new Node();
    vec3.set(this.node.scale, scale, scale, scale);
    this.node.rotateY(rotationY);
    vec3.copy(this.node.position, position);
    this.node.invalidate();
    this.node.updateWorldMatrix();
  }
}
