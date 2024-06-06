import { vec3 } from "gl-matrix";

export const RIVER_WIDTH = 30;
export const RIVER_LENGTH = 80;
export const RIVER_RATIO = RIVER_LENGTH / RIVER_WIDTH;

export const HEATMAP_MARGIN = 4;
export const ELEMS_MARGIN = 4;
export const PAINT_MARGIN = 4;

export const ELEMS_ZONE_SIZE = RIVER_LENGTH + ELEMS_MARGIN * 2;
export const HEATMAP_ZONE_SIZE = ELEMS_ZONE_SIZE + HEATMAP_MARGIN * 2;

export const FOG_STEP = 15;

export const FLOW_SPEED = 0.001;
export const CLOUDS_SPEED = 0.004;

export const BACKGROUND_TOP_INTRO_COLOR: [number, number, number] = [0.54, 0.83, 0.78];
export const BACKGROUND_TOP_COLOR: [number, number, number] = [0.54, 0.83, 0.88];
export const BACKGROUND_TOP_ALPHA = 0.55;
export const BACKGROUND_MIDDLE_COLOR: [number, number, number] = [0.5, 0.75, 0.8];
export const BACKGROUND_MIDDLE_ALPHA = 0.5;
export const BACKGROUND_BOTTOM_COLOR: [number, number, number] = [0.02, 0.36, 0.43];
export const BACKGROUND_BOTTOM_ALPHA = 0.45;

export const BACKGROUND_TOP_COLOR_HOLD: [number, number, number] = [0.54, 0.83, 0.88];
export const BACKGROUND_MIDDLE_COLOR_HOLD: [number, number, number] = [0.82, 0.87, 0.85];
export const BACKGROUND_BOTTOM_COLOR_HOLD: [number, number, number] = [0.02, 0.36, 0.43];

export const JUMP_STEPS = [0.01, 2 / 10, 6 / 10, 1];

export const INTRO_POSITION = vec3.fromValues(0, 15, 0);
export const INTRO_LOOK_AT = vec3.fromValues(0, 25, -10);

export const VOICE_VOLUME = 0.5;
export const UI_VOLUME = 0.5;
