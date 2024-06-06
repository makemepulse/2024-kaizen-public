<template>
  <header class="outro-header">
    <button class="infos" v-if="showAbout" @click="onInfosClick">
      <img src="@/assets/images/info.png" alt="Informations" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppService from '@/services/AppService';
import { useAppState } from '@/services/Composition';

const { state } = useAppState();
const isPortail = computed(() => state.value.matches("portail"));
const isAbout = computed(() => state.value.matches("about"));
const showLogo = computed(() => isAbout.value);
const showAbout = computed(() => isPortail.value);

const onInfosClick = () => {
  AppService.state.send("GO_ABOUT");
}
</script>

<style lang="stylus" scoped>
.outro-header
  position absolute
  width 100%
  height rem(40)
  top rem(20)
  padding 0 rem(20)
  color var(--dark-blue)
  z-index 2

  .infos
    position absolute
    top rem(6)
    right rem(24)
    width rem(24)
    height @width

    img
      full()
</style>