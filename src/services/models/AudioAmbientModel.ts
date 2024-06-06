import { AudioInfo } from "./AudioRecordModel";

export const AudioAmbientIds = ["ambient-main"];

export type AudioAmbientId = typeof AudioAmbientIds[number];

export const AudioAmbientInfos = {
  "ambient-main": {
    name: "ambient-main",
    asset: "audio/ambient/ambient-main.mp3",
    sprite: {
      intro: [0, 195000, true],
    },
  },
} as Record<AudioAmbientId, AudioInfo>;
