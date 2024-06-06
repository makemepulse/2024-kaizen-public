<template>
  <ArchiveLayout type="migration">
    <template #content>
      <letter-by-letter tag="h6" class="archive-title" :delay="0.4">December, 18th</letter-by-letter>
      <letter-by-letter tag="p" class="archive-text" :delay="0.75">Will the cranes be there when I go back? Dad said they also go home when summer ends.<br /> <br />He called it "migration."</letter-by-letter>
    </template>
  </ArchiveLayout>
</template>

<script setup lang="ts">
import ArchiveLayout from "@/components/pages/archives/ArchiveLayout.vue";
</script>

<style lang="stylus" scoped>
</style>