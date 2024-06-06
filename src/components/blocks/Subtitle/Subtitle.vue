<template>
  <div class="subtitle" :class="[
    `subtitle--${position}`,
    `theme--${theme}`,
    { 'theme--white': isWhite },
    { started: canStart },
    { big: isBig }
  ]" ref="subtitle">
    <Transition name="fade">
      <div v-if="currentSubtitle">
        <jitter-animation>
          <p :class="[
            'subtitle-p fake-bold',
            isBig ? 'body-big' : 'body-s',
            { alternativeAnim: decorAlternativeAnim }
          ]" />
        </jitter-animation>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { Audio } from '@/store/modules/Audio';
import { getSubtitleContent, setBlockingNext } from "@/store/modules/Subtitles";

import gsap from "gsap/all";
import SplitText from 'gsap/SplitText';

const emit = defineEmits(['completed']);
const subtitles = ref([]) as any;
const currentIndex = ref(0);
const started = ref(false);
const subtitle = ref<HTMLElement>();
let timeout: number;

type Props = {
  position?: "top" | "bottom" | "center",
  theme?: "dark-blue" | "intro" | "portail" | "scene1" | "scene2" | "scene3" | "scene4" | "outro" | "outro-text"
  canStart?: boolean,
  isBig?: boolean,
  srtUrl?: string,
  slowFade?: boolean,
  decorAlternativeAnim?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  position: "bottom",
  theme: "scene1",
  canStart: true,
})

const isWhite = computed(() => props.theme === "scene1" || props.theme === "scene2" || props.theme === "scene3" || props.theme === "scene4" || props.theme === "outro" || props.theme === "outro-text");

const srtUrl = computed(() => props.srtUrl || Audio.url);

onMounted(async() => {
  // @TODO: update with the correct path
  const url = srtUrl.value;
  const data = await getSubtitleContent(url);

  if (!data) return;

  subtitles.value = data;

  if (props.canStart) {
    startSubtitles();
  }

  setBlockingNext(true);
})

watch(() => props.canStart, (value) => {
  if(value) {
    startSubtitles();
  }
})

onUnmounted(() => {
  onComplete();
  clearTimeout(timeout);
});

const currentSubtitle = computed(() => subtitles.value[currentIndex.value]);
const FADE_IN_DURATION = 0.001;
const FADE_OUT_DURATION = 0.1;
const LONG_FADE_OUT_DURATION = 1;
let splitTexts: SplitText[] = [];
let timeline: any | null = null;

const killTimelines = () => {
  timeline?.revert().kill();

  splitTexts.reverse().forEach(split => {
    split.revert();
  });

  splitTexts = [];
  timeline = null;
};

const fadeIn = async(element: HTMLElement, duration: number) => {
  killTimelines();
  gsap.registerPlugin(SplitText);

  await nextTick();
  const splitElem = element.querySelector('p') as HTMLElement;
  splitElem.innerHTML = currentSubtitle.value.text;
  const split = new SplitText(splitElem, { type: 'words', wordsClass: 'Word', linesClass: 'Line Line--++' });
  splitTexts.push(split);

  const splitArray = [...splitElem.querySelectorAll('.Word, strong, .svg-icon, s, u, img')];
  // const eachDuration = duration / split.words.length;
  const eachDuration = (duration / split.words.length) / 2 > 0.15 && !props.slowFade
    ? 0.15
    : (duration / split.words.length) / 2;

  timeline = gsap.timeline();
  timeline
    .from(splitArray, {
      opacity: 0,
      stagger: {
        each: eachDuration,
        onStart() {
          const target = (this as any).targets()[0] as HTMLElement;
          const random = Math.random();

          target.classList.add('animated');
          (target.tagName === "S" && target.textContent.length >= 10) && target.classList.add('animated--long');
          (target.tagName === "U" && random > 0.5) && target.classList.add('animated--random');
          (target.tagName === "strong") && target.classList.add('animated');
          // (target.classList.contains("svg-icon")) && target.classList.add("animated--random");
        },
      },
      duration: eachDuration * splitArray.length,
      ease: 'quart.out',
    }, 'start')
    .fromTo(element,
      { opacity: 0 },
      { opacity: 1, duration: FADE_IN_DURATION, ease: 'quart.out', clearProps: 'all' },
      'start'
    );
};

const fadeOut = async (element: HTMLElement, last: boolean, onComplete: () => void) => {
  gsap.to(element, {
    opacity: 0,
    delay: last ? 0.25 : 0,
    duration: last || props.slowFade
      ? LONG_FADE_OUT_DURATION
      : FADE_OUT_DURATION,
    ease: 'quart.out',
    onComplete
  });
};

const startSubtitles = () => {
  if (started.value) return;


  started.value = true;
  const { start } = subtitles.value[currentIndex.value];

  timeout = setTimeout(() => {
    updateSubtitle();
  }, start * 1000);
}

const updateSubtitle = () => {
  if (currentIndex.value < subtitles.value.length) {
    const subtitleData = subtitles.value[currentIndex.value];
    const duration = (subtitleData.end - subtitleData.start) * 1000; // Duration the subtitle is shown
    const nextDelay = currentIndex.value < subtitles.value.length - 1
                      ? (subtitles.value[currentIndex.value + 1].start - subtitleData.end) * 1000
                      : 0; // Time until next subtitle starts

    fadeIn(subtitle.value as HTMLElement, duration / 1000);
    clearTimeout(timeout);

    // Wait for the current subtitle to display for its duration, then fade out
    timeout = setTimeout(() => {
      fadeOut(subtitle.value as HTMLElement, currentIndex.value === subtitles.value.length - 1, () => {
        currentIndex.value++;
        if (currentIndex.value < subtitles.value.length) {
          // Wait for the time between the end of this subtitle and the start of the next
          timeout = setTimeout(updateSubtitle, nextDelay);
        } else {
          onComplete(); // If no more subtitles, complete the process
        }
      });
    }, duration);
  } else {
    onComplete();
  }
};

const onComplete = () => {
  emit('completed');
  setBlockingNext(false);
}
</script>

<style lang="stylus" scoped>
.subtitle
  position absolute
  left 50%
  transform translateX(-50%)
  max-width rem(300)
  text-align center
  color var(--dark-blue)
  pointer-events none
  user-select none
  opacity 0
  z-index 10
  &.big
    max-width rem(700)
  &.started
    opacity 1

  // Themes
  &.theme--dark-blue
    .fake-bold
      -webkit-text-stroke-color var(--dark-blue)
  &.theme--intro
    .fake-bold
      color var(--cream)
    :deep(strong svg)
      color #204172
    :deep(.subtitle-p)
      s
        &.animated--long::before
          background center / 90% 10px no-repeat url('~@/assets/images/subtitles/brush/s-1-white.png')
        &::before
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/s-2-white.png')
      u
        &.animated::before
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-2-white.png')
        &::before
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-1-white.png')
  &.theme--portail
    :deep(strong svg)
      color var(--yellow)
  &.theme--scene1
    :deep(strong svg)
      color #bd8ac6
      opacity 0.5
  &.theme--scene2
    :deep(strong svg)
      color #43a258
      opacity 0.6
  &.theme--scene3
    :deep(strong svg)
      color #3b9299
      opacity 0.5
  &.theme--scene4
    :deep(strong svg)
      color #f272ae
      opacity 0.5
  &.theme--outro
    :deep(strong svg)
      color #256097
      opacity 0.5
  &.theme--outro-text
    :deep(strong svg)
      color #C8A4AF
      opacity 0.3

  &.theme--white
    color var(--cream)

    :deep(.subtitle-p)
      s
        &.animated--long::before
          background center / 90% 10px no-repeat url('~@/assets/images/subtitles/brush/s-1-white.png')
        &::before
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/s-2-white.png')
      u
        &.animated::before
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-2-white.png')
        &::before
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-1-white.png')

  &--bottom
    bottom rem(48)
    +mobile()
      bottom rem(24)

  &--top
    top rem(96)

  &--center
    top 50%
    transform translate(-50%, -50%)
    max-width rem(450)

  :deep(.subtitle-p.alternativeAnim)
    s
      &::before
        opacity 0
        transition opacity .4s ease-out .4s
      &.animated::before
        opacity 1
    u
      &::before
        opacity 0
        transform scaleX(1)
        transition opacity .4s ease-out .4s
      &.animated::before
        opacity 1
    strong
      svg
        opacity 0
        transition opacity .4s ease-out .4s
      &.animated svg
        opacity 0.5

  :deep(.subtitle-p)

    img
      height rem(18)
      width auto

    s
      position relative
      &.animated--long::before
        background center / 90% 10px no-repeat url('~@/assets/images/subtitles/brush/s-1.png')
        .theme--white &
          background center / 90% 10px no-repeat url('~@/assets/images/subtitles/brush/s-1-white.png')
      &::before
        content ''
        position absolute
        top -25%
        left -10%
        width 120%
        height 150%
        background center / contain no-repeat url('~@/assets/images/subtitles/brush/s-2.png')
        z-index 1
        .theme--white &
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/s-2-white.png')

    u
      position relative
      &.animated::before
        transform scaleX(1)
      &.animated--random::before
        background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-2.png')
        .theme--white &
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-2-white.png')
      &::before
        content ''
        position absolute
        top 80%
        left 0
        width 100%
        height 0.3em
        background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-1.png')
        transform scaleX(0)
        transform-origin left
        transition transform .15s ease-out .2s
        .theme--white &
          background center / contain no-repeat url('~@/assets/images/subtitles/brush/u-1-white.png')

    strong
      position relative
      font-weight 300
      // animation smallRotate steps(2) 1s infinite forwards
      svg
        position absolute
        top: 15%;
        left: -5%;
        width: 100%;
        height: 70%;
        z-index -1
        opacity 0
        transition opacity .4s ease-out .35s
        mix-blend-mode overlay
        color var(--light)
      &.animated svg
        opacity 0.5

@keyframes smallRotate {
  0% {
    transform rotate(-4deg)
  }
  100% {
    transform rotate(4deg)
  }
}
</style>