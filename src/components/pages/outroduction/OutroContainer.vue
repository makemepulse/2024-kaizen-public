<template>
  <div ref="root" class="origami-container">
      <jitter-animation class="outro-1 grid padded">
        <div class="outro-text body-big col-start-1 col-span-6 xl:col-start-4 xl:col-span-6">
          Through each project, <span class="bg-red">we strive</span> to cast a fresh gaze to offer you authentic and spontaneous experiences. Every new subject.
        </div>
      </jitter-animation>
      <jitter-animation class="outro-2 dots">
        <!-- <img width="165" height="40" src="@/assets/images/white-dots.png" /> -->
        <!-- <img class="dot" width="18" height="18" src="@/assets/images/loader/dot-01.png" />
        <img class="dot" width="18" height="18" src="@/assets/images/loader/dot-02.png" />
        <img class="dot" width="18" height="18" src="@/assets/images/loader/dot-03.png" /> -->
      </jitter-animation>
      <jitter-animation class="outro-3 dots">
        <span class="footer-logo body-big">makemepulse©</span>
      </jitter-animation>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import gsap from 'gsap/all';
import AppService from "@/services/AppService";
import Delay from '@/core/Delay';

const root = ref();

onMounted(() => {
  onInit();
})

const onInit = () => {
  const $ = gsap.utils.selector(root.value);
  const tl = gsap.timeline({ onComplete: async () => {
    await Delay(2000)
    AppService.state.send("SKIP")
  }})
  tl
    .set($('.outro-1'), { opacity: 0 })
    .set($('.outro-2'), { opacity: 0 })
    .set($('.outro-3'), { opacity: 0 })
  tl
    .to($('.outro-1'), {
      opacity: 1,
      ease: "quart.out",
      duration: 0.25
    })
    .to($('.outro-1'), {
      opacity: 0,
      ease: "quart.out",
      duration: 0.25,
    }, '>5')
    .to($('.outro-2'), {
      opacity: 1,
      duration: 0.25,
      ease: "quart.out",
    })
    .to($('.outro-2'), {
      opacity: 0,
      duration: 0.25,
      ease: "quart.out",
    }, '>2')
    .to($('.outro-3'), {
      opacity: 1,
      ease: "quart.out",
      duration: 0.25
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

  .outro-1, .outro-2, .outro-3
    position absolute

  .outro-text
    .bg-red
      position relative
      z-index 1
      &::before
        content ''
        position absolute
        top -28%
        left -5%
        width 110%
        height 150%
        background center / contain no-repeat url('~@/assets/images/subtitles/brush/s-red.png')
        z-index -1
        +mobile()
          display none

  .dot
    &:first-child
      margin-right rem(4)
    &:last-child
      margin-left rem(12)

  .footer-logo
    display block
</style>