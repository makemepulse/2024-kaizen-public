import { vec3 } from "gl-matrix";

export const BACKGROUND_TOP_COLOR: [number, number, number] = [0.83, 0.73, 1.00];
export const BACKGROUND_TOP_ALPHA = 0.59;
export const BACKGROUND_MIDDLE_COLOR: [number, number, number] = [1, 0.92, 0.98];
export const BACKGROUND_MIDDLE_ALPHA = 0.49;
export const BACKGROUND_BOTTOM_COLOR: [number, number, number] = [0.89, 0.75, 0.95];
export const BACKGROUND_BOTTOM_ALPHA = 0.42;

export const BACKGROUND_TRANS_TOP_COLOR: [number, number, number] = [0.83, 0.73, 1.00];
export const BACKGROUND_TRANS_TOP_ALPHA = 0.59;
export const BACKGROUND_TRANS_MIDDLE_COLOR: [number, number, number] = [0.75, 0.74, 0.87];
export const BACKGROUND_TRANS_MIDDLE_ALPHA = 0.49;
export const BACKGROUND_TRANS_BOTTOM_COLOR: [number, number, number] = [0.89, 0.75, 0.95];
export const BACKGROUND_TRANS_BOTTOM_ALPHA = 0.42;

export const CAM_OUTRO_START = vec3.fromValues(0, 80, -60);
export const CAM_OUTRO_LKAT_START = vec3.fromValues(0, 100, -100);

export const JUMP_STEPS = [0.01, 0.42, 0.74, 1.0];

export const VOICE_VOLUME = 0.5;
export const UI_VOLUME = 0.5;

export const INTRO_POSITION = vec3.fromValues(0, 100, -50);
export const INTRO_LOOK_AT = vec3.fromValues(0, 100, -60);