// Modified from mrdoob/three.js - https://github.com/mrdoob/three.js/blob/master/src/extras/curves/CatmullRomCurve3.js

import { vec3 } from "gl-matrix";

function CubicPoly() {
  let c0 = 0,
    c1 = 0,
    c2 = 0,
    c3 = 0;

  function init(x0: number, x1: number, t0: number, t1: number) {
    c0 = x0;
    c1 = t0;
    c2 = -3 * x0 + 3 * x1 - 2 * t0 - t1;
    c3 = 2 * x0 - 2 * x1 + t0 + t1;
  }

  return {
    initNonuniformCatmullRom: function (
      x0: number,
      x1: number,
      x2: number,
      x3: number,
      dt0: number,
      dt1: number,
      dt2: number
    ) {
      let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
      let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;

      t1 *= dt1;
      t2 *= dt1;

      init(x1, x2, t1, t2);
    },

    calc: function (t: number) {
      const t2 = t * t;
      const t3 = t2 * t;
      return c0 + c1 * t + c2 * t2 + c3 * t3;
    },
  };
}

const px = CubicPoly();
const py = CubicPoly();
const pz = CubicPoly();

export class CatmullRomCurve {
  points: vec3[];

  constructor(points: vec3[] = []) {
    this.points = points;
  }

  getPoint(t: number) {
    const points = this.points;
    const l = points.length;

    const p = l * t;
    let intPoint = Math.floor(p);
    const weight = p - intPoint;

    intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;

    const p0 = points[(intPoint - 1) % l];

    const p1 = points[intPoint % l];
    const p2 = points[(intPoint + 1) % l];

    const p3 = points[(intPoint + 2) % l];

    // init Centripetal / Chordal Catmull-Rom
    const pow = 0.5;
    let dt0 = Math.pow(vec3.squaredDistance(p0, p1), pow);
    let dt1 = Math.pow(vec3.squaredDistance(p1, p2), pow);
    let dt2 = Math.pow(vec3.squaredDistance(p2, p3), pow);

    // safety check for repeated points
    if (dt1 < 1e-4) dt1 = 1.0;
    if (dt0 < 1e-4) dt0 = dt1;
    if (dt2 < 1e-4) dt2 = dt1;

    px.initNonuniformCatmullRom(p0[0], p1[0], p2[0], p3[0], dt0, dt1, dt2);
    py.initNonuniformCatmullRom(p0[1], p1[1], p2[1], p3[1], dt0, dt1, dt2);
    pz.initNonuniformCatmullRom(p0[2], p1[2], p2[2], p3[2], dt0, dt1, dt2);

    const point = vec3.create();
    point.set([px.calc(weight), py.calc(weight), pz.calc(weight)]);

    return point;
  }
}
