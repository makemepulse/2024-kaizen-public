<template>
  <Transition :css="false" mode="out-in" @enter="enter" @leave="leave">
    <div v-if="show" class="wait-cursor" :class="[`wait-cursor--${theme}`, { 'wait-cursor--intro': isIntro }]"
      ref="root">
      <PieProgress ref="pie" :class="theme" :progress="progress" :size="size" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, watch } from 'vue';
import gsap from 'gsap';

import PieProgress from '@/components/blocks/PieProgress/PieProgress.vue';
import Cursor, { setCursorOptions } from '@/store/modules/Cursor';
import AppService from '@/services/AppService';
import { toStatePaths } from 'xstate/lib/utils';
import { useAppState } from '@/services/Composition';

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
});

const size = 28;
const { state } = useAppState();

const root = ref<HTMLElement | null>(null);
const pie = ref<typeof PieProgress | null>(null);

const theme = computed(() => Cursor.options.theme);
const progress = computed(() => Cursor.options.progress);
const isIntro = computed(() => state.value.matches("intro"));

const show = computed(() => {
  return props.show
});

const minScale = 0
const enterDelay = 0
const enter = (el: Element, onComplete: () => void) => {
  gsap.timeline({ onComplete, delay: enterDelay })
    .fromTo(el, { scale: minScale }, { scale: 1.2, duration: 0.25 })
    .to(el, { scale: 1, duration: 0.25, clearProps: 'all' });
}

const leave = (el: Element, onComplete: () => void) => {
  gsap.timeline({ onComplete })
    .to(el, { scale: minScale, duration: 0.75, ease: 'quart.in' })
}

const currIntroPercentage = computed(() => AppService.Scene?.currIntroPercentage.value);
watch(currIntroPercentage, (progress, oldProgress) => {
  if (progress > oldProgress) {
    let prog = 0.5 + progress * 0.5;
    const state = toStatePaths(AppService.state.getSnapshot().value);
    // console.log(state[0])
    if(AppService.Scene.currentScene?.sceneId === 1 || state[0].includes("conclusion")) {
        prog = progress;
    }
    setCursorOptions({ progress: prog });
  }
});

const currOutroPercentage = computed(
  () => AppService.Scene?.currOutroPercentage.value
);
watch(currOutroPercentage, (progress, oldProgress) => {
  if (progress > oldProgress) {
    let prog = progress * 0.5
    const state = toStatePaths(AppService.state.getSnapshot().value);
    if (state[0].includes("intro") || AppService.Scene.currentScene?.sceneId === 4)
      prog = progress;
    setCursorOptions({ progress: prog });
  }
});

// watch(progress, (p, oldP) => {
//   if (oldP > p) {
//     root.value && gsap.fromTo(root.value, { rotate: 0 }, { rotate: 360, duration: .85, ease: 'quart.out' })
//   }
//   const fromSize = 16 / size;
//   pie.value && pie.value.root && gsap.to(pie.value.root, { scale: fromSize + p * (1 - fromSize), duration: .25, ease: 'quart.out' });
// })
</script>

<style lang="stylus" scoped>
.wait-cursor
    display flex
    align-items center
    justify-content center

    position absolute

    +mobile()
        position fixed
        bottom rem(20)
        left auto
        right rem(20)
        top auto

        user-select auto

    &--intro
      +mobile()
        left rem(20)
        right auto
</style>