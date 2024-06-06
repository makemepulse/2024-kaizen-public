import { quat, vec3 } from "gl-matrix";

export const CAMERA_BEHIND_VALUE = 20;
export const ORIGIN = 80;
export const BUTTERFLY_OFFSET = -50;

export const X_AXIS = vec3.fromValues(1, 0, 0);

export const V3A = vec3.create();
export const V3B = vec3.create();
export const QUAT = quat.create();

export const JUMP_STEPS = [0.01, 0.36, 0.73, 1.0];

export const BACKGROUND_TOP_COLOR: [number, number, number] = [0.73, 0.64, 0.77];
export const BACKGROUND_MIDDLE_COLOR: [number, number, number] = [0.97, 0.78, 0.74];
export const BACKGROUND_BOTTOM_COLOR: [number, number, number] = [0.37, 0.24, 0.51];

export const BACKGROUND_TOP_COLOR_INTRO: [number, number, number, number] = [0.111, 0.443, 0.575, 0.58];
export const BACKGROUND_MIDDLE_COLOR_INTRO: [number, number, number, number] = [0.207, 0.56, 0.65, 0.52];
export const BACKGROUND_BOTTOM_COLOR_INTRO: [number, number, number, number] = [0.03, 0.29, 0.529, 0.4];

export const BACKGROUND_TOP_COLOR_OUTRO: [number, number, number] = [1.0, 0.84, 0.88];
export const BACKGROUND_MIDDLE_COLOR_OUTRO: [number, number, number] = [1.0, 0.90, 0.78];
export const BACKGROUND_BOTTOM_COLOR_OUTRO: [number, number, number] = [0.75, 0.54, 0.58];

export const VOICE_VOLUME = 0.3;
export const UI_VOLUME = 0.3;

export const PP_VIGNETTE_GRAIN_STRENGTH_INTRO = 1.0;
export const PP_VIGNETTE_COLOR_INTRO: [number, number, number] = [1.0, 1.0, 1.0];
export const PP_CONTRAST_INTRO = 1.12;
export const PP_TEXTUREPASS_REPEAT_INTRO = 4.45;
export const PP_TEXTUREPASS_OPACITY_INTRO = 0.48;

export const INTRO_POSITION = vec3.fromValues(-85, 0.5, 20);
export const INTRO_LOOK_AT = vec3.fromValues(0, 1, -80);
export const INTRO_ROTATION = quat.fromValues(0, 0, 0, 1);