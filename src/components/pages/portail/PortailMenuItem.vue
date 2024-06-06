<template>
    <a
        ref="rootRef"
        href="#"
        :class="['portail-menu-item', { disabled }]"
        @click="click"
        @mouseenter="mouseenter"
        @mouseleave="mouseleave"
        @focusin="mouseenter"
        @focusout="mouseleave"
    >
        <jitter-animation class="body-s o-hidden">
            <div ref="titleRef">{{ title }}</div>
        </jitter-animation>

        <div class="icon-animal">
            <SpritePlayer :nbFrames="framesData[OrigamiIds[props.stepId]].nbFrames"
                :framerate="framesData[OrigamiIds[props.stepId]].framerate"
                :src="`/assets/images/animals/${OrigamiIds[props.stepId]}_blue`" :autoplay="false" ref="playerRef" />
        </div>
    </a>
</template>


<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue';
import { useI18n } from "vue-i18n";
import { gsap, SplitText } from "gsap/all";
import AudioManager from "@/core/audio/AudioManager";
import { useAppContext } from '@/services/Composition';
import { OrigamiIds, framesData } from '@/services/models/OrigamiModel';

import { CursorState, resetCursor, setCursor, setCursorHover } from '@/store/modules/Cursor';

gsap.registerPlugin(SplitText);

const props = defineProps<{
    stepId: number,
    active: boolean,
    disabled: boolean
}>()

const portailStep = useAppContext('step');

const { t } = useI18n();

const rootRef = ref(null)
const playerRef = ref(null)
const titleRef = ref(null)

const title = computed(() => t(`scene-${props.stepId + 1}.title`))

let tlSplit: gsap.core.Timeline = null

const initSplit = async () => {
    await nextTick();
    const splitTitle = new SplitText(titleRef.value, { type: 'chars', charsClass: 'Letter__Parent' });

    tlSplit = gsap.timeline({ paused: true })
    tlSplit
        .to(splitTitle.chars,
            {
                yPercent: -200,
                modifiers: {
                    yPercent(v) {
                        return v <= -100 ? 200 + v : v
                    },
                },
                duration: 0.75,
                stagger: 0.05,
                ease: 'quart.inOut'
            })

}

const click = () => {
    rootRef.value?.blur();
    AudioManager.playUI("kaizen_cta_alt");
}

const mouseenter = () => {
    setCursor(CursorState.DEFAULT);
    setCursorHover(true);
    AudioManager.playUI("kaizen_hover")
    playerRef.value?.play()
}

const mouseleave = () => {
    setCursorHover(false);

    if (!props.active) playerRef.value?.pause()
}

const setActive = () => {
    if (props.active) {
        playerRef.value?.play()
        // tlSplit?.play()
    } else {
        playerRef.value?.pause()
        // tlSplit?.reverse()
    }

}

watch(() => props.active, setActive)

watch(() => props.active, (active) => {
    if(!active) return

    if (portailStep.value > props.stepId) {
        tlSplit?.play()
    } else {
        tlSplit?.reverse(tlSplit.duration())
    }
})

onMounted(async () => {
    nextTick(() => {
        setActive()
    })

    await initSplit()
})
</script>

<style lang="stylus" scoped>
.portail-menu-item
    position relative
    display flex
    align-items center
    justify-content center
    width rem(48)
    height rem(24)
    opacity 0.2
    transition opacity 0.25s ease-out

    cursor var(--cursor-pointer)
    pointer-events auto

    ::before
        +mobile()
            content ''
            width rem(48)
            height @width

            position absolute
            top 50%
            left 50%

            margin-top @height * -0.5
            margin-left @width * -0.5

            background-color rgba(0, 0, 0, 0)
            border-radius 50%
            pointer-events auto

    +desktop()
        width auto
        gap rem(16)
        justify-content flex-end

    &:focus,
    &.is-active,
    &.is-active.disabled,
    &:hover
        opacity 1

    &.disabled
        pointer-events none
        opacity 0.2

    &:focus
        outline none

    .body-s
        display none
        +desktop()
            display block

    .icon-animal
        position absolute
        width rem(100)
        height auto
        flex none
        +desktop()
            left 100%
            margin-left rem(-20)

        +mobile()
            pointer-events none
</style>