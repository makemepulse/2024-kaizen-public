<template>
    <Transition :css="false" @enter="enter" @leave="leave">
        <div class="app-cursor-hint" ref="root" v-if="hint">
            <jitter-animation>
                <p class="subtitle-p fake-bold body-s">{{ label }}</p>
            </jitter-animation>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { gsap, SplitText } from "gsap/all";
import { Audio } from "@/store/modules/Audio";
import Cursor from "@/store/modules/Cursor";
gsap.registerPlugin(SplitText);

const root = ref<HTMLElement>(null);
let splitTexts: SplitText[] = [];

const isReaction = computed(() => Audio.showReaction);
const hint = computed(() => !isReaction.value && Cursor.options.hint);
const label = computed(() => Cursor.options.hint);

const killSplit = () => {
    splitTexts.reverse().forEach(split => {
        split.revert();
    });

    splitTexts = [];
};

const enter = (el: Element, onComplete: () => void) => {
    killSplit();

    const title = el.querySelector('.subtitle-p');
    const splitTitle = new SplitText(title, { type: 'chars,words', charsClass: 'Letter__Parent' });
    splitTexts.push(splitTitle);

    const durationTL = 1;

    const tlSplit = gsap.timeline({ onComplete })
    tlSplit
        .fromTo(splitTitle.chars, {
            yPercent: -100,
            scale: 0
        }, {
            yPercent: 0,
            scale: 1,
            stagger: 0.035,
            ease: 'quart.out'
        })
};

const leave = (el: Element, onComplete: () => void) => {
    gsap.timeline({ onComplete })
        .to(el, {
            opacity: 0,
            duration: 0.5,
            ease: 'quart.out',
        })
}
</script>

<style lang="stylus" scoped>
.app-cursor-hint
    position fixed
    left rem(24)
    right rem(24)
    display flex
    align-items center
    justify-content center
    text-align center
    top rem(24)

    z-index 100

    +mobile()
        display none
  </style>