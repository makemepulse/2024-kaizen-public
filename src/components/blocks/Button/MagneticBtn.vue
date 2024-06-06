<template>
  <component :is="tag" class="magnetic" ref="root">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  tag: {
    type: String,
    default: 'div'
  },
})

const root = ref<HTMLElement>(null)
const xTo = ref()
const yTo = ref()
const elBounds = ref<DOMRect>()

onMounted(() => {
  onInit()
  window.addEventListener('resize', onResize);
})

const onInit = () => {
  xTo.value = gsap.quickTo(root.value, 'x', {
    duration: 1,
    ease: 'elastic.out(1, 0.4)'
  })
  yTo.value = gsap.quickTo(root.value, 'y', {
    duration: 1,
    ease: 'elastic.out(1, 0.4)'
  })

  elBounds.value = root.value.getBoundingClientRect()
  root.value.addEventListener('mousemove', (e) => onMouseMove(e))
  root.value.addEventListener('mouseleave', (e) => onMouseLeave())
}

const onMouseMove = (e: MouseEvent) => {
  const { height, width, left, top } = elBounds.value
  const { clientX, clientY } = e
  const x = clientX - (left + width / 2)
  const y = clientY - (top + height / 2)

  xTo.value(x)
  yTo.value(y)
}

const onMouseLeave = () => {
  xTo.value(0)
  yTo.value(0)
}

const onResize = () => {
  elBounds.value = root.value.getBoundingClientRect()
}

onBeforeUnmount(() => {
  root.value.removeEventListener('mousemove', onInit)
  root.value.removeEventListener('mouseleave', onInit)
  window.removeEventListener('resize', onResize)
})
</script>

<style lang="stylus" scoped>

</style>