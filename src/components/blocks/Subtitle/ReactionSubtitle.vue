<template>
  <div class="reaction-subtitles" ref="root">
    <jitter-animation>
      <h3 class="reaction-title">{{ getReactionCopy(name) }}</h3>
    </jitter-animation>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { gsap, SplitText } from "gsap/all";
import { Audio } from "@/store/modules/Audio";
import { reaction } from "./ReactionCopy";
gsap.registerPlugin(SplitText);

const root = ref<HTMLElement>(null);
let splitTexts: SplitText[] = [];
const nextBtn = document.querySelector('.next-btn');

const emit = defineEmits(["completed"]);
const name = computed(() => Audio.reactioName);
const duration = computed(() => Audio.reactionDuration);

function getReactionCopy(input: string) {
  const reactionCopy = reaction.get(input) + "!" || " ";
  return reactionCopy;
}

onMounted(() => {
  initSplit()
});

const killSplit = () => {
  splitTexts.reverse().forEach(split => {
    split.revert();
  });

  splitTexts = [];
};

const initSplit = async() => {
  killSplit();
  await nextTick();

  const title = root.value.querySelector('.reaction-title');
  const splitTitle = new SplitText(title, {type: 'chars,words', charsClass: 'Letter__Parent' });
  splitTexts.push(splitTitle);

  const durationTL = duration.value < 0.6 ? 1 : duration.value;

  const tlSplit = gsap.timeline({ onComplete: () => onComplete() })
  tlSplit
    .fromTo(splitTitle.chars, {
      yPercent: 100,
      scale: 0
    }, {
      yPercent: 0,
      scale: 1,
      stagger: 0.035,
      ease: 'quart.out'
    })
    .to(root.value, {
      opacity: 0,
      duration: 0.5,
      ease: 'quart.out'
    }, durationTL)

  if(nextBtn) {
    tlSplit.to(nextBtn, {
      opacity: 0,
      duration: 0.5,
      ease: 'quart.out'
    }, 0)
  }
};

const onComplete = () => {
  emit('completed');

  if(nextBtn) {
    gsap.to(nextBtn, {
      opacity: 1,
      duration: 0.5,
      ease: 'quart.out',
      clearProps: 'all'
    })
  }
}
</script>

<style lang="stylus" scoped>
.reaction-subtitles
  position absolute
  left 50%
  transform translateX(-50%)
  text-align center
  bottom rem(48)
  width 100%
  padding 0 rem(48)
  z-index 1

  +mobile()
    bottom 50%
    transform translateX(-50%) translateY(50%)

  .reaction-title
    font-size rem(48)
    line-height 1
    color var(--cream)
    text-transform uppercase
</style>