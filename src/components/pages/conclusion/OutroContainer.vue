<template>
  <div ref="root" class="origami-container">
    <Subtitle
      v-if="isSubtitleShowed"
      theme="outro"
      @completed="onSubtitleCompleted"
    />
    <Subtitle
      v-if="isTextShowed"
      theme="outro-text"
      srt-url="outro-text"
      position="center"
      is-big
      slow-fade
    />
    <div class="outro-title">
      <img
        class="title-logo"
        src="@/assets/images/kaizen.webp"
        alt="kaizen logo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap, SplitText } from 'gsap/all';
import { computed, onMounted, ref, watch } from 'vue';

import Subtitle from '@/components/blocks/Subtitle/Subtitle.vue';
import AppService from '@/services/AppService';
import Conclusion from '@webgl/activities/Conclusion/Conclusion';
import AudioManager, { AUDIO_ID } from '@/core/audio/AudioManager';
import { Audio, setSubtitleShowed } from '@/store/modules/Audio';

gsap.registerPlugin(SplitText);

const root = ref();

const AMBIENT_VOLUME = 0.75;

const isTextShowed = ref(false);
const isSubtitleShowed = computed(() => Audio.isSubtitleShowed);
const onSubtitleCompleted = () => {
  setSubtitleShowed(false);
  isTextShowed.value = true;
};

onMounted(async () => {
  AudioManager.fadeIn(AUDIO_ID.AMBIENT_CONCLUSION, AMBIENT_VOLUME);
  AudioManager.playConclusion();
})

const showLogo = computed(() => {
  const activity = (AppService.Scene?.activities.getActivity("conclusion") as Conclusion);
  return activity ? activity.showLogoRef.value : false
});

watch(showLogo, (show) => {
  animateLogo(show);
})

const animateLogo = (show: boolean) => {
  const $ = gsap.utils.selector(root.value);
  const tl = gsap.timeline();

  if (!show) {
    tl.to($('.outro-title'), {
      opacity: 0,
      duration: 1.5,
      ease: "power2.out",
    });
    return;
  }

  tl.fromTo($(`.outro-title`), {
    opacity: 0,
  }, {
    opacity: 1,
    duration: 1,
    ease: "power2.in",
  })
}
</script>

<style lang="stylus" scoped>
.origami-container
  position relative
  full()
  display flex
  justify-content center
  align-items center
  flex-direction column
  padding-bottom 8vh
  text-align center
  gap rem(64)
  user-select none

  .outro-title
    position fixed
    top 50%
    left 50%
    transform translate(-50%, -50%)
    width 65vw
    max-height 80vh
    display flex
    flex-direction column
    align-items center
    justify-content center
    gap rem(16)
    opacity 0
    color var(--dark-yellow)
    +desktop()
      width 50vw
      gap 0

    .title-logo
      width 100%
      height auto
      min-height 0
      object-fit contain

    .subtitle
      text-align center
      font-size rem(16)
      -webkit-text-stroke-width rem(0.5)
      -webkit-text-stroke-color var(--dark-yellow)
      +desktop()
        font-size rem(24)
</style>