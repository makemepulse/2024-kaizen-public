import { vec3 } from "gl-matrix";

export const BACKGROUND_TOP_INTRO_COLOR: [number, number, number] = [0.6, 0.65, 0.71];
export const BACKGROUND_TOP_COLOR: [number, number, number] = [0.6, 0.75, 0.71];
export const BACKGROUND_TOP_ALPHA = 0.5556;
export const BACKGROUND_MIDDLE_COLOR: [number, number, number] = [0.81, 0.89, 0.81];
export const BACKGROUND_MIDDLE_ALPHA = 0.5000;
export const BACKGROUND_BOTTOM_COLOR: [number, number, number] = [0.39, 0.66, 0.64];
export const BACKGROUND_BOTTOM_ALPHA = 0.3519;
export const INTRO_POSITION = vec3.fromValues(0, 60, 0);
export const INTRO_LOOK_AT = vec3.fromValues(60, 70, 0);

export const JUMP_STEPS = [0.01, 0.40625, 0.75, 1.0];

export const VOICE_VOLUME = 0.5;
export const UI_VOLUME = 0.5;