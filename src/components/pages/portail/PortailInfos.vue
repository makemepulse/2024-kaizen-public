<template>
  <div class="portail-infos" ref="root">
    <div class="icon-animal">
      <SpritePlayer
        :nbFrames="framesData[OrigamiIds[stepRef - 1]].nbFrames"
        :framerate="framesData[OrigamiIds[stepRef - 1]].framerate"
        :src="spriteSource"
        ref="player"
        :key="stepRef"
      />
    </div>
    <jitter-animation class="body-s o-hidden">
      <h3>[chapter 0<span>{{ stepRef }}</span>]</h3>
    </jitter-animation>
    <jitter-animation class="chapter-title o-hidden">
      <h2>{{ t(`scene-${stepRef}.title`) }}</h2>
    </jitter-animation>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, computed } from "vue";
import { useI18n } from "vue-i18n";
import { gsap } from "gsap";
import SplitText from 'gsap/SplitText';
import { OrigamiIds, framesData } from "@/services/models/OrigamiModel";
gsap.registerPlugin(SplitText);

const props = defineProps({
  step: {
    type: Number,
    required: true
  }
})

const root = ref<HTMLElement>()
const { t } = useI18n();
const stepRef = ref(1);
const animal = ref(OrigamiIds[stepRef.value]);

let splitTexts: SplitText[] = [];
let split: SplitText = null;

watch(() => props.step, async (newStep, oldStep) => {
  if (newStep === oldStep) return
  onInit()
})

const killSplit = () => {
  splitTexts.reverse().forEach(split => {
    split.revert();
  });

  splitTexts = [];
};

const initSplit = async() => {
  await nextTick();
  const title = root.value.querySelector('.chapter-title h2') as HTMLElement;
  split = new SplitText(title, {type: 'chars', charsClass: 'Letter__Parent' });
  splitTexts.push(split);
}

const onInit = async() => {
  killSplit();
  await initSplit();
  
  const $ = gsap.utils.selector(root.value as HTMLElement)
  const tlLeave = gsap.timeline()
  tlLeave
    .addLabel("leave", 0)
    .to($('.icon-animal'), {
      opacity: 0,
      scale: 0.75,
      duration: 1.5,
      ease: 'quart.out'
    }, "leave")
    .to([$('h3 span'), split.chars], {
      yPercent: -100,
      duration: 1,
      stagger: 0.05,
      ease: 'quart.inOut'
    }, "leave")

  const tlIntro = gsap.timeline()
  tlIntro
    .addLabel("start", 1)
    .add(async() => {
      stepRef.value = props.step
      killSplit();
      await initSplit();
      gsap.fromTo(['h3 span', split.chars], {
        yPercent: 100,
      }, {
        yPercent: 0,
        duration: 1,
        stagger: 0.05,
        ease: 'quart.out'
      })
    }, "start")
    .from($('.icon-animal'), {
      opacity: 0,
      scale: 0.75,
      duration: 1.5,
      ease: 'quart.out',
      clearProps: 'all'
    }, "start")
}

const spriteSource = computed(() => {
  return `/assets/images/animals/${OrigamiIds[stepRef.value - 1]}_blue`;
});
</script>

<style lang="stylus" scoped>
.portail-infos
  position absolute
  left rem(140)
  bottom rem(80)
  color var(--dark-blue)
  +mobile()
    left 50%
    transform translateX(-50%)
    text-align center
    bottom rem(52)
    display flex
    flex-direction column
    align-items center

  .icon-animal
    width rem(100)
    height auto
    margin-left rem(-28)
    +mobile()
      margin-left 0

  .body-s
    -webkit-text-stroke-width rem(0.5)
    -webkit-text-stroke-color var(--dark-blue)

    span
      display inline-block

  .chapter-title
    font-size rem(48)
    line-height 1
    font-weight 300
    margin-top rem(4)
</style>