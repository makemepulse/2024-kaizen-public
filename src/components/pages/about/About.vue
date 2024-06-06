<template>
  <div class="about" ref="wrapper">
    <button class="about-close" :class="{ 'hovered': isHovered }" @mouseenter="onCloseEnter" @mouseleave="onCloseLeave" @click="onClose">
      <img src="@/assets/images/close.png" alt="Close" />
    </button>

    <div class="about-bg" />
    <div class="about-overlay-bg" />

    <div class="about-container" ref="container">
      <div class="title-wrapper">
        <video
          ref="$video"
          loop
          muted
          no-controls
          playsInline
        >
          <source v-if="isSafari && isMobile" src="/assets/video/kaizen-title-loop_mobile.mp4" type="video/mp4;codecs=hvc1" />
          <source v-else-if="isSafari" src="/assets/video/kaizen-title-loop.mp4" type="video/mp4;codecs=hvc1" />
          <source v-else-if="isMobile" src="/assets/video/kaizen-title-loop_mobile.webm" type="video/webm" />
          <source v-else src="/assets/video/kaizen-title-loop.webm" type="video/webm" />
        </video>
        <p class="subtitle" v-html="subtitle"></p>
      </div>

      <jitter-animation class="about-text">
        <p class="credits-text">{{ t("credits-global.text") }}</p>
        <div class="credits-content">
          <div class="credits-people">
            <h2>[special thanks to]</h2>
            <div class="credits-grid">
              <template v-for="i in 4" :key="i">
                <span class="credit-name">{{ t(`credits-external.name_${i}`) }}</span>
                <span class="credit-role">{{ t(`credits-external.role_${i}`) }}</span>
              </template>
            </div>
            <h2>[makemepulse]</h2>
            <div class="credits-grid">
              <template v-for="i in 47" :key="i">
                <span class="credit-name">{{ t(`credits.name_${i}`) }}</span>
                <span class="credit-role">{{ t(`credits.role_${i}`) }}</span>
              </template>
            </div>
          </div>
          <img
            class="credits-logo"
            src="@/assets/images/logo.png"
            alt="Makemepulse logo"
          />
        </div>
      </jitter-animation>
    </div>
    <div class="about-grain" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Lenis from '@studio-freight/lenis'
import AppService from '@/services/AppService';
import gsap from 'gsap';
import { useI18n } from 'vue-i18n';
import AudioManager, { AUDIO_ID } from '@/core/audio/AudioManager';
import { CursorState, CursorTheme, setCursor, setCursorHover, setCursorOptions } from '@/store/modules/Cursor';
import { getKaizenSubtitle } from "@/utils/Text";
import Viewport from "@/store/modules/Viewport";

const { t } = useI18n();

const $video = ref();
const lenis = ref<Lenis>();
const wrapper = ref<HTMLElement>();
const container = ref<HTMLElement>();

const subtitle = ref('');
const isHovered = ref(false);

const isSafari = computed(() => Viewport.isSafari);
const isMobile = computed(() => Viewport.isMobile);

const VOICE_VOLUME = 0.5;
const AMBIENT_VOLUME = 0.75;

const onEnter = () => {
  AudioManager.fadeIn(AUDIO_ID.AMBIENT_CONCLUSION, AMBIENT_VOLUME);

  const tl = gsap.timeline({ delay: 0.5 });
  const $ = gsap.utils.selector(wrapper.value);

  if (Viewport.isSafari) {
    $video.value?.play();
  }

  tl
    .from(
      container.value,
      {
        // scale: 2,
        yPercent: 5,
        opacity: 0,
        duration: 1.5,
        clearProps: "all",
        ease: "quart.out"
      },
      "start+=0.5"
    )
    .call(() => {
      if (!Viewport.isSafari) $video.value?.play();
      AudioManager.fadeIn(AUDIO_ID.CONCLUSION_MMP, VOICE_VOLUME);
    }, [], "<+=0.5")
    .from(
      $(".about-bg"),
      {
        scale: 1.1,
        opacity: 0,
        duration: 1,
        clearProps: "all",
        ease: "quart.out"
      },
      "start"
    )
}

const onClose = () => {
  // AudioManager.fadeOut(AUDIO_ID.AMBIENT_CONCLUSION);
  AudioManager.fadeOut(AUDIO_ID.CONCLUSION_MMP).then(() => AudioManager.stop(AUDIO_ID.CONCLUSION_MMP));
  AudioManager.playUI("kaizen_cta_alt");

  const tl = gsap.timeline({
    // onStart: () => {
    //   lenis.value?.destroy()
    //   gsap.ticker.remove((time) => lenis.value?.raf(time))
    // },
    onComplete: () => AppService.state.send("PREV")
  });
  const $ = gsap.utils.selector(wrapper.value)

  tl
    .to(
      container.value,
      {
        // scale: 2,
        yPercent: 5,
        opacity: 0,
        duration: 1,
        ease: "quart.out"
      },
      "start"
    )
    .to(
      $(".about-bg"),
      {
        scale: 1.1,
        opacity: 0,
        duration: 1,
        ease: "quart.out"
      },
      "start+=0.25"
    )
}

onMounted(async () => {
  subtitle.value = await getKaizenSubtitle();

  onEnter()

  lenis.value = new Lenis()
  gsap.ticker.add((time) => {
    lenis.value.raf(time * 1000)
  })

  setCursor(CursorState.DEFAULT, { theme: CursorTheme.LIGHT })
})

const onCloseEnter = () => {
  AudioManager.playUI("kaizen_hover");
  const closeEnter = gsap.timeline()
  closeEnter
    .to(".close-path:first-child", {
      clipPath: "polygon(-40px 0, 50% 0, 100% 100%, 50% 100%)",
      duration: 1,
      ease: "quart.out",
      clearProps: "all"
    }, 0)
    .to(".close-path:last-child", {
      clipPath: "polygon(50% 0, 130% 0%, 50% 100%, -50px 100%)",
      duration: 1,
      ease: "quart.out",
      clearProps: "all"
    }, 0.1)
    .to(".app-cursor", { opacity: 0.8, duration: 0.25, ease: "quart.out" }, 0)

  setCursorHover(true);
  isHovered.value = true;
}

const onCloseLeave = () => {
  setCursorHover(false);
  isHovered.value = false;

  gsap
    .timeline()
    .to(".app-cursor", { opacity: 1, duration: 0.25, ease: "quart.out" }, 0)
}

onBeforeUnmount(() => {
  lenis.value?.destroy()
  gsap.ticker.remove((time) => lenis.value?.raf(time))
  onCloseLeave();
})
</script>

<style lang="stylus" scoped>
.about
  position relative
  inset 0
  background var(--cream)
  color var(--dark-yellow)

  &-container
    position relative
    display flex
    flex-direction column
    align-items center
    padding 0 0 25vh 0
    z-index 2

    .sprite-canvas
      width 95%

  &-bg
    position fixed
    full()
    inset 0
    background center / cover url("@/assets/images/background-brush.webp") no-repeat
    z-index 1

  &-overlay-bg
    position absolute
    full()
    inset 0
    background linear-gradient(to bottom, transparent, var(--dark-blue) 100vh, var(--dark-blue) 85%, transparent)
    opacity 0.1
    z-index 1

  &-grain
    position fixed
    full()
    inset 0
    background url("@/assets/images/grain.webp") repeat
    opacity 0.5
    mix-blend-mode overlay
    z-index 2
    pointer-events none

  &-close
    position fixed
    top rem(20)
    left rem(20)
    z-index 10
    transition-property opacity, transform
    transition 0.25s ease-out

    img
      width rem(32)
      height @width

    &.hovered, &:focus
      opacity 0.7
      transform scale(1.2)

  &-text
    font-size rem(20)
    line-height 1.5
    text-align center
    padding rem(72) rem(20) 0 rem(20)

    & + .about-text
      margin-top 0

    .credits-text
      margin-bottom rem(120)
      width 100%
      max-width rem(600)
      margin-left auto
      margin-right auto

    .credits-content
      display flex
      flex-direction column
      align-items center
      gap rem(128)

    .credits-people
      h2
        margin-bottom rem(20)
        +desktop()
          margin-bottom rem(0)

    .credits-grid

      &:first-of-type
        margin-bottom rem(40)

      display grid
      grid-template-columns repeat(1, 1fr)
      column-gap rem(20)

      +desktop()
        grid-template-columns repeat(2, 1fr)

      .credit-name
        +desktop()
          text-align right
      .credit-role
        margin-bottom rem(20)
        +desktop()
          margin-bottom rem(0)
          text-align left

    .credits-logo
      width rem(45)

.title-wrapper
  position relative
  width 100vw
  height auto
  margin-bottom -12vw
  margin-top calc(50 * var(--vh, 1vh) - (900 / 1440 * 50vw))

  @media (min-aspect-ratio: 1440 / 900)
    height calc(100 * var(--vh, 1vh))
    width auto
    margin-top 0
    margin-bottom calc(-20 * var(--vh, 1vh))

  video
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
    font-size rem(16)
    -webkit-text-stroke-width rem(0.5)
    -webkit-text-stroke-color var(--dark-yellow)
    +desktop()
      top 68%
      font-size rem(24)
</style>

<style lang="stylus">
// Lenis
html.lenis, html.lenis body {
  height: auto;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-scrolling iframe {
  pointer-events: none;
}

body.about {
  background: var(--cream);

  & main {
    height: auto;
  }
}
</style>