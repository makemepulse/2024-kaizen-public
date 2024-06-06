<template>
  <div 
    class="archive-layout"
    :class="[`archive-${type}`]"
    ref="root"
  >
    <div class="archive-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, PropType, ref } from "vue";
import gsap from "gsap";
import { useGSAP } from "@/composables/useGSAP";
import Viewport from "@/store/modules/Viewport";
import { StepId } from "@/services/models/ArchivesModel";

const props = defineProps({
  type: {
    type: String as PropType<StepId>,
    required: true
  }
});

const { addTimeline } = useGSAP();

const root = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);

onMounted(async() => {
  await nextTick();
  content.value = document.querySelector('.archive-content')
});

const onNavigation = async() => {
  const words = content.value!.querySelectorAll('.Word')
  const letters = content.value!.querySelectorAll('.Letter')

  const tl = gsap.timeline()
  tl
    .to(letters, {
      yPercent: -100,
      autoAlpha: 0,
      stagger: {
        amount: 1,
        from: 'random',
        ease: 'quart.inOut'
      },
    }, 0)

  addTimeline(tl)
}
</script>

<style lang="stylus" scoped>
.archive-layout
  position relative
  z-index 2
  pointer-events none
  full()

/*
* INTRO ARCHIVE
*/
.archive-intro
  .archive-content
    position absolute
    full()
    top 50%
    left 50%
    transform translate(-50%, -50%)
    display flex
    flex-direction column
    align-items center
    justify-content center
    max-width rem(375)
    width 50%
    text-align center

/* 
* WATER ARCHIVE
*/
.archive-water
  .archive-content
    position absolute
    bottom rem(96)
    left rem(96)
    display flex
    flex-direction column
    justify-content flex-end
    max-width rem(340)
    width 100%

/*
* MIGRATION ARCHIVE
*/
.archive-migration
  .archive-content
    position absolute
    bottom rem(96)
    right rem(96)
    display flex
    flex-direction column
    align-items flex-end
    justify-content flex-end
    max-width rem(340)
    width 100%
    text-align right

  .archive-title
    margin-bottom rem(20)
    margin-left rem(-40)
    transform rotate(4deg)
    transform-origin bottom left

  .archive-text
    transform rotate(4deg)
    margin-right rem(24)

/*
* BUTTERFLY ARCHIVE
*/
.archive-butterfly
  .archive-content
    position absolute
    top rem(96)
    right rem(96)
    display flex
    flex-direction column
    justify-content flex-start
    max-width rem(340)
    width 100%

/*
* CONCLUSION ARCHIVE
*/
.archive-conclusion
  .archive-content
    position absolute
    bottom rem(96)
    left rem(96)
    display flex
    flex-direction column
    justify-content flex-start
    max-width rem(340)
    width 100%
</style>