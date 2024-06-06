export const AudioRecordIds = ["alarm-clock-audio"];

export type AudioRecordId = typeof AudioRecordIds[number];

export type AudioInfo = {
  name: string;
  asset: string;
  sprite?: any;
};

export const AudioRecordInfos = {
  "alarm-clock-audio": {
    name: "alarm-clock-audio",
    asset: "audio/alarm-clock-audio.mp3",
  },
} as Record<AudioRecordId, AudioInfo>;
