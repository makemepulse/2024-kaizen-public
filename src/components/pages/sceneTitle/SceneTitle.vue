<template>
  <div class="scene-title bg" :class="{ 'show': showBg }"  ref="root">
    <div class="scene-title--bg" ref="bgRef" />
    <div class="scene-title-inner">
      <video :key="sceneId" ref="videoRef" className="scene-title-inner__video" muted autoPlay="false" preload="auto"
        playsInline>
        <source v-bind="sceneTitleSource" />
      </video>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import gsap from 'gsap'
import CustomEase from 'gsap/CustomEase'

import { useAppContext } from "@/services/Composition";
import AppService from "@/services/AppService";
import Viewport from "@/store/modules/Viewport";

gsap.registerPlugin(CustomEase)

const TITLE_DURATION = 5;

const sceneId = useAppContext('sceneId');

const root = ref();
const videoRef = ref()
const bgRef = ref()

const hasOutStarted = ref(false);
const hasInStarted = ref(false);
const showBg = ref(false);

const sceneTitleSource = computed(() => {
  if (Viewport.isSafari) {
    return {
      src: require(`@/assets/videos/scenes/title_${sceneId.value}.mp4`),
      type: 'video/mp4; codecs="hvc1"'
    }
  }
  return {
    src: require(`@/assets/videos/scenes/title_${sceneId.value}.webm`),
    type: 'video/webm'
  }
})

let tl: gsap.core.Timeline;

watch(AppService.Scene?.showTitle, (showTitle, oldShowTitle) => {
  if (showTitle && !oldShowTitle && !hasInStarted.value) {
    enter()
    return
  }
})

const beforeEnter = () => {
  const $ = gsap.utils.selector(root.value);

  // videoRef.value.play()
  videoRef.value.pause()

  gsap.set(videoRef.value, {
    opacity: 0
  })
}

const enter = () => {
  if (hasInStarted.value) return
  hasInStarted.value = true;
  showBg.value = true

  if (AppService.Scene) {
    // console.log('[SceneTitle] Enter Block hold and release', { blockHold: AppService.Scene.blockHold, blockRelease: AppService.Scene.blockRelease })
    AppService.Scene.blockHold = true;
    AppService.Scene.blockRelease = true;
    AppService.Scene.blockHoldDown = true;
    AppService.Scene.isTitlePlaying.value = true;
  }

  const ease = CustomEase.create("custom", "M0,0 C0.3,0 0.12,0.81 1,1 ");
  const tl = gsap.timeline();

  tl.set(videoRef.value, {
    opacity: 1
  })

  // Video duration
  tl.fromTo({ currentTime: 0 }, { currentTime: 0 }, {
    currentTime: TITLE_DURATION,
    duration: TITLE_DURATION,
    onStart: () => {
      videoRef.value.play()
    },
  }, 0);

  // TIMING FOR EACH SCENE
  const nextTiming = ['+=4', '+=3', '+=3.5', '+=3.95']
  tl.add(() => {
    hasInStarted.value = false;
    hasOutStarted.value = false;
    leave();

  }, nextTiming[sceneId.value - 1])

}

const leave = () => {
  if (hasOutStarted.value) return
  hasOutStarted.value = true;

  const ease = CustomEase.create("custom", "M0,0 C0.3,0 0.12,0.81 1,1 ");
  const tl = gsap.timeline({
    onComplete: () => {
      hasInStarted.value = false;
      hasOutStarted.value = false;
      showBg.value = false
    }
  });


  tl.to(videoRef.value, {
    opacity: 0,
    duration: 0.5,
    ease
  }, 0);
  tl.add(() => {
    if (AppService.Scene) {
      // console.log('[SceneTitle] Leave Allow hold and release', { blockHold: AppService.Scene.blockHold, blockRelease: AppService.Scene.blockRelease })
      AppService.Scene.blockHold = false;
      AppService.Scene.blockRelease = false;
      AppService.Scene.blockHoldDown = false;
      AppService.Scene.isTitlePlaying.value = false;
    }
  }, "+=0.5")

}

onMounted(async () => {
  await nextTick()
  showBg.value = false;

  beforeEnter()
});
</script>

<style lang="stylus" scoped>
.scene-title
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

    .scene-title--bg
      opacity 1

  .scene-title-inner
    position relative
    display flex
    flex-flow column
    // gap rem(16)
    align-items center
    text-align center
    padding 0 rem(10)
    height 100%
    +desktop()
      padding 0 rem(20)
      // gap rem(40)

    &__video
      width 100%
      height 100%
      object-fit cover
      pointer-events none
      +mobile()
        object-fit contain


    &__chapter
      position: absolute;
      top: calc((260 / 900 * 100 * var(--vh)));

      // font-weight 400
      text-align center
      // -webkit-text-stroke-width: 1px;
      // -webkit-text-stroke-color: var(--cream);

  &--bg
    position fixed
    inset 0
    full()
    background rgba(0, 0, 0, 0.15)
    opacity 0
    transition opacity .5s
</style>
