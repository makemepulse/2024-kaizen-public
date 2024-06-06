<template>
  <div class="scene-layout bg" :class="{ show }" ref="root">
    <!-- <div :class="{ 'active': isSubtitleShowed || isReaction }" class="background-subtitles" /> -->

    <SceneIntro v-if="show" ref="sceneIntroRef" />
    <SceneTitle v-if="show" ref="sceneTitleRef" />

    <Subtitle :theme="'scene' + sceneId" v-if="isSubtitleShowed" @completed="onSubtitleCompleted" />

    <ReactionSubtitle @completed="onReactionCompleted" v-if="isReaction" />

    <Transition :css="false" @leave="onNextButtonHide">
      <NextBtn @click="onClick" v-if="delayedShowNextBtn" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import AppService from "@/services/AppService";
import { useAppState } from "@/services/Composition";
import { useAppContext } from "@/services/Composition";
import { gsap } from "gsap";

import SceneIntro from "@/components/pages/sceneTitle/SceneIntro.vue";
import SceneTitle from "@/components/pages/sceneTitle/SceneTitle.vue";

import Subtitle from "@/components/blocks/Subtitle/Subtitle.vue";
import { Audio, setShowReaction, setSubtitleShowed } from "@/store/modules/Audio";
import { setCursor, CursorState } from '@/store/modules/Cursor';
import Delay from "@/core/Delay";

const { state } = useAppState();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const hasReachedPortail = useAppContext('hasReachedPortail');
const sceneId = useAppContext('sceneId');
const sceneIntroRef = ref();
const sceneTitleRef = ref();
// const hideNextBtn = ref<boolean>(false)

const isSceneInteractive = computed(() => {
  // console.group('isSceneInteractive', !AppService.Scene?.isIntroPlaying.value && !AppService.Scene?.isOutroPlaying.value && !AppService.Scene?.isTitlePlaying.value && !AppService.Scene?.isTransitionToPortailPlaying.value);
  // console.log('isIntroPlaying', AppService.Scene?.isIntroPlaying.value)
  // console.log('isOutroPlaying', AppService.Scene?.isOutroPlaying.value)
  // console.log('isTitlePlaying', AppService.Scene?.isTitlePlaying.value)
  // console.log('isTransitionToPortailPlaying', AppService.Scene?.isTransitionToPortailPlaying.value)
  // console.groupEnd();
  return !AppService.Scene?.isIntroPlaying.value && !AppService.Scene?.isOutroPlaying.value && !AppService.Scene?.isTitlePlaying.value && !AppService.Scene?.isTransitionToPortailPlaying.value
});
const isTitleShown = computed(() => AppService.Scene?.showTitle.value);
const isFirstRelease = computed(() => AppService.Scene?.firstRelease.value);

const isReaction = computed(() => Audio.showReaction);
const isSubtitleShowed = computed(() => Audio.isSubtitleShowed);

const isGoingToPortail = computed(() => (hasReachedPortail.value && !AppService.Scene?.isIntroPlaying.value && !AppService.Scene?.isOutroPlaying.value));
const showNextBtn = computed(() => {
  // console.group('showNextBtn', isSceneInteractive.value && (isTitleShown.value || (isGoingToPortail.value)));
  // console.log('isSceneInteractive', isSceneInteractive.value)
  // console.log('isTitleShown', isTitleShown.value)
  // console.log('isGoingToPortail', isGoingToPortail.value)
  // console.groupEnd();
  return isSceneInteractive.value && isFirstRelease.value;
});

const delayedShowNextBtn = ref(false)

watch(() => props.show, (show) => {
  
})

watch(showNextBtn, async (show) => {
  if (show) {
    await Delay(500)
    if (isSceneInteractive.value) delayedShowNextBtn.value = true
    return
  }
  delayedShowNextBtn.value = false
})

const onSubtitleCompleted = () => {
  setSubtitleShowed(false)
}

const onReactionCompleted = () => {
  setShowReaction(false)
}

const onClick = () => {
  AppService.state.send("SCENE_FINISH")

  setCursor(CursorState.WAIT)
}

const onNextButtonHide = (el: Element, done: () => void) => {
  gsap.to(el, { opacity: 0, duration: 0.5, ease: 'quart.out', onComplete: done })
}

</script>

<style lang="stylus" scoped>
.scene-layout
  pointer-events none
  position relative
  inset 0
  full()
  display none
  &.show
    display block

  .primary-btn
    position absolute
    bottom rem(100)

  .background-subtitles
    position absolute
    bottom 0
    left 0
    width 100%
    height 18%
    background linear-gradient(0deg, rgba(0, 0, 0, 0.50) 0%, rgba(0, 0, 0, 0.00) 100%)
    opacity 0
    pointer-events none
    z-index 1
    transition opacity 0.5s
    &.active
      opacity 0.6
</style>