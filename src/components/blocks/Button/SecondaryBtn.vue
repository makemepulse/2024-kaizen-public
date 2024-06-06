<template>
  <button class="secondary-btn body" @mouseenter="onEnter" @mouseleave="onLeave" ref="root">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import SplitText from 'gsap/SplitText';
import Viewport from '@/store/modules/Viewport';

const textSplited = ref<SplitText>(null)
const textSplitedParent = ref<SplitText>(null)
const oldWindowWidth = ref<number>(0)
const root = ref<HTMLElement>()
const init = ref<boolean>(false)
let timelines: gsap.core.Timeline[] = []

gsap.registerPlugin(SplitText);

onMounted(() => {
  onResize()
})

const onResize = async() => {
  if (Viewport.windowWidth === oldWindowWidth.value) return
  
  oldWindowWidth.value = Viewport.windowWidth

  root.value.style.height = null

  if (textSplited.value || textSplitedParent.value) {
    textSplitedParent.value.revert()
    textSplited.value.revert()
  }

  await nextTick()
  
  textSplited.value = new SplitText(root.value, { type: 'chars', charsClass: 'Letter', wordsClass: 'Word' });
  init.value = true
}

const onEnter = () => {
  if (!init.value) return

  const tl = gsap.timeline({ repeat: -1, yoyo: true })
  tl
    .to(
      textSplited.value.chars, 
      {
        scale: () => gsap.utils.random(0.75, 1.1),
        rotate: () => gsap.utils.random(-6, 6),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-3, 3),
        stagger: 0.035,
        duration: 0.25,
        // duration: props.duration,
        ease: 'steps(2)',
      }
    )

  timelines.push(tl)
}

const onLeave = () => {
  if (!init.value) return

  gsap.to(
    textSplited.value.chars, 
    {
      scale: 1,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      y: 0,
      duration: 0.25,
      ease: 'steps(10)',
      onComplete: () => {
        timelines.forEach(tl => tl.revert().kill())
      }
    }
  )
}
</script>

<style lang="stylus" scoped>
.secondary-btn
  position relative
  cursor var(--cursor-pointer)
</style>