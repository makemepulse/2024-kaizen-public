<template>
  <main v-if="fontLoaded">
    <Transition name="fade">
      <div class="background-subtitles" v-if="isIntroVoice || isScene || isOrigami || isConclusion" />
    </Transition>

    <asyncIntro v-if="!isMounted || isLoader || isIntro" />

    <asyncGLView v-if="glappCreated" />

    <Transition name="fade">
      <asyncSoundBtn v-if="glappCreated && (!isIntro || isIntroVoice) && !isLoader" />
    </Transition>

    <Transition name="fade">
      <asyncTitleScreen v-if="isIntro" :show-title="showTitle" />
    </Transition>

    <asyncSceneLayout v-if="glappCreated && (!isIntro || isIntroVoice) && !isLoader || isScene" :show="isScene" :key="sceneId" />

    <!-- <asyncBackgroundOverlay v-if="isOrigami" /> -->

    <Transition name="fade">
      <asyncOutroHeader v-if="isOutroHeader" />
    </Transition>
    <Transition name="fade">
      <asyncPortail v-if="isPortail" />
    </Transition>
    <Transition name="fade">
      <asyncOutroFooter v-if="isOutroFooter" />
    </Transition>

    <Transition name="fade">
      <asyncOutroduction v-if="isOutroduction" />
    </Transition>

    <Transition name="fade">
      <asyncConclusion v-if="isConclusion" />
    </Transition>

    <Transition name="fade">
      <asyncAbout v-if="isAbout" />
    </Transition>

    <Transition name="fade">
      <asyncRotateScreen v-if="glappCreated && (!isIntro || isIntroVoice) && !isLoader" />
    </Transition>

    <!-- <DebugFrontEnd /> -->

    <asyncAppCursor v-if="
      glappCreated && (!isIntro || isIntroVoice) && !isLoader
    " />
  </main>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
// import GLView from "./components/GLView.vue";
// import Viewport from "./store/modules/Viewport";
// import AppService from "./services/AppService";
import { useAppContext, useAppState } from "./services/Composition";
// import OrigamiHUD from "./components/pages/origami/OrigamiHUD.vue";
// import Viewport from "@/store/modules/Viewport";
// import isLowPowerMode from "./utils/PowerMode";
// import BackgroundOverlay from "./components/blocks/BackgroundOverlay/BackgroundOverlay.vue";
// import TitleScreen from "./components/pages/titleScreen/TitleScreen.vue";
// import SceneLayout from "./components/pages/scenes/SceneLayout.vue";
// import Intro from "@/components/pages/intro/Intro.vue";
// import { Intro as IntroStore } from "@/store/modules/Intro";
// import Outroduction from "./components/pages/outroduction/Outroduction.vue";
// import Conclusion from "./components/pages/conclusion/Conclusion.vue";
// import OutroHeader from "./components/pages/outroduction/OutroHeader.vue";
// import OutroPortail from "@/components/pages/portail/Portail.vue";
// import OutroFooter from "@/components/pages/outroduction/OutroFooter.vue";
// import About from "./components/pages/about/About.vue";
// import Delay from "./core/Delay";
// import AppCursor from "./components/blocks/Cursor/AppCursor.vue";
// import DebugFrontEnd from "./components/debug/FrontEnd.vue";

const { state } = useAppState();
const sceneId = useAppContext("sceneId");
const isHolding = useAppContext("isHolding");
const showTitle = useAppContext("showTitle");

const asyncOutroHeader = defineAsyncComponent(
  () => import("./components/pages/outroduction/OutroHeader.vue")
);

const asyncOutroFooter = defineAsyncComponent(
  () => import("./components/pages/outroduction/OutroFooter.vue")
);

const asyncAppCursor = defineAsyncComponent(
  () => import("./components/blocks/Cursor/AppCursor.vue")
);

const asyncAbout = defineAsyncComponent(
  () => import("./components/pages/about/About.vue")
);

const asyncOutroduction = defineAsyncComponent(
  () => import("./components/pages/outroduction/Outroduction.vue")
);

const asyncSoundBtn = defineAsyncComponent(
  () => import("./components/blocks/Sound/SoundBtn.vue")
);

const asyncTitleScreen = defineAsyncComponent(
  () => import("./components/pages/titleScreen/TitleScreen.vue")
);

const asyncConclusion = defineAsyncComponent(
  () => import("./components/pages/conclusion/Conclusion.vue")
);

const asyncPortail = defineAsyncComponent(
  () => import("./components/pages/portail/Portail.vue")
);

const asyncGLView = defineAsyncComponent(
  () => import("./components/GLView.vue")
);

const asyncIntro = defineAsyncComponent(
  () => import("./components/pages/intro/Intro.vue")
);

const asyncSceneLayout = defineAsyncComponent(
  () => import("./components/pages/scenes/SceneLayout.vue")
);

const asyncRotateScreen = defineAsyncComponent(
  () => import("./components/pages/rotateScreen/RotateScreen.vue")
);

// const asyncBackgroundOverlay = defineAsyncComponent(
//   () => import("./components/blocks/BackgroundOverlay/BackgroundOverlay.vue")
// );

const isLoading = computed(
  () =>
    state.value.context.loaded === false &&
    process.env.VUE_APP_COMING_SOON !== "true"
);
const isOrigami = computed(() => state.value.matches("origami"));
const isLoader = computed(() => state.value.matches("initializing"));
const isIntro = computed(() => state.value.matches("intro"));
const isIntroVoice = computed(() => state.value.matches("intro.voice_over"));
const isIntroVoiceOver = computed(() =>
  state.value.matches("intro.voice_over")
);
const isScene = computed(() => state.value.matches("scene"));
const isScene1 = computed(
  () => state.value.matches("scene") && state.value.context.sceneId === 1
);
const isScene2 = computed(
  () => state.value.matches("scene") && state.value.context.sceneId === 2
);
const isScene3 = computed(
  () => state.value.matches("scene") && state.value.context.sceneId === 3
);
const isScene4 = computed(
  () => state.value.matches("scene") && state.value.context.sceneId === 4
);
const isOutroduction = computed(() => state.value.matches("outroduction"));
const isConclusion = computed(() => state.value.matches("conclusion"));
const isLeavingPortail = useAppContext("isLeavingPortail");
const isPortail = computed(
  () => state.value.matches("portail") && !isLeavingPortail.value
);
const isAbout = computed(() => state.value.matches("about"));
const isOutroHeader = computed(() => isPortail.value || isAbout.value);
const isOutroFooter = computed(() => isAbout.value);

const hideSoundBtn = computed(
  () =>
    isAbout.value ||
    (isIntro.value && !isIntroVoiceOver.value) ||
    isLoader.value
);

const showLowPowerMode = ref<boolean>(false);
const testVideo = ref<HTMLVideoElement>(null);
const checkLowPowerMode = async () => {
  // if (!Viewport.isIOS) return;

  testVideo.value = document.createElement("video");
  testVideo.value.setAttribute("playsinline", "playsinline");
  testVideo.value.setAttribute("aria-hidden", "true");
  testVideo.value.setAttribute("src", "");
  const isLowPowerMode = await (await import("./utils/PowerMode")).default
  isLowPowerMode(testVideo.value).then((lowPower) => {
    showLowPowerMode.value = lowPower;
  });
};

const fontLoaded = ref<boolean>(false);
const glappCreated = ref<boolean>(false);
const isMounted = ref<boolean>(false);
const onFontLoaded = () => (fontLoaded.value = true);

onMounted(async () => {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.finally(onFontLoaded);
  } else {
    onFontLoaded();
  }

  checkLowPowerMode();
  const module = await import("./services/AppService");
  await module.default.start();
  glappCreated.value = true;
  isMounted.value = true;
});
</script>

<style lang="stylus">
body, html
  full()
  overflow hidden

main
  width 100%
  height 100vh
  height calc(var(--vh, 1vh) * 100)

.container
  position relative
  inset 0
  full()
  background center / cover url('@/assets/images/archives/archives-bg.webp') no-repeat, var(--cream)
  z-index 2

.background-subtitles
  position absolute
  bottom 0
  left 0
  width 100%
  height 18%
  opacity 1
  pointer-events none
  z-index 1
  transition opacity 0.5s

  &::before
    content ''
    position absolute
    bottom 0
    left 0
    width 100%
    height 100%
    background linear-gradient(0deg, rgba(0, 0, 0, 0.50) 0%, rgba(0, 0, 0, 0.00) 100%)
    opacity 0.6
</style>
