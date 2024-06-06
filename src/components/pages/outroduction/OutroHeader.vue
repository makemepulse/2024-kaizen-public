<template>
  <header class="outro-header" :class="{ 'is-portail': isPortail }">
    <button class="infos" :class="{ 'hovered': isHovered }" v-if="showAbout" @mouseenter="mouseenter" @mouseleave="mouseleave" @click="onInfosClick">
      <img src="@/assets/images/info.png" alt="Informations" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import AppService from '@/services/AppService';
import { useAppState } from '@/services/Composition';
import { CursorState, resetCursor, setCursor, setCursorHover } from '@/store/modules/Cursor';
import { gsap } from "gsap/all";
import AudioManager from '@/core/audio/AudioManager';

const { state } = useAppState();
const isPortail = computed(() => state.value.matches("portail"));
const isAbout = computed(() => state.value.matches("about"));
const showLogo = computed(() => isAbout.value);
const showAbout = computed(() => isPortail.value);

const isHovered = ref(false);

const mouseenter = () => {
  setCursor(CursorState.DEFAULT);
  setCursorHover(true);
  isHovered.value = true;
  AudioManager.playUI("kaizen_hover");

  gsap
    .timeline()
    .to(".app-cursor", { opacity: 0.8, duration: 0.25, ease: "quart.out" }, 0)
}

const mouseleave = () => {
  setCursorHover(false);
  isHovered.value = false;

  gsap
    .timeline()
    .to(".app-cursor", { opacity: 1, duration: 0.25, ease: "quart.out" }, 0)
}

const onInfosClick = () => {
  AppService.state.send("GO_ABOUT");
  AudioManager.playUI("kaizen_cta");
}

onBeforeUnmount(() => {
  mouseleave();
})
</script>

<style lang="stylus" scoped>
.outro-header
  position absolute
  width 100%
  height rem(40)
  top rem(20)
  padding 0 rem(20)
  color var(--dark-blue)
  z-index 2

  &.is-portail
    width 50%
    bottom rem(20)
    right rem(20)
    top auto
    padding 0
    +mobile()
      top rem(20)
      left rem(20)
      right auto
      bottom auto

    .infos
      right 0
      bottom 0
      top auto
      width rem(32)
      height @width
      transition-property opacity, transform
      transition 0.25s ease-out
      +mobile()
        right auto
        bottom auto
        top 0
      &.hovered, &:focus
        opacity 0.7
        transform scale(1.2)

  .infos
    position absolute
    top rem(6)
    right rem(24)
    width rem(24)
    height @width

    cursor none

    img
      full()
</style>