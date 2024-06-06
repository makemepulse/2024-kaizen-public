<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import Feature from '@/store/modules/Feature';
import { computed } from 'vue';

const classes = computed(() => ({
  'jitter-animation': Feature.jitter,
}));
</script>

<style lang="stylus" scoped>
@keyframes jitter-anim
  0%
    filter url('#jitter-0')
  
  25%
    filter url('#jitter-1')
  
  50%
    filter url('#jitter-2')
  
  75%
    filter url('#jitter-3')
  
  100%
    filter url('#jitter-4')
  
.jitter-animation
  animation jitter-anim 1s linear infinite
</style>