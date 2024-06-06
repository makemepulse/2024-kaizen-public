<template>
  <div ref="$root" class="loader" :class="{ hasBackground: !introReady }">
    <Transition name="fade">
      <button
        v-if="isReadyToSkip"
        @click="onNext"
        @mouseenter="() => isIntroVoiceOver && setCursorHover(true)"
        @mouseleave="() => isIntroVoiceOver && setCursorHover(false)"
        class="skipBtn focusable body-s"
      >
        <jitter-animation> {{ t("global.cta_skip") }} </jitter-animation>
      </button>
    </Transition>

    <Transition name="medium-fade" mode="out-in" appear>
      <div
        v-if="isLoader && !isShowHeadPhones && isLoaderState"
        class="subtitle-mmp"
      >
        <jitter-animation>
          <img src="@/assets/images/logogram.webp" alt="Makemepulse logo" />
          <h3 v-html="t('global.loader').replace('\n', '<br/>')" />
        </jitter-animation>
      </div>
      <div v-else-if="isShowHeadPhones" class="headphones-hint">
        <jitter-animation>
          <img src="@/assets/images/headphones.webp" alt="Headphones" />
          <h3>
            {{ t("global.headphones") }}
          </h3>
        </jitter-animation>
      </div>
    </Transition>

    <Transition name="fade">
      <Subtitle
        v-if="isSubtitleShowed"
        position="center"
        theme="intro"
        decor-alternative-anim
        @completed="onSubtitleCompleted"
      />
    </Transition>

<Transition name="fade">
  <div v-if="isWaitLoading" class="subloading">
    <jitter-animation>Loading...</jitter-animation>
  </div>
</Transition>

    <div class="bottom">
      <jitter-animation>
        <Transition name="fade">
          <p v-if="showLoadingPerc" class="loading">
            {{ Math.round(loadingProgress * 100) }}%
          </p>
          <p class="cta" v-else-if="!isShowHeadPhones && isLoaderState">
            {{ t("global.cta_start") }}
          </p>
        </Transition>
      </jitter-animation>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useAppState, useAppContext } from "@/services/Composition";
import WebglLoading from "@/store/modules/WebglLoading";
import Cursor, {
  setCursor,
  setCursorOptions,
  setCursorHover,
  resetCursor,
  CursorState,
  CursorTheme,
} from "@/store/modules/Cursor";
import { Audio, setSubtitleShowed } from "@/store/modules/Audio";

const { t } = useI18n();
const { state } = useAppState();

let tl: any;

const introLoaded = useAppContext("introLoaded");
const introSkipped = useAppContext("introSkipped");
const showTitle = useAppContext("showTitle");
const introReady = useAppContext("introReady");
const progressiveloaded = useAppContext("progressiveloaded");

const loadingProgress = computed(() =>
  WebglLoading.toLoad === 0 ? 0 : WebglLoading.loaded / WebglLoading.toLoad
);

const isSubtitleShowed = computed(() => Audio.isSubtitleShowed);
const onSubtitleCompleted = () => {
  setSubtitleShowed(false);
};

const $root = ref();
const canStart = ref(false);
const startAnimation = ref(false);
const isIntroVoiceOver = computed(() =>
  state.value.matches("intro.voice_over")
);
const isLoader = computed(() => !isIntroVoiceOver.value);
const isReady = computed(() => state.value.matches("intro.loader.ready"));
const isVoiceOver = computed(() => state.value.matches("intro.voice_over"));
const isLoaderState = computed(() => state.value.matches("intro.loader"));
const isWaitLoading = computed(() => state.value.matches("intro.waitloading"));
const isShowHeadPhones = computed(() =>
  state.value.matches("intro.loader.showHeadPhones")
);
const canBeReady = ref(true);
const showLoadingPerc = ref(true);

const isReadyToSkip = ref(false);
let isReadyToSkipTimeout: number = null;

const showSkipBtn = computed(() => {
  return isIntroVoiceOver.value && !introSkipped.value && !showTitle.value;
});

// DELAY SKIP BUTTON ENTRANCE TO BE SURE THAT THE VOICE IS STARTED OTHERWISE THE VOICE MAY START AFTER THE SKIP ACTION
watch(showSkipBtn, (value) => {
  clearTimeout(isReadyToSkipTimeout);
  if (value) {
    isReadyToSkipTimeout = setTimeout(() => {
      isReadyToSkip.value = true;
    }, 1500);
  } else {
    isReadyToSkip.value = false;
  }
});

watch(
  loadingProgress,
  (value) => {
    if (Math.round(value * 100) === 100) {
      setTimeout(() => {
        showLoadingPerc.value = false;
      }, 1);
    } else {
      showLoadingPerc.value = true;
    }
  },
  { immediate: true }
);

const setCursorDefault = () => {
  if (Cursor.state === CursorState.DEFAULT) return;
  setCursor(CursorState.DEFAULT);
};

onMounted(async () => {
  setCursorOptions({ theme: CursorTheme.LIGHT });
});

onUnmounted(() => {
  tl?.kill();
});

onBeforeUnmount(() => {
  resetCursor(true);
});

watch(canBeReady, () => {
  if (!canBeReady.value) return;
  hideLoading();
});

watch(showLoadingPerc, () => {
  if (showLoadingPerc.value) return;
  hideLoading();
});

const hideLoading = async () => {
  if (!canBeReady.value || showLoadingPerc.value) return;
  const AppService = (await import("@/services/AppService")).default;
  AppService.state.send("NEXT");
};

const animationOut = async () => {
  const gsapAll = await import("gsap/all");
  const gsap = gsapAll.gsap;
  const $ = gsap.utils.selector($root.value);
  const tlOut = gsap.timeline();

  tlOut.to(
    [$(".cta")],
    {
      opacity: 0,
      duration: 0.5,
    },
    0
  );
};

watch(isIntroVoiceOver, (value) => {
  if (!value) return;
  canStart.value = true;
  animationOut();
});

const onNext = async () => {
  const AudioManager = (await import("@/core/audio/AudioManager")).default;
  AudioManager.playUI("kaizen_cta");
  const module = await import("@/services/AppService");
  module.default.state.send("SKIP_INTRO");
  setSubtitleShowed(false);
  resetCursor();
};
</script>

<style lang="stylus" scoped>
.loader
  position relative
  inset 0
  full()
  z-index 1
  transition 1.5s background-color ease-in-out
  &.hasBackground
    background-color $darker-blue
    // background-color #FF0000
  .subloading
    background rgba(0, 0, 0, 0.3)
    display flex
    align-items center
    justify-content center
    full()

  .skipBtn
    position absolute
    bottom rem(20)
    right rem(20)
    color $cream
    z-index 2
    &::before
      content: ''
      width rem(400)
      height rem(400)

      position absolute
      top 50%
      left 50%

      margin-top @height * -0.5
      margin-left @width * -0.5

      border-radius 50%
      // background-color rgba(255, 255,255, 0.5)

  .bottom :deep()
    .jitter-animation
      position absolute
      top 0
      left 0
      full()

    .loading
      position absolute
      bottom rem(48)
      left 50%
      transform translateX(-50%)
      font-size rem(20)
      line-height 1
      user-select none
      color $cream

    .cta
      position absolute
      bottom rem(48)
      left 50%
      transform translateX(-50%)
      font-size rem(20)
      line-height 1
      user-select none
      color $cream
      &.show
        opacity 1

  .headphones-hint, .subtitle-mmp
    position absolute
    top 50%
    left 50%
    transform translate(-50%, -50%)
    text-align center
    font-size rem(20)

    > div
      display flex
      flex-direction column
      justify-content center
      align-items center
      gap rem(24)

  .headphones-hint
    h3
      max-width rem(250)
    img
      width rem(40)
      height auto

  .subtitle-mmp
    img
      width rem(264)
      height auto
</style>
