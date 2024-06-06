<template>
  <component :is="tag" ref="root">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import { useGSAP } from "@/composables/useGSAP";
import SplitText from 'gsap/SplitText';
import Viewport from '@/store/modules/Viewport';

gsap.registerPlugin(SplitText);

const props = defineProps({
  debug: {
    type: Boolean,
    default: false
  },
  tag: {
    type: String,
    default: 'div'
  },
  overflow: {
    type: Boolean,
    default: false
  },
  auto: {
    type: Boolean,
    default: true
  },
  repeat: {
    type: Number,
    default: 0
  },
  delay: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0.25
  },
  stagger: {
    type: [Number, Function],
    default: 0.025
  },
  animated: {
    type: Boolean,
    default: true
  },
  randomize: {
    type: Boolean,
    default: false
  },
  useLine: {
    type: Boolean,
    default: false
  }
})

const { addTimeline, addSplitText } = useGSAP();
const textSplited = ref<SplitText>()
const textSplitedParent = ref<SplitText>()
const oldWindowWidth = ref<number>(0)
const root = ref<HTMLElement>()
const init = ref<boolean>(false)
const played = ref<boolean>(false)

onMounted(() => {
  onResize()

  if (props.animated) {
    if (props.auto) onEnter()
  }
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
  
  textSplited.value = new SplitText(root.value, { type: props.useLine ? 'chars,words,lines' : 'chars,words', charsClass: 'Letter', wordsClass: 'Word', linesClass: 'Line Line--++' });
  
  if (props.overflow) {
    textSplitedParent.value = new SplitText(root.value, { type: 'chars', charsClass: 'Letter__Parent' });
  }

  if (props.randomize) {
    textSplited.value.chars.forEach((char) => {
      const c = (char as HTMLElement).innerHTML;
      const r1 = randomize([c]);
      const r2 = randomize([c, r1]);
      (char as HTMLElement).innerHTML = `<span class="Letter__Base">${ c }</span><span class="Letter__Random Letter__Random--2">${ r1 }</span><span class="Letter__Random Letter__Random--1">${ r2 }</span>`
    })
  }

  init.value = true
  if (props.animated) onEnter()
}

const onEnter = () => {
  const tl = gsap.timeline({ repeat: props.repeat });

  if (init.value && !played.value) {
    played.value = true

    const $ = gsap.utils.selector(root.value as HTMLElement)
    tl
      .addLabel('start', props.delay ? props.delay : 0)
      .to([$('.Letter')], {
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        opacity: 1,
        stagger: props.stagger as number,
        duration: props.duration,
        ease: 'quart.out'
      }, 'start')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2,
        ease: 'quart.out' 
      }, 'start+=0.25')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=0.45')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2,
        ease: 'quart.out' 
      }, 'start+=0.65')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=0.85')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=1.05')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=1.25')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2,
        ease: 'quart.out' 
      }, 'start+=1.45')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=1.65')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=1.85')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=2.05')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2,
        ease: 'quart.out' 
      }, 'start+=2.25')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=2.45')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=2.65')
      .to([$('.Letter')], { 
        scale: () => gsap.utils.random(0.9, 1.1),
        rotate: () => gsap.utils.random(-3, 3),
        skewX: () => gsap.utils.random(-7, 7),
        skewY: () => gsap.utils.random(-7, 7),
        y: () => gsap.utils.random(-1, 1),
        duration: 0.2, 
        ease: 'quart.out' 
      }, 'start+=2.85')
      .to([$('.Letter')], { 
        y: 0,
        skewX: 0,
        skewY: 0,
        scale: 1, 
        rotate: 0,
        duration: 0.2,
        ease: 'quart.out' 
      }, 'start+=3.05')
      .set([$('.Letter')], { clearProps: 'y, skewX, skewY, scale, rotate, transform' }, 'start+=3.05')
      
      // Kill timeline when it's not used
      addTimeline(tl)
      addSplitText(textSplited.value)
      if(props.overflow) addSplitText(textSplitedParent.value)
  }

  return tl
}
</script>

<style lang="stylus" scoped>
:deep(.Letter)
  position relative
  opacity 0

  &__Parent
    overflow hidden
  
  &__Base,
  &__Random
    display none
  &__Random--1
    display inline-block

:deep(.Word)
  transform-origin top left
  animation leaveWord 0.75s ease-in forwards

  &:hover
    animation hoverWord 0.15s ease-out forwards

@keyframes hoverWord {
  0% { 
    opacity: 1;
  }
  100% { 
    opacity: 0.5;
  }
}
@keyframes leaveWord {
  0% { 
    opacity: 0.5;
  }
  100% { 
    opacity: 1;
  }
}
</style>