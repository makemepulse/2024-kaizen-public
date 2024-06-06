<template>
  <div class="portail-container">

    <Subtitle v-if="isSubtitleShowed" :position="subtitlePosition" theme="dark-blue" @completed="onSubtitleCompleted" />

    <PortailMenu
      @mouseenter="() => { autoplay = false; }"
      @mouseleave="() => { autoplay = true; }"
      @keyboardNav="(val) => isKeyboardNav = val"
    />

    <div class="click-area"
      @mouseenter="setCursor(CursorState.CTA, { label: t('global.cta_enter') });"
      @mouseleave="resetCursor();" @click="handleEnter" />

    <div class="next-btn" @click="handleEnter" v-if="Viewport.isMobile || isKeyboardNav">
      <CTACursor :label="t('global.cta_enter')" focusable />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { CursorState, setCursor, resetCursor, setCursorCanScroll, CursorTheme } from "@/store/modules/Cursor";
import AppService from "@/services/AppService";
import { useAppContext } from '@/services/Composition';
import Viewport from "@/store/modules/Viewport";
import Delay from "@/core/Delay";
import ArchivesManager from "@webgl/activities/Archives/ArchivesManager";
import PortailMenu from "@/components/pages/portail/PortailMenu.vue";
import CTACursor from "@/components/blocks/Cursor/CTACursor.vue";
import AudioManager, { AUDIO_ID } from "@/core/audio/AudioManager";
import { Audio, setSubtitleShowed } from "@/store/modules/Audio";
import Subtitle from "@/components/blocks/Subtitle/Subtitle.vue";

const portailStep = useAppContext('step');

// 1OSEC
const TIMEOUT = 1000 * 10; // TIMEOUT must depends on the duration of the animation/subtitle

const VOICE_VOLUME = 0.5;
const AMBIENT_VOLUME = 0.75;

const { t } = useI18n();

const isKeyboardNav = ref(false);

const subtitlePosition = computed(() => {
  return Viewport.windowWidth > 768 ? "bottom" : "top";
});

const isSubtitleShowed = computed(() => Audio.isSubtitleShowed);
const onSubtitleCompleted = () => {
  setSubtitleShowed(false);
};
const handleEnter = () => {
  // first scene is named scene1 so we need to add 1
  // AppService.state.send("GO_TO_SCENE", { sceneId: portailStep.value + 1 });
  AppService.state.send("LEAVE_PORTAIL", { sceneId: portailStep.value + 1 });
  setCursor(CursorState.DEFAULT);
};
const autoplay = ref(Viewport.isDesktop);

const start = async () => {

  await Delay(TIMEOUT);

  if (autoplay.value) {
    const activeActivity = AppService.Scene.activities.active[0];
    await (activeActivity as ArchivesManager)?.onNavigation("down");
    // restart the loop
    await start();
  }
};

watch(portailStep, (newValue, oldValue) => {
  const randomVariation = String.fromCharCode(Math.floor(Math.random() * 3) + 97); // a, b or c
  const sceneId = newValue + 1;
  AudioManager.playPortal(sceneId, randomVariation, VOICE_VOLUME);
});

onMounted(() => {
  setCursor(CursorState.DEFAULT, { theme: CursorTheme.DEFAULT });
  start();
  AudioManager.fadeIn(AUDIO_ID.AMBIENT_CONCLUSION, AMBIENT_VOLUME);
});

onUnmounted(() => {
  AudioManager.fadeOut(AUDIO_ID.AMBIENT_CONCLUSION);
});

onBeforeUnmount(() => {
  autoplay.value = false;
  resetCursor(true);
});
</script>

<style lang="stylus" scoped>
.portail-container
  position relative
  full()
  pointer-events none
  color var(--dark-blue)

.click-area
  position absolute
  width 75vmin
  height 75vmin
  top 50%
  left 50%
  margin-left -37.5vmin
  margin-top -37.5vmin

  background-color var(--dark-blue)
  opacity 0

  pointer-events auto

.next-btn
  display flex
  justify-content center
  align-items center
  width rem(64)
  height rem(64)
  position absolute
  bottom rem(96)
  left 50%
  margin-left rem(-32)
  cursor pointer
  pointer-events auto
</style>