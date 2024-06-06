<template>
  <div class="SceneTitleIcon">
    <SpritePlayer
      :nbFrames="framesData[icon].nbFrames"
      :framerate="framesData[icon].framerate"
      :src="`/assets/images/animals/${icon}`"
      ref="player"
    />
  </div>
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';
import { framesData, OrigamiId } from "@/services/models/OrigamiModel";

const props = defineProps({
  icon: {
    type: String as PropType<OrigamiId>,
    required: true
  },
})
</script>

<style scope lang="stylus">
.SceneTitleIcon
  position relative
  width rem(90)
  height @width
</style>