import { reactive } from "vue";

export const Audio = reactive({
  isSubtitleShowed: false,
  url: "",
  showReaction: false,
  reactionDuration: 0,
  reactioName: "",
});

export const setSubtitleShowed = (showed: boolean) => {
  Audio.isSubtitleShowed = showed;
};

export const setSoundUrl = (url: string) => {
  Audio.url = url;
};

export const setShowReaction = (show: boolean) => {
  Audio.showReaction = show;
};

export const setReactionName = (name: string) => {
  Audio.reactioName = name;
}

export const setReactionDuration = (duration: number) => {
  Audio.reactionDuration = duration;
};
