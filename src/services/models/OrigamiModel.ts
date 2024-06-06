// import { ActivityId } from "@webgl/activities/ActivityRegistry";

export const OrigamiIds = [
  "papillon",
  "carpe",
  "grenouille",
  "grue",
] as const;

export type OrigamiId = typeof OrigamiIds[number]

export const framesData = {
  "papillon": {
    nbFrames: 40,
    framerate: 20
  },
  "carpe": {
    nbFrames: 40,
    framerate: 20
  },
  "grenouille": {
    nbFrames: 27,
    framerate: 20
  },
  "grue": {
    nbFrames: 53,
    framerate: 20
  },
  "all": {
    nbFrames: 48,
    framerate: 20
  },
  "papillon-carpe": {
    nbFrames: 17,
    framerate: 20
  },
  "carpe-grenouille": {
    nbFrames: 16,
    framerate: 20
  },
  "grenouille-grue": {
    nbFrames: 16,
    framerate: 20
  },
} as Record<OrigamiId | "all" |"papillon-carpe" | "carpe-grenouille" | "grenouille-grue", { nbFrames: number, framerate: number }>

// export const OrigamiActivities = {
//   "grenouille": "origami1",
//   "carpe": "origami2",
//   "chenille": "origami3",
//   "grue": "origami4",

// } as Record<OrigamiId, ActivityId>

// export function getRoomActivityId(origamiId: OrigamiId) {
//   return OrigamiActivities[origamiId]
// }