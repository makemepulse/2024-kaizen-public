import { reactive } from "vue";

import { loadSRT, replaceTextWithBrush } from "@/utils/Subtitles";

type SubtitleData = {
  start: number;
  end: number;
  text: string;
}

const OUTRO_TEXT_SRT = [
  { start: 0, end: 9, text: replaceTextWithBrush("at makemepulse, passion fuels everything we do. with each project, we bring a new <strong>perspective</strong> to the table, ensuring every experience is truly one-of-a-kind.") },
];

const Subtitles = reactive({
  blocking: false,
  content: new Map<string, SubtitleData[]>([
    ["outro-text", OUTRO_TEXT_SRT]
  ])
});

export default Subtitles;

export function setBlockingNext(blocking: boolean) {
  Subtitles.blocking = blocking;
}

export function setSubtitleContent(url: string, subtitles: SubtitleData[]) {
  Subtitles.content.set(url, subtitles);
}

export async function getSubtitleContent(url: string) {
  const data = Subtitles.content.get(url);
  if (data) {
    return data;
  }

  await loadSRT(url);
  return Subtitles.content.get(url);
}