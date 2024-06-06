<template>
    <div class="app-cursor" :class="elClass" ref="root" tabindex="0">
        <!-- <component :is="cursorComponent" :key="Cursor.state" :show="isHoldCursor || isCTACursor || isDotCursor || isWaitCursor" /> -->
        <DotCursor :show="isDefaultCursor || isWaitCursor" />
        <!-- <asyncWaitCursor :show="isWaitCursor" /> -->
        <HoldCursor :show="isHoldCursor" />
        <CTACursor :show="isCTACursor" />
    </div>

    <!-- <AppCursorHint /> -->
</template>

<script setup lang="ts">
import {
    onMounted,
    onBeforeUnmount,
    nextTick,
    computed,
    ref,
    watch,
    defineAsyncComponent,
} from "vue";
import Cursor, {
    CursorState,
    CursorTheme,
    setCursor,
    setCursorOptions,
    setCursorHolding,
    setCursorActive,
} from "@/store/modules/Cursor";
import { useAppState } from "@/services/Composition";
import useMousePosition from "@/composables/useMousePosition";
import lerp from "@/utils/Lerp";
import Viewport from '@/store/modules/Viewport';
import AppService from '@/services/AppService';
// import AppCursorHint from "@/components/blocks/Cursor/AppCursorHint.vue";
import Delay from "@/core/Delay";

import DotCursor from "@/components/blocks/Cursor/DotCursor.vue";
import HoldCursor from "@/components/blocks/Cursor/HoldCursor.vue";
import CTACursor from "@/components/blocks/Cursor/CTACursor.vue";

// const asyncDotCursor = defineAsyncComponent(
//     () => import("@/components/blocks/Cursor/DotCursor.vue")
// );

// const asyncHoldCursor = defineAsyncComponent(
//     () => import("@/components/blocks/Cursor/HoldCursor.vue")
// );

// const asyncCTACursor = defineAsyncComponent(
//     () => import("@/components/blocks/Cursor/CTACursor.vue")
// );

// const asyncWaitCursor = defineAsyncComponent(
//     () => import("@/components/blocks/Cursor/WaitCursor.vue")
// );

const props = defineProps({
    inertia: {
        type: Number,
        default: 1,
    },
});

const { state } = useAppState();

let module: any = null;
let setPosition: Function = null;

const { x: mouseX, y: mouseY } = useMousePosition();
const x = ref(mouseX.value);
const y = ref(mouseY.value);

const root = ref<HTMLElement | null>(null);

const elClass = computed(() => {
    return "app-cursor";
});

const isScene = computed(() => state.value.matches("scene"));
const isIntro = computed(() => state.value.matches("intro"));
const isConclusion = computed(() => state.value.matches("conclusion"));
const isOutro = computed(() => state.value.matches("portail") || state.value.matches("about"));
const isOrigami = computed(() => state.value.matches("origami"));
const isTransitionToPortail = computed(() => AppService.Scene?.isTransitionToPortailPlaying.value || false);


const isCTACursor = computed(() => Cursor.state === CursorState.CTA);
const isHoldCursor = computed(() => !isTransitionToPortail.value && !isOutro.value && !isConclusion.value && Cursor.state === CursorState.HOLD);
const isWaitCursor = computed(() => Cursor.state === CursorState.WAIT);
const isDefaultCursor = computed(() => isOrigami.value || Cursor.state === CursorState.DEFAULT);

// handle Cursor Theme
watch(isScene, () => {
    if (isScene.value) {
        setCursorOptions({ theme: CursorTheme.LIGHT })
    }
})

watch(isIntro, () => {
    if (isIntro.value) {
        setCursorOptions({ theme: CursorTheme.LIGHT })
    }
})

watch(isOutro, () => {
    if (isOutro.value) {
        setCursorOptions({ theme: CursorTheme.DEFAULT })
    }
})

// handle HoldCursor
const showHoldCursor = computed(() => isScene.value && !AppService.Scene?.isIntroPlaying.value && !AppService.Scene?.isOutroPlaying.value && (AppService.Scene?.canReleaseRef.value || !AppService.Scene?.isTitlePlaying.value) || false);
watch(showHoldCursor, async (value) => {
    if (value) {
        await Delay(500);
        setCursor(CursorState.HOLD)
    } else {
        setCursor(CursorState.DEFAULT)
    }
})

// handle WaitCursor
const showWaitCursor = computed(() =>
    ((isScene.value || isIntro.value) && (AppService.Scene?.isIntroPlaying.value || AppService.Scene?.isOutroPlaying.value || false)) || isConclusion.value
);
watch(showWaitCursor, (value) => {
    if (value) {
        setCursor(
            CursorState.WAIT,
            Cursor.state !== CursorState.WAIT ? { progress: 0 } : {}
        )
    }
})

const hovering = computed(() => Cursor.hover);
watch(hovering, (value) => {
    if (value) {
        setCursor(CursorState.DEFAULT)
    } else {
        setCursor(Cursor.prevState)
    }
})

const cursorComponent = computed(() => {
    switch (Cursor.state) {
        case CursorState.HOLD:
            return asyncHoldCursor;
        case CursorState.WAIT:
            return asyncWaitCursor;
        case CursorState.CTA:
            return asyncCTACursor;
        case CursorState.NONE:
            return false;
        default:
            return asyncDotCursor;
    }
});

const update = () => {
    x.value = lerp(x.value, mouseX.value, props.inertia);
    y.value = lerp(y.value, mouseY.value, props.inertia);

    setPosition({ x: x.value, y: y.value });
};

const onDown = () => {
    setCursorHolding(true);
};

const onUp = () => {
    setCursorHolding(false);
};

onMounted(async () => {
    document.body.addEventListener("mousedown", onDown);
    document.body.addEventListener("touchstart", onDown);
    document.body.addEventListener("mouseup", onUp);
    document.body.addEventListener("touchstop", onUp);

    await nextTick();

    module = await import("gsap");

    setPosition = module.default.quickSetter(root.value, "css");

    if (!Viewport.isMobile) {
        module.default.ticker.add(update);
    }

    setCursorActive(true);
});

onBeforeUnmount(async () => {
    setCursorActive(false);

    document.body.removeEventListener("mousedown", onDown);
    document.body.removeEventListener("touchstart", onDown);
    document.body.removeEventListener("mouseup", onUp);
    document.body.removeEventListener("touchstop", onUp);

    if (!Viewport.isMobile) {
        const module = await import("gsap");
        module.default.ticker.remove(update);
    }

    await nextTick();
});
</script>

<style lang="stylus" scoped>
.app-cursor
  position fixed
  top 0
  left 0
  width 0
  height @width

  display flex
  justify-content center
  align-items center

  pointer-events none

  z-index 100

  &::before,
  &::after
    // content ''
    position absolute
    width rem(64)
    height 1px
    background-color rgba(255, 0, 0, 0.5)

    top 50%
    left 50%
    margin-top @height * -0.5
    margin-left @width * -0.5

  &::after
    transform rotate(90deg)
    

  .cursor-cta, .dot-cursor
    +mobile()
      display none
</style>
