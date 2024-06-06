<template>
  <div class="title-page" ref="root">
    <div class="title-wrapper">
      <video ref="$video" no-controls muted playsInline preload="auto">
        <source
          v-if="isSafari && isMobile"
          src="/assets/video/kaizen-title-screen_mobile.mp4"
          type="video/mp4;codecs=hvc1"
        />
        <source
          v-else-if="isSafari"
          src="/assets/video/kaizen-title-screen.mp4"
          type="video/mp4;codecs=hvc1"
        />
        <source
          v-else-if="isMobile"
          src="/assets/video/kaizen-title-screen_mobile.webm"
          type="video/webm"
        />
        <source
          v-else
          src="/assets/video/kaizen-title-screen.webm"
          type="video/webm"
        />
      </video>
      <p class="subtitle" v-html="subtitle"></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";

import Viewport from "@/store/modules/Viewport";
import { getKaizenSubtitle } from "@/utils/Text";

const props = defineProps({
  showTitle: {
    type: Boolean,
    default: false,
  },
});

const subtitle = ref("");
const root = ref();
const $video = ref();

const isSafari = computed(() => Viewport.isSafari);
const isMobile = computed(() => Viewport.isMobile);

const introAnimation = () => {
  const $ = gsap.utils.selector(root.value);

  const tl = gsap.timeline({
    onStart: () => {
      $video.value.play();
    },
  });
  tl.fromTo(
    $video.value,
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 4,
      ease: "quart.in",
    }
  );
  tl.fromTo(
    $(".subtitle"),
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 2,
      ease: "quart.in",
    },
    3
  );
  tl.to(
    root.value,
    {
      opacity: 0,
      duration: 4,
      ease: "quart.out",
    },
    9
  );
};

onMounted(async () => {
  console.log("mount title")
  subtitle.value = await getKaizenSubtitle();
  if (props.showTitle) play();
});

watch(
  () => props.showTitle,
  (v) => {
    if (props.showTitle) play();
  }
);

async function play() {
  introAnimation();
}
</script>

<style scoped lang="stylus">
.title-page
  position fixed
  top 0
  left 0
  right 0
  bottom 0
  display flex
  align-items center
  justify-content center
  height calc(100 * var(--vh, 1vh))
  width 100vw
  pointer-events none

  .title-wrapper
    position relative
    width 100vw
    height auto

    @media (min-aspect-ratio: 1440 / 900)
      height calc(100 * var(--vh, 1vh))
      width auto

    video
      opacity 0
      width 100%
      height 100%
      object-fit contain
      pointer-events none

.subtitle
  position absolute
  left 50%
  top 70%
  transform translateX(-50%)
  z-index 2
  color $dark-yellow
  text-align center
  opacity 0
  font-size rem(16)
  -webkit-text-stroke-width rem(0.5)
  -webkit-text-stroke-color var(--dark-yellow)
  +desktop()
    top 68%
    font-size rem(24)
</style>
