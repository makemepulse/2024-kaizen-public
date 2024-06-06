<template>
  <div class="root-gl">
    <div ref="root" class="glview" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import AppService from "@/services/AppService";
import Viewport from "@/store/modules/Viewport";
import { useAppState } from "@/services/Composition";

const root = ref(null);
const touchLeft = ref(false);
const touchRight = ref(false);

const { state } = useAppState();
const isPlaying = computed(() => state.value.matches("game.idle.playing"));

const onTouchActive = ({
  isLeft,
  isRight,
}: {
  isLeft: boolean;
  isRight: boolean;
}) => {
  if (!isLeft && !isRight) {
    touchLeft.value = false;
    touchRight.value = false;
  } else if (isLeft) {
    touchLeft.value = true;
  } else if (isRight) {
    touchRight.value = true;
  }
};

onMounted(() => {
  root.value.appendChild(AppService.glapp.glview.canvas);
  if (!Viewport.isDesktop) AppService.Scene.onTouchActive.on(onTouchActive);
});
onBeforeUnmount(() => {
  root.value.removeChild(AppService.glapp.glview.canvas);
  if (!Viewport.isDesktop) AppService.Scene.onTouchActive.off(onTouchActive);
});
</script>

<style lang="stylus">

.root-gl
  .touch-control
    position absolute
    bottom 0
    left 0
    width 100%
    height 100%
    pointer-events none

    &.hide
      display none

    .button
      position absolute
      width 50%
      height 22vw
      bottom rem(30)
      display: flex;
      align-items: center;
      &.button-left
        left rem(-32)
        justify-content: flex-end;
      &.button-right
        right rem(-32)
        justify-content: flex-start;
      .icon-btn
        width 18vw
        position absolute
        pointer-events all

.glview, .root-gl
  position absolute
  top 0
  left 0
  // touch-action none
  box-sizing border-box
  width 100vw
  height 100vh
  height: calc(var(--vh, 1vh) * 100);
  user-select none

  canvas
    width 100vw
    height 100vh
    height: calc(var(--vh, 1vh) * 100);
    position absolute
    top 0
    left 0

  /**
   * windowed - test canvas not fullscreen
   */
  &.windowed
    margin 200px 0
    padding 40px
    width 100%
    height 100%

    canvas
      position initial
      width 100%
      height 100%
</style>
