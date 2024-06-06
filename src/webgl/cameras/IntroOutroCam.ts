import { smoothstep } from "@webgl/math";
import { quat, vec3 } from "gl-matrix";
import Camera from "nanogl-camera";
import Node from "nanogl-node";

const ZERO_VEC = vec3.fromValues(0, 0, 0);
const SAVE_CAM_POSITION = vec3.fromValues(0, 0, 0);
const SAVE_CAM_PARENT_POSITION = vec3.fromValues(0, 0, 0);
const SAVE_CAM_ROTATION = quat.create();
const SAVE_CAM_PARENT_ROTATION = quat.create();
const QUAT_ZERO = quat.create();
quat.identity(QUAT_ZERO);
const V3B = vec3.create()

export function lerpToFromIntroOutro(
  value: number,
  cam: Camera,
  introLookAt: Node,
  introPosition: vec3,
  introLookAtV: vec3,
  isParent = false,
  isSequenced = false,
  sequenceLimit = 0.7
) {

  vec3.copy(SAVE_CAM_POSITION, cam.position)
  quat.copy(SAVE_CAM_ROTATION, cam.rotation)
  if (isParent) {
    vec3.copy(SAVE_CAM_PARENT_POSITION, cam._parent.position)
    quat.copy(SAVE_CAM_PARENT_ROTATION, cam._parent.rotation)
  }

  // if(isSequenced) {
  const goUp = smoothstep(0, sequenceLimit, value);
  const end = smoothstep(sequenceLimit, 1, value);
  if (isSequenced) {
    vec3.set(V3B, cam._parent.position[0], introPosition[1], cam._parent.position[2]);
    vec3.lerp(cam._parent.position, cam._parent.position, V3B, goUp);
    cam._parent.invalidate();
    cam._parent.updateWorldMatrix();
    vec3.copy(SAVE_CAM_PARENT_POSITION, cam._parent.position)
    // quat.copy(SAVE_CAM_PARENT_ROTATION, cam._parent.rotation)
  }

  if (!isSequenced || (isSequenced && goUp >= 1)) {
    const val = isSequenced ? end : value;
    vec3.copy(introLookAt.position, introPosition);
    introLookAt.lookAt(introLookAtV);
    introLookAt.invalidate();
    introLookAt.updateWorldMatrix();

    const tomove = isParent ? cam._parent : cam;
    quat.slerp(tomove.rotation, isParent ? SAVE_CAM_PARENT_ROTATION : SAVE_CAM_ROTATION, introLookAt.rotation, val);
    vec3.lerp(tomove.position, isParent ? SAVE_CAM_PARENT_POSITION : SAVE_CAM_POSITION, introPosition, val);
    tomove.invalidate();
    tomove.updateWorldMatrix();

    if (isParent) {
      quat.slerp(cam.rotation, SAVE_CAM_ROTATION, QUAT_ZERO, val);
      vec3.lerp(cam.position, SAVE_CAM_POSITION, ZERO_VEC, val);
      cam.invalidate();
      cam.updateWorldMatrix();
    }


  }
}