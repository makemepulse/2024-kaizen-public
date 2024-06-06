<template>
  <Transition :css="false" mode="out-in" @enter="enter" @leave="leave" appear>
    <div v-if="props.show" :class="['cursor-cta', { focusable }]" v-bind="focusable ? { tabindex: 0 } : {}">
      <div class="background" ref="backgroundEl" />

      <div class="front">
        <jitter-animation>
          <div class="cursor-label body-s o-hidden" ref="labelEl">
            {{ label }}
          </div>
        </jitter-animation>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import gsap from "gsap";

import Cursor from "@/store/modules/Cursor";

const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  show: {
    type: Boolean,
    default: true,
  },
  focusable: {
    type: Boolean,
    default: false,
  }
});

const backgroundEl = ref<HTMLElement | null>(null);
const labelEl = ref<HTMLElement | null>(null);

const label = computed(() => {
  return props.label || Cursor.options.label;
});

const enterDelay = 0
const enter = (el: Element, onComplete: () => void) => {
  const $ = gsap.utils.selector(el);

  gsap
    .timeline({ onComplete, delay: enterDelay })
    .fromTo(
      $(".background"),
      { scale: 0 },
      { scale: 1, duration: 0.25, ease: "back.out" }
    )
    .fromTo(
      $(".cursor-label"),
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.35, ease: "quart.out" },
      0
    );
};

const leave = (el: Element, onComplete: () => void) => {
  const $ = gsap.utils.selector(el);

  gsap
    .timeline({ onComplete })
    .to($(".background"), { scale: 0, duration: 0.5, ease: "power4.out" })
    .to(
      $(".cursor-label"),
      { opacity: 0, scale: 0, duration: 0.5, ease: "power4.out" },
      "-=0.5"
    );
};
</script>

<style lang="stylus" scoped>
.cursor-cta
  display flex
  align-items center
  justify-content center

  position absolute

  color var(--light)

  .body-s
    font-size rem(12)

  .background
    width rem(48)
    height @width

    position absolute
    top 50%
    left 50%

    margin-top @height * -0.5
    margin-left @width * -0.5

    &::before
      content ''
      position absolute
      width 100%
      height 100%
      background center / contain url('@/assets/images/cursor/cta.png') no-repeat

      animation goRound 5s infinite linear

@keyframes goRound {
  0% {
    transform rotate(0deg);
  }
  100% {
    transform rotate(359deg);
  }
}
</style>
