<template>
  <div class="outro-page">
    <OutroContainer />
  </div>
</template>

<script lang="ts" setup>
import OutroContainer from "./OutroContainer.vue";

</script>

<style lang="stylus" scoped>
.outro-page
  position relative
  inset 0
  full()
  background var(--dark-blue)
  color var(--cream)
</style>