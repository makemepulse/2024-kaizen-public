import { vec3 } from "gl-matrix";

export default class Plane {
  origin = vec3.create();
  normal = vec3.fromValues(0, 1, 0);
}

