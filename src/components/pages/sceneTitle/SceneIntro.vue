<template>
  <div class="scene-intro bg" :class="{ 'show': showBg }"  ref="root">
    <div class="scene-intro--bg" ref="bgRef" />
    <div class="scene-intro-inner">
      <video :key="sceneId" ref="videoRef" className="scene-intro-inner__video" muted autoPlay="false" preload="auto"
        playsInline>
        <source v-bind="sceneIntroSource" />
      </video>
      <div ref="placeholderRef" class="scene-intro-inner__placeholder" v-bind="scenePlaceholder" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import gsap from 'gsap'
import CustomEase from 'gsap/CustomEase'

import Viewport from "@/store/modules/Viewport";
import { useAppContext } from "@/services/Composition";
import AppService from "@/services/AppService";

gsap.registerPlugin(CustomEase)

const TITLE_DURATION = 5;
const TITLE_ENTRANCE_DURATION = 3;

const sceneProgress = computed(() => AppService.Scene?.currentScene?.introTitleRef.value);

const sceneId = useAppContext('sceneId');

const root = ref();
const videoRef = ref()
const placeholderRef = ref()
const bgRef = ref()

const hasOutStarted = ref(false);
const hasInStarted = ref(false);
const showBg = ref(false);

const chapterText = computed(() => {
  return `[Chapter 0${sceneId.value}-04]`
})

const sceneIntroSource = computed(() => {
  if (Viewport.isSafari) {
    return {
      src: require(`@/assets/videos/scenes/intro_${sceneId.value}.mp4`),
      type: 'video/mp4; codecs="hvc1"'
    }
  }
  return {
    src: require(`@/assets/videos/scenes/intro_${sceneId.value}.webm`),
    type: 'video/webm'
  }
})

const scenePlaceholder = computed(() => {
  if (Viewport.isSafari) {
    return {
      style: {
        backgroundImage: `url(${require(`@/assets/images/scenes/intro_${sceneId.value}.png`)})`
      }
    }
  }
})

let tl: gsap.core.Timeline;

watch(sceneProgress, (progress, oldProgress) => {
  if (progress > oldProgress && !hasOutStarted.value) {
    enter()
    return
  }
})

const beforeEnter = () => {
  const $ = gsap.utils.selector(root.value);

  // videoRef.value.play()
  videoRef.value.pause();
  gsap.set(placeholderRef, { opacity: 0 });
}

const enter = () => {
  if (hasInStarted.value) return
  hasInStarted.value = true;
  showBg.value = true

  // console.log('[SceneIntro] enter');

  const ease = CustomEase.create("custom", "M0,0 C0.3,0 0.12,0.81 1,1 ");
  const tl = gsap.timeline({
    onComplete: () => {
      hasInStarted.value = false;
    }
  });

  if (Viewport.isSafari) {
    tl.set(videoRef.value, {
      opacity: 1
    }, 0)
    tl.set(placeholderRef.value, {
      opacity: 0
    }, 0)
  }


  // tl.fromTo(bgRef.value, {
  //   opacity: 0
  // }, {
  //   opacity: 1,
  //   duration: 0.5,
  //   ease
  // })

  // Video duration
  tl.fromTo({ currentTime: 0 }, { currentTime: 0 }, {
    currentTime: TITLE_DURATION,
    duration: TITLE_DURATION,
    onStart: () => {
      // console.log('[SceneIntro] play video')
      videoRef.value.play()
    },
  }, 0);
  tl.add(() => {
    // console.log('[SceneIntro] pause video')
    videoRef.value.pause()
  }, TITLE_ENTRANCE_DURATION)

  if (Viewport.isSafari) {
    tl.set(placeholderRef.value, {
      opacity: 1,
      immediateRender: false
    }, TITLE_ENTRANCE_DURATION)
    tl.set(videoRef.value, {
      opacity: 0,
      immediateRender: false
    }, TITLE_ENTRANCE_DURATION + 0.05)
  }

  // TODO HANDLE TIMING ISGOINGTOPORTAIL
  const hasReachedPortail = useAppContext('hasReachedPortail');
  const nextTiming = [5, 12.5, 10.3, 12];
  tl.add(() => {
    hasOutStarted.value = false;
    leave()
  }, hasReachedPortail.value ? TITLE_ENTRANCE_DURATION : nextTiming[sceneId.value - 1])


  // INDEPENDANT ZOOM IN
  gsap.fromTo(
    [videoRef.value, placeholderRef.value],
    {
      scale: 0.9
    },
    {
      scale: 1,
      duration: 4,
      ease
    }
  )
}

const leave = () => {
  if (hasOutStarted.value) return
  hasOutStarted.value = true;

  // console.log('[SceneIntro] leave');

  const ease = CustomEase.create("custom", "M0,0 C0.3,0 0.12,0.81 1,1 ");
  const tl = gsap.timeline({
    onStart: () => {
      // console.log('[SceneIntro] resume video')
      videoRef.value.play()
    },
  });

  tl.add(() => {
    hasInStarted.value = false;
    hasOutStarted.value = false;
    showBg.value = false
  }, 1.2)

  if (Viewport.isSafari) {
    tl.set(videoRef.value, {
      opacity: 1,
      immediateRender: false
    }, 0)
    tl.set(placeholderRef.value, {
      opacity: 0,
      immediateRender: false
    }, 0.05)
  }

}

onMounted(async () => {
  await nextTick()
  showBg.value = false;

  beforeEnter()
});
</script>

<style lang="stylus" scoped>
.scene-intro
  position absolute
  top 0
  left 0
  inset 0
  full()
  display flex
  justify-content center
  align-items center
  flex-direction column
  pointer-events none
  z-index 1
  visibility hidden
  transition visibility .5s

  &.show
    visibility visible

    .scene-intro--bg
      opacity 1

  .scene-intro-inner
    position relative
    display grid
    flex-flow column
    // gap rem(16)
    align-items center
    text-align center
    padding 0
    height 100%
    max-width rem(320)
    // +desktop()
    //   transform scale(0.5)
    +desktop()
      max-width rem(640)

    &__video
      width 100%
      height 100%
      object-fit contain
      pointer-events none
      grid-area 1 / 1 / 2 / 2
      max-height 100vh

    &__placeholder
      // @apply absolute top-0 left-0 w-full h-full;
      width 100%
      height 100%
      background-size contain
      background-position center
      grid-area 1 / 1 / 2 / 2
      opacity 0
      background-repeat no-repeat

  &--bg
    position fixed
    inset 0
    full()
    background rgba(0, 0, 0, 0.15)
    opacity 0
    transition opacity .5s
</style>
