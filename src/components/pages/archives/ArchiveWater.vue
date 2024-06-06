<template>
  <ArchiveLayout type="water">
    <template #content>
      <letter-by-letter tag="h6" class="archive-title" :delay="0.4">December, 17th</letter-by-letter>
      <letter-by-letter tag="p" class="archive-text" :delay="0.75">I'm happy to be home, but I miss the countryside. I wish I could jump from waterfalls and swim with fishes!</letter-by-letter>
    </template>
  </ArchiveLayout>
</template>

<script setup lang="ts">
import ArchiveLayout from "@/components/pages/archives/ArchiveLayout.vue";
</script>

<style lang="stylus" scoped>
.archive-title
  margin-bottom rem(-10)
  margin-left rem(-40)
  transform rotate(-10deg)
  transform-origin bottom left

.archive-text
  transform rotate(-5deg)
  margin-left rem(-12)
</style>