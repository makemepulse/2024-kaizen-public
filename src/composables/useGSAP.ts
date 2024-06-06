import { onUnmounted } from "vue";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

export function useGSAP() {
  let timelines: gsap.core.Timeline[] = [];
  let splitTexts: SplitText[] = [];

  const addTimeline = (tl: gsap.core.Timeline) => {
    timelines.push(tl);
  };

  const killTimelines = (reset?: HTMLElement) => {
    if(timelines.length === 0) return;

    timelines.forEach(tl => {
      if(reset) {
        gsap.to(reset, { clearProps: "all" });
      }

      tl.revert().kill();
    });

    timelines = [];
  };

  const addSplitText = (split: SplitText) => {
    splitTexts.push(split);
  };

  const killSplitTexts = () => {
    if(splitTexts.length === 0) return;

    splitTexts.reverse().forEach(split => {
      split.revert();
    });

    splitTexts = [];
  };

  onUnmounted(() => {
    killTimelines();
    killSplitTexts();
  });

  return { addTimeline, addSplitText };
}