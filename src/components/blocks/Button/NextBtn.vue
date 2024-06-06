<template>
  <button
    class="next-btn"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
    @click="onClick"
  >
    <div class="next-btn--container" ref="root" :class="{ holding: isHolding }">
      <div class="next-btn--text o-hidden">
        <h3>
          {{
            portailReached
              ? t("scene.go_back")
              : sceneId + 1 >= 5
              ? t("scene.outro")
              : t("scene.cta_next")
          }}
        </h3>
        <h3>
          {{
            portailReached
              ? t("scene.go_back")
              : sceneId + 1 >= 5
              ? t("scene.outro")
              : t("scene.cta_next")
          }}
        </h3>
      </div>
      <div class="circle" :class="{ hovered: isHovered }">
        <img
          class="circle-bg"
          src="@/assets/images/cursor/hold.png"
          alt="bg next btn"
        />

        <div class="icon-wrapper">
          <Transition
            :css="false"
            mode="out-in"
            @enter="enterIcon"
            @leave="leaveIcon"
          >
            <div v-if="isHovered" class="morph-wrapper" :key="sceneId">
              <SpritePlayer v-bind="spritePlayerProps" />
            </div>
            <div v-else class="arrow-wrapper" key="arrow">
              <svg-icon name="arrow-next" />
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { gsap, SplitText } from "gsap/all";
import AppService from "@/services/AppService";
import AudioManager from "@/core/audio/AudioManager";
import { useAppContext } from "@/services/Composition";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { setCursorHover } from "@/store/modules/Cursor";
import { framesData, OrigamiIds } from "@/services/models/OrigamiModel";
import SpritePlayer from "@/components/animations/spritePlayer/SpritePlayer.vue";

gsap.registerPlugin(SplitText);

const root = ref<HTMLElement | null>(null);
const emit = defineEmits(["click"]);
const sceneId = useAppContext("sceneId");
const portailReached = useAppContext("hasReachedPortail");
const isHolding = useAppContext("isHolding");

const { t } = useI18n();
const isClicked = ref(false);
const isHovered = ref(false);

const enterTl = ref<gsap.core.Timeline>(null);
const leaveTl = ref<gsap.core.Timeline>(null);
const enterTlPlaying = ref(false);
const leaveTlPlaying = ref(false);
const enterTlWaiting = ref(false);
const leaveTlWaiting = ref(false);

const spritePlayerProps = computed(() => {
  const morphId:
    | "all"
    | "papillon-carpe"
    | "carpe-grenouille"
    | "grenouille-grue" =
    sceneId.value >= 4 || portailReached.value
      ? "all"
      : `${OrigamiIds[sceneId.value - 1]}-${OrigamiIds[sceneId.value]}`;
  return {
    nbFrames: framesData[morphId].nbFrames,
    framerate: framesData[morphId].framerate,
    src: `/assets/images/morph/${morphId}`,
    autoplay: true,
    yoyo: true,
  };
});

let splitTexts: SplitText[] = [];
const killSplit = () => {
  splitTexts.reverse().forEach((split) => {
    split.revert();
  });

  splitTexts = [];
};

const initSplit = async () => {
  await nextTick();
  const title = root.value.querySelector(".next-btn--text h3");
  const splitTitle = new SplitText(title, {
    type: "chars",
    charsClass: "Letter__Parent",
  });
  const instruction = root.value.querySelector(".next-btn--text h3:last-child");
  const splitInstruction = new SplitText(instruction, {
    type: "chars",
    charsClass: "Letter__Parent",
  });
  splitTexts.push(splitTitle, splitInstruction);

  leaveTl.value = gsap
    .timeline({
      paused: true,
      onStart: () => {
        leaveTlPlaying.value = true;
        leaveTlWaiting.value = false;
      },
      onComplete: () => {
        leaveTlPlaying.value = false;
      },
    })
    .fromTo(
      splitTitle.chars,
      {
        yPercent: 100,
      },
      {
        yPercent: 0,
        duration: 1,
        stagger: 0.05,
        ease: "quart.inOut",
      }
    )
    .to(
      splitInstruction.chars,
      {
        yPercent: -200,
        duration: 0.75,
        stagger: 0.025,
        ease: "quart.inOut",
      },
      "<"
    );

  enterTl.value = gsap
    .timeline({
      paused: true,
      onStart: () => {
        enterTlPlaying.value = true;
        enterTlWaiting.value = false;
      },
      onComplete: () => {
        enterTlPlaying.value = false;
      },
    })
    .fromTo(
      splitTitle.chars,
      {
        yPercent: 0,
      },
      {
        yPercent: -100,
        duration: 1,
        stagger: 0.05,
        ease: "quart.inOut",
      }
    )
    .fromTo(
      splitInstruction.chars,
      {
        yPercent: 0,
      },
      {
        yPercent: -100,
        duration: 1,
        stagger: 0.05,
        ease: "quart.inOut",
      },
      "<"
    );

  gsap.fromTo(
    splitTitle.chars,
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 0.05,
      stagger: 0.05,
      ease: "quart.inOut",
    }
  );
};

onMounted(() => {
  onInit();

  initSplit();
});

const onInit = () => {
  const $ = gsap.utils.selector(root.value);
  gsap.set([$(".circle"), $(".circle-bg")], { clearProps: "all" });

  const tl = gsap.timeline();
  tl.from($(".circle"), {
    scale: 0,
    duration: 1,
    ease: "quart.out",
    clearProps: "all",
  });
};

const onEnter = () => {
  isHovered.value = true;
  setCursorHover(true);
  AudioManager.playUI("kaizen_hover");

  if (leaveTlPlaying.value) {
    enterTlWaiting.value = true;
  } else if (!enterTlPlaying.value) {
    enterTl.value.restart();
  }
};

const onLeave = () => {
  isHovered.value = false;
  setCursorHover(false);

  if (enterTlPlaying.value) {
    leaveTlWaiting.value = true;
  } else if (!leaveTlPlaying.value) {
    leaveTl.value.restart();
  }
};

watch(enterTlPlaying, (val) => {
  if (!val && leaveTlWaiting.value && !leaveTlPlaying.value) {
    leaveTl.value.restart();
  }
});

watch(leaveTlPlaying, (val) => {
  if (!val && enterTlWaiting.value && !enterTlPlaying.value) {
    enterTl.value.restart();
  }
});

const onClick = () => {
  emit("click");
  isClicked.value = true;
  AudioManager.playUI("kaizen_cta");
};

const enterIcon = (el: Element, onComplete: () => void) => {
  const isArrow = el.classList.contains("arrow-wrapper");
  if (isArrow) {
    gsap.fromTo(
      el,
      { xPercent: -50, opacity: 0, scaleX: 2 },
      {
        xPercent: 0,
        opacity: 1,
        scaleX: 1,
        duration: 0.25,
        ease: "quart.out",
        onComplete,
      }
    );
  } else {
    gsap.fromTo(
      el,
      { scale: 0 },
      { scale: 1, duration: 0.15, ease: "quart.out", onComplete }
    );
  }
};

const leaveIcon = (el: Element, onComplete: () => void) => {
  const isArrow = el.classList.contains("arrow-wrapper");
  if (isArrow) {
    gsap.to(el, {
      xPercent: 50,
      opacity: 0,
      scaleX: 0.6,
      duration: 0.35,
      ease: "quart.out",
      onComplete,
    });
  } else {
    gsap.to(el, { scale: 0, duration: 0.25, ease: "quart.out", onComplete });
  }
};
</script>

<style lang="stylus" scoped>
.next-btn
  position fixed
  left rem(24)
  right rem(24)
  display flex
  align-items center
  justify-content center
  text-align center
  top rem(24)
  pointer-events auto
  z-index 9
  +mobile()
    top rem(12)

  &--container
    display flex
    align-items center
    gap rem(16)
    transition opacity 0.5s $easeQuartOut 0.5s
    &.holding
      opacity 0
      transition opacity 0.5s $easeQuartOut

  &--text
    height rem(20)

    h3
      font-size rem(20)
      font-weight 300
      line-height 1
      text-align right

  .circle
    position relative
    transition transform .25s ease-out
    &.hovered
      transform scale(1.1)

    svg path
      transition fill .25s ease-out, stroke .25s ease-out

    .circle-bg
      width rem(40)
      height auto

  .icon-wrapper
    position absolute
    inset 0
    width rem(40)
    height rem(40)
    display flex
    justify-content center
    align-items center
    overflow hidden

    .morph-wrapper, .arrow-wrapper
      position absolute
      inset 0
      width 100%
      height 100%
      display flex
      justify-content center
      align-items center

    .morph-wrapper
      .sprite-canvas
        width 150%
        height auto

    .arrow-wrapper
      svg
        width rem(14)
        :deep(path)
          fill $dark

  .circle-animal
    position absolute
    inset 12%
    width 75%
    height 75%
    aspect-ratio 1

    canvas
      position absolute
      inset 0
      full()

      &:last-child
        opacity 0

    &.show-animal-colored canvas:last-child
      opacity 1


  .circle-icon
    position absolute
    inset 0
    width 100%
    height rem(40)
    display flex
    justify-content center
    align-items center
</style>
