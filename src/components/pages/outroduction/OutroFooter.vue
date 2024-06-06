<template>
  <footer class="outro-footer">
    <div class="background"/>
    <ul class="footer-socials">
      <li v-for="(social, index) in socials" :key="social">
        <a
          class="focusable"
          :href="t(`socials.social_${index+1}.url`)"
          :id="`${index}`"
          target="_blank"
          rel="noopener noreferrer"
          @mouseenter="onEnter"
          @mouseleave="onLeave"
          @click="() => onClick(index)"
        >
          <svg-icon :class="{ 'hovered': hoveredIndex === index }" :name="`socials/${t(`socials.social_${index+1}.name`)}`" />
        </a>
      </li>
    </ul>
  </footer>
</template>

<script setup lang="ts">
import { gsap } from "gsap/all";
import { useI18n } from "vue-i18n";
import { computed, onBeforeUnmount, ref } from "vue";
import AudioManager from "@/core/audio/AudioManager";
import { setCursorHover } from "@/store/modules/Cursor";
import { trackSelect, SELECT_SOCIALS } from "@/utils/Gtm";

const { t, messages, locale } = useI18n();
const socials = computed(() => Object.keys(messages.value[locale.value].socials))

const hoveredIndex = ref(-1);

const onEnter = (e: MouseEvent) => {
  AudioManager.playUI("kaizen_hover");
  hoveredIndex.value = Number((e.target as HTMLElement).id || -1);
  setCursorHover(true);

  gsap
    .timeline()
    .to(".app-cursor", { opacity: 0.8, duration: 0.25, ease: "quart.out" }, 0)
}

const onLeave = () => {
  hoveredIndex.value = -1;
  setCursorHover(false);

  gsap
    .timeline()
    .to(".app-cursor", { opacity: 1, duration: 0.25, ease: "quart.out" }, 0)
}

const onClick = (index: number) => {
  AudioManager.playUI("kaizen_cta");
  const name = t(`socials.social_${index+1}.name`);
  const data = SELECT_SOCIALS.get(name);
  if (!data) return;
  trackSelect(data)
}

onBeforeUnmount(() => {
  onLeave();
})
</script>

<style lang="stylus" scoped>
.outro-footer
  position fixed
  bottom 0
  left 0
  display flex
  justify-content flex-end
  width 100%
  padding rem(20)
  z-index 10

  .background
    position absolute
    bottom 0
    left 0
    height 200%
    width 100%
    opacity 0.5
    background linear-gradient(to bottom, transparent, transparent 0%, var(--dark-blue) 75%)
    +desktop()
      display none

  .footer-socials
    position relative
    display flex
    gap rem(16)

    .icon
      width rem(24)
      height @width
      transition opacity 0.25s ease-out

      &.hovered
        opacity 0.7

  .footer-logo
    position relative
    display block
    font-size rem(20)
    line-height 1

a
  cursor none

  &:focus
    outline none
</style>