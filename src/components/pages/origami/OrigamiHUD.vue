<template>
  <div class="origami-page bg" ref="root">
    <div class="origami-container">
      <primary-btn @click="launchGame">GO TO SCENE</primary-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppService from "@/services/AppService";
import { computed, onMounted, ref } from "vue";
import AudioManager from '@/core/audio/AudioManager';
import { useAppState } from "@/services/Composition";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { state } = useAppState();
const sceneId = computed(() => state.value.context.sceneId);

onMounted(() => {});

const launchGame = () => {
  AppService.state.send("SCENE_LAUNCH");
};

const pause = () => {
  AppService.state.send("PAUSE_GAME");
};
</script>

<style lang="stylus" scoped>
.origami-page
  position relative
  inset 0
  full()
  &::after
    content ''
    position absolute
    bottom 0
    width 100%
    height 25vh
    pointer-events none
    z-index 0
  .origami-container
    position relative
    full()
    display flex
    justify-content center
    align-items center
    flex-direction column
    padding-bottom 8vh
    z-index 1

    .origami-title
      text-align center
      margin-bottom rem(16)

      +desktop()
        margin-bottom rem(40)

    .origami-description
      text-align center
      margin-bottom rem(32)

      +desktop()
        margin-bottom rem(40)
</style>
