<template>
  <div
    ref="root"
    class="lottie-animation"
  />
</template>

<script lang="ts" setup>
import Lottie, { AnimationItem } from "lottie-web";
import { onBeforeUnmount, defineProps, onMounted, PropType, ref } from "vue";

const props = defineProps({
  src: {
    type: String
  },
  animationData: {
    type: Object as PropType<Record<string, unknown>>
  },
  renderer: {
    type: String as PropType<"svg" | "canvas" | "html">,
    default: "svg"
  },
  loop: {
    type: Boolean,
    default: false
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  loopAt: {
    type: Number
  },
  speed: {
    type: Number,
    default: 1
  },
  rendererSettings: {
    type: Object as PropType<Record<string, unknown>>
  }
});

const lottieAnim = ref<AnimationItem>();
const root = ref<HTMLElement>();

onMounted(() => {

  lottieAnim.value = Lottie.loadAnimation({
    container: root.value,
    animationData: props.animationData,
    renderer: props.renderer,
    loop: props.loop,
    autoplay: props.autoplay,
    path: props.src,
    rendererSettings: {
      preserveAspectRatio: "xMaxYMid slice",
      ...props.rendererSettings
    },
  });

  if(props.loopAt) {
    lottieAnim.value.addEventListener("complete", () => loopAtFn);
  }

})

onBeforeUnmount(() => {
  lottieAnim.value?.destroy();
  if(props.loopAt) lottieAnim.value?.removeEventListener("complete", loopAtFn);
})

const loopAtFn = () => {
  lottieAnim.value.goToAndPlay(props.loopAt, true);
}

const play = () => {
  lottieAnim.value?.play();
}

const stop = () => {
  lottieAnim.value?.goToAndStop(1, true);
}

const setSpeed = (speed: number) => {
  lottieAnim.value?.setSpeed(speed);
}

defineExpose({
  play,
  stop,
  setSpeed,
  loopAtFn,
  lottieAnim
})
</script>

<style lang="stylus" scoped></style>