<template>
  <ArchiveLayout type="conclusion">
    <template #content>
      <letter-by-letter tag="h6" class="archive-title" :delay="0.4">Today</letter-by-letter>
      <letter-by-letter tag="p" class="archive-text" :delay="0.6">Dear Diary, <br /><br />School starts tomorrow, and I'm super excited to see what it's all about! I'll learn lots and meet new friends. I hope I can still do lots of dreaming...</letter-by-letter>
      <letter-by-letter tag="p" class="archive-subtitle" :delay="4.5">Do we forget our dreams when we grow up?</letter-by-letter>
    </template>
  </ArchiveLayout>
</template>

<script setup lang="ts">
import ArchiveLayout from "@/components/pages/archives/ArchiveLayout.vue";
</script>

<style lang="stylus" scoped>
.archive-title
  margin-bottom rem(-10)
  margin-left calc(32px * 2)
  transform rotate(-10deg)
  transform-origin bottom left

.archive-text
  transform rotate(-5deg)
  margin-left rem(32)

.archive-subtitle
  margin-left rem(-12)
  margin-top rem(64)
</style>