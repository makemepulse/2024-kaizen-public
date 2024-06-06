<template>
  <div class="archives-container">
    <div class="archives-bg" />

    <subtitle name="test" theme="archives" />

    <div class="skip">
      <Transition name="fade">
        <secondary-btn v-if="!isInTransition" class="skip-btn" @click="onSkip">SKIP</secondary-btn>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAppState, useAppContext } from "@/services/Composition";
import AppService from "@/services/AppService";
import { StepIds } from "@/services/models/ArchivesModel";

// const componentMap = {
//   'water': ArchiveWater,
//   'migration': ArchiveMigration,
//   'butterfly': ArchiveButterfly,
//   'conclusion': ArchiveConclusion
// };

const { state } = useAppState();
const step = computed(() => state.value.context.step);
const isInTransition = useAppContext('archiveTransition');

// const currentView = computed(() => {
//   const stepKey = StepIds[state.value.context.step];
//   if(isLandingPage.value) return ArchiveIntro;
//   return componentMap[stepKey] || null;
// });

// const onNext = () => {
//   if(step.value === StepIds.length - 1) {
//     AppService.state.send("NEXT_ORIGAMI");
//   } else {
//     AppService.state.send("NEXT");
//   }
// };

// const onPrev = () => {
//   AppService.state.send("PREV");
// };

const onSkip = () => {
  AppService.state.send("SKIP");
};
</script>

<style lang="stylus" scoped>
.archives-container
  position absolute
  pointer-events none
  full()

.skip
  position absolute
  bottom rem(20)
  right rem(20)

  .skip-btn
    pointer-events auto
    color var(--red)
</style>