<template>
  <ArchiveLayout type="butterfly">
    <template #content>
      <letter-by-letter tag="h6" class="archive-title" :delay="0.4">December, 19th</letter-by-letter>
      <letter-by-letter tag="p" class="archive-text" :delay="0.75">Super happy! Got my first backpack today with a butterfly on it, my favorite bugs. It'll bring me lots of luck! I take it everywhere.</letter-by-letter>
    </template>
  </ArchiveLayout>
</template>

<script setup lang="ts">
import ArchiveLayout from "@/components/pages/archives/ArchiveLayout.vue";
</script>

<style lang="stylus" scoped>
.archive-title
  transform rotate(-10deg)
  transform-origin bottom left

.archive-text
  transform rotate(-5deg)
  margin-right rem(24)
  margin-left rem(-24)
</style>