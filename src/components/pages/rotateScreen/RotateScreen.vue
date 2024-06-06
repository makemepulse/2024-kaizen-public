<template>
  <div v-if="isRotateScreen" class="rotate-screen">
    <jitter-animation>
      <div v-html="iconHtml"/>
      <p class="body-big">
        {{ t("global.rotate_screen") }}
      </p>
    </jitter-animation>
    <div class="rotate-screen-grain"/>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, onMounted, ref } from "vue";
import Viewport from "@/store/modules/Viewport";

const { t } = useI18n();

const iconHtml = ref("");


const isRotateScreen = computed(() => {
  return Viewport.isLandscape && !Viewport.isDesktop;
});

onMounted(async () => {
  iconHtml.value = await fetch("/assets/images/emojis/heart-full.svg").then(res => res.text());
});
</script>

<style lang="stylus" scoped>
.rotate-screen
  position fixed
  inset 0
  full()
  background var(--cream)
  color var(--dark-blue)
  z-index 3

  > div
    full()
    display flex
    flex-direction column
    justify-content center
    align-items center
    gap rem(16)

  p
    text-align center
    max-width rem(220)

  &-grain
    position fixed
    full()
    inset 0
    background url("@/assets/images/grain.webp") repeat
    mix-blend-mode overlay
    z-index 2
</style>