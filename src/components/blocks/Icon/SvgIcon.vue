<template>
  <component class="icon" :class="`icon--${name}`" :is="icon" />
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
});

const icon = computed(() => {
  const name = props.name;
  return defineAsyncComponent(() => import(`@/assets/icons/${name}.svg`));
});
</script>

<style lang="stylus">
.icon
  display inline-block
  vertical-align middle
  width 1em
  height 1em
  fill currentColor
  pointer-events none

.no-fill
  fill none
.no-stroke
  stroke none

.stroke
  fill none
  stroke currentColor
  stroke-width 2px
  stroke-linecap round 
  stroke-linejoin round
  &--thin
    stroke-width 1px
</style>