<template>
  <Transition :css="false" mode="out-in" @enter="enter" @after-enter="onAfterEnter" @after-leave="onAfterLeave"
    @leave="leave" appear>
    <div class="hold-cursor" :class="[`step--${sceneStep}`, { holding }, { waiting }]" ref="root" v-if="props.show"
      @touchstart="onDown" @touchend="onUp" @touchcancel="onUp">
      <div class="center" ref="buttonRef">
        <div class="center wait" ref="waitRef">
          <div class="refill-progress">
            <div class="cursorImg-wrapper refill-progress__backdrop"
              :style="{ transform: `scale(${refillProgressOptions.backdrop})` }">
              <div class="preload-circle" />
              <img class="cursorImg" src="@/assets/images/cursor/hold.png" alt="" />
            </div>
            <div class="cursorImg-wrapper refill-progress__current"
              :style="{ transform: `scale(${refillProgressOptions.current})` }">
              <div class="preload-circle" />
              <img class="cursorImg" src="@/assets/images/cursor/hold.png" alt="" />
            </div>
          </div>
        </div>

        <div class="center idle">
          <div class="back cursorImg-wrapper" ref="idleBackRef">
              <div class="preload-circle" />
            <img class="cursorImg cursorImg--idle" src="@/assets/images/cursor/hold.png" alt="" />
          </div>
          <div class="front" ref="idleFrontRef">
            <div class="cursor-label body-s o-hidden">
              {{ label }}
            </div>
          </div>
        </div>

        <div class="center complete">
          <asyncLottie src="/lottie/climax.json" :autoplay="false" ref="lottie" />
        </div>
      </div>

      <div class="outline hold-touch" ref="holdTouchRef">
        <div class="inner">
          <svg class="hold-svg hold-svg--progress hold-svg-touch hold-svg-touch--progress" viewBox="0 0 122 35"
            fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="step step--1" d="M5.5 26.5C12 20.5 18.5 15.5 26.5 12" stroke="var(--primary)" stroke-width="10"
              stroke-linecap="round" stroke-linejoin="round" />
            <path class="step step--2" d="M46.5 6C51.9691 4.76756 56.5 5 59 5C61.5 5 66.5309 4.76756 72 6"
              stroke="var(--primary)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            <path class="step step--3" d="M91 12C100 15 106.5 19 113 26" stroke="var(--primary)" stroke-width="10"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg class="hold-svg hold-svg--placeholder hold-svg-touch hold-svg-touch--placeholder" viewBox="0 0 122 35"
            fill="none" xmlns="http://www.w3.org/2000/svg">
            <path stroke-opacity="0.25" d="M5.5 26.5C12 20.5 18.5 15.5 26.5 12" stroke="var(--primary)"
              stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            <path stroke-opacity="0.25" d="M46.5 6C51.9691 4.76756 56.5 5 59 5C61.5 5 66.5309 4.76756 72 6"
              stroke="var(--primary)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            <path stroke-opacity="0.25" d="M91 12C100 15 106.5 19 113 26" stroke="var(--primary)" stroke-width="10"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <div class="outline hint" ref="hintRef">
        <svg class="" viewBox="0 0 72 72">
          <text fill="var(--primary)" font-size="12" class="body-s">
            <textPath start-offset="0" textLength="80" xlink:href="#txt-top">{{ Cursor.options.hint }}</textPath>
            <textPath start-offset="0" textLength="80" xlink:href="#txt-bottom">{{ Cursor.options.hint }}</textPath>
          </text>
          <defs>
            <path d="M0,36a36,36 0 1,0 72,0a36,36 0 1,0 -72,0" id="txt-path" />
            <path id="txt-top"
              d="M64 36C64 39.677 63.2757 43.318 61.8686 46.7151C60.4615 50.1123 58.399 53.199 55.799 55.799C53.1989 58.399 50.1122 60.4615 46.7151 61.8686C43.318 63.2758 39.677 64 36 64C32.323 64 28.682 63.2758 25.2849 61.8686C21.8877 60.4615 18.801 58.399 16.201 55.799C13.601 53.199 11.5385 50.1123 10.1314 46.7151C8.72424 43.318 8 39.677 8 36L36 36H64Z"
              fill="#D9D9D9" />
            <path id="txt-bottom"
              d="M8.00001 36C8.00001 32.323 8.72425 28.682 10.1314 25.2849C11.5385 21.8877 13.601 18.801 16.201 16.201C18.8011 13.601 21.8878 11.5385 25.2849 10.1314C28.682 8.72424 32.323 8 36 8C39.677 8 43.318 8.72424 46.7151 10.1314C50.1123 11.5385 53.199 13.601 55.799 16.201C58.399 18.8011 60.4615 21.8878 61.8686 25.2849C63.2758 28.682 64 32.323 64 36L36 36L8.00001 36Z"
              fill="#D9D9D9" />
          </defs>
        </svg>
      </div>

      <div class="outline hold" ref="holdRef">
        <svg class="hold-svg hold-svg--progress hold-svg-stroke hold-svg-stroke--progress" viewBox="0 0 411 410"
          fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M114.483 363.465C93.6704 351.449 75.4287 335.452 60.799 316.386C46.1693 297.32 35.4382 275.56 29.2182 252.347C22.9983 229.134 21.4115 204.923 24.5483 181.096C27.6851 157.27 35.4841 134.295 47.5 113.483"
            stroke="var(--primary)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"
            class="step step--1" />
          <path
            d="M114.5 46.5174C135.312 34.5014 158.287 26.7024 182.114 23.5656C205.94 20.4288 230.151 22.0157 253.364 28.2356C276.577 34.4555 298.338 45.1866 317.403 59.8163C336.469 74.446 352.467 92.6878 364.483 113.5"
            stroke="var(--primary)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"
            class="step step--2" />
          <path
            d="M389 205C389 229.032 384.267 252.828 375.07 275.031C365.873 297.234 352.394 317.407 335.401 334.401C318.407 351.394 298.234 364.873 276.031 374.07C253.828 383.267 230.032 388 206 388"
            stroke="var(--primary)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"
            class="step step--3" />
        </svg>
        <svg class="hold-svg hold-svg--placeholder hold-svg-stroke hold-svg-stroke--placeholder" viewBox="0 0 411 410"
          fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M114.483 363.465C93.6704 351.449 75.4287 335.452 60.799 316.386C46.1693 297.32 35.4382 275.56 29.2182 252.347C22.9983 229.134 21.4115 204.923 24.5483 181.096C27.6851 157.27 35.4841 134.295 47.5 113.483"
            stroke="var(--primary)" stroke-opacity="0.25" stroke-width="20" stroke-linecap="round"
            stroke-linejoin="round" />
          <path
            d="M114.5 46.5174C135.312 34.5014 158.287 26.7024 182.114 23.5656C205.94 20.4288 230.151 22.0157 253.364 28.2356C276.577 34.4555 298.338 45.1866 317.403 59.8163C336.469 74.446 352.467 92.6878 364.483 113.5"
            stroke="var(--primary)" stroke-opacity="0.25" stroke-width="20" stroke-linecap="round"
            stroke-linejoin="round" />
          <path
            d="M389 205C389 229.032 384.267 252.828 375.07 275.031C365.873 297.234 352.394 317.407 335.401 334.401C318.407 351.394 298.234 364.873 276.031 374.07C253.828 383.267 230.032 388 206 388"
            stroke="var(--primary)" stroke-opacity="0.25" stroke-width="20" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>
    </div>
  </Transition>
  <template v-if="Feature.blendMode">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="energy">
          <feTurbulence id="turb" type="turbulence" numOctaves="2" baseFrequency="0.1" result="turb" />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="turb" result="map"
            scale="1" />
          <feComposite in="map" operator="arithmetic" k1="0" k2="0.5" k3="0.1" result="comp" />
          <feBlend mode="multiply" in="comp" result="blend" />
        </filter>
        <filter id="grain">
          <feTurbulence id="turb" type="turbulence" numOctaves="2" baseFrequency="0.1" result="turb" />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="turb" result="map"
            scale="4" />
          <feComposite in="map" operator="arithmetic" k1="1" k2="0.5" k3="0.1" result="comp" />
        </filter>
        <filter id="grainLine">
          <feTurbulence id="turb2" type="turbulence" numOctaves="2" baseFrequency="1" result="turb2" />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="turb2" result="map"
            scale="1" />
          <feComposite in="map" operator="arithmetic" k1="0" k2="0.5" k3="0.1" result="comp" />
          <feBlend mode="multiply" in="comp" result="blend" />
        </filter>
      </defs>
    </svg>
  </template>
</template>

<script setup lang="ts">
import {
  defineProps,
  computed,
  defineAsyncComponent,
  ref,
  watch,
  nextTick,
  onMounted,
} from "vue";
import {
  gsap,
  ScrollTrigger,
  DrawSVGPlugin,
  CustomEase,
  CustomWiggle,
} from "gsap/all";
import Cursor, { setCursorOptions } from "@/store/modules/Cursor";
import { useAppContext } from "@/services/Composition";
import { useI18n } from "vue-i18n";
import Viewport from "@/store/modules/Viewport";
import AppService from "@/services/AppService";
import { Scene } from "@/store/modules/Scene";
import Feature from "@/store/modules/Feature";
import lerp from "@/utils/Lerp";

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
});

const asyncLottie = defineAsyncComponent(() =>
  import("../../animations/LottieAnimation.vue")
);

const { t } = useI18n();

const HOLD_THRESHOLD = 1000;// define the hold threshold in ms
const FAKE_PROGRESS_DURATION = 10
const REFILL_PROGRESS_MIN_SCALE = 15 / 48; // define the min scale of the refill progress

let holdHintTimeout: number
const HOLD_HINT_DURATION = 10000

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, CustomWiggle, CustomEase);

const sceneStep = useAppContext("sceneStep");
const sceneId = useAppContext("sceneId");

const root = ref(null);

const theme = computed(() => Cursor.options.theme);
const progress = computed(() => Cursor.options.progress);

const holdProgress = computed(() => AppService.Scene.holdRef.value);

const holding = ref(false);
const lottie = ref(null);
const canRelease = computed(() => AppService.Scene.canReleaseRef.value);
const waiting = ref(!canRelease.value)
const playedHoldMax = ref(false);

const buttonRef = ref(null);
const waitRef = ref(null);
const idleBackRef = ref(null);
const idleFrontRef = ref(null);
const holdRef = ref(null);
const holdTouchRef = ref(null);
const hintRef = ref(null);

const holdOnce = ref(false)
const countClick = ref(0)
const idleState = ref(false)
const showHoldHint = computed(() => {
  return (!holdOnce.value && countClick.value > 5) || idleState.value
})

const label = computed(() => {
  return sceneId.value ? t(`scene-${sceneId.value}.cta_hold`) : t("global.cta_hold");
});

const refillProgressOptions = ref({
  backdrop: 1,
  current: 1,
});

const calculateIncrementalTimes = (cumulativeSteps: number[]) => {
  let incrementalTimes = [cumulativeSteps[0] * Scene.duration];
  for (let i = 1; i < cumulativeSteps.length; i++) {
    const incrementalTime =
      (cumulativeSteps[i] - cumulativeSteps[i - 1]) * Scene.duration;
    incrementalTimes.push(incrementalTime);
  }
  return incrementalTimes;
};

let timelines: gsap.core.Timeline[] = [];
let tlHold: gsap.core.Timeline = null;
let tlHoldMax: gsap.core.Timeline = null;

const tweening = ref(false);

const killTimelines = () => {
  timelines.forEach((tl) => {
    tl.revert().kill();
  });
};

const init = () => {
  document.body.addEventListener("mousedown", onDown);
  document.body.addEventListener("mouseup", onUp);
  document.body.addEventListener("keydown", onKeyDown);
  document.body.addEventListener("keyup", onKeyUp);

  CustomWiggle.create("wiggle", { wiggles: 10, type: "easeOut" });
  // add turbulence animation
  gsap.to("#turb", {
    attr: { baseFrequency: 0.2 },
    duration: 6,
    repeat: -1,
    ease: "linear",
  });
};

const destroy = (el: Element) => {
  gsap.killTweensOf(el.querySelectorAll(".center"));
  gsap.killTweensOf(el.querySelectorAll(".outline"));
  gsap.set(el.querySelectorAll(".hold-svg"), { clearProps: "all" })

  document.body.removeEventListener("mousedown", onDown);
  document.body.removeEventListener("mouseup", onUp);
  document.body.removeEventListener("keydown", onKeyDown);
  document.body.removeEventListener("keyup", onKeyUp);

  clearTimeout(holdHintTimeout)

  gsap.ticker.remove(update);

  cursorDataRef.value = resetCursorData();
}

const userPlay = (onlyClear = false) => {
  idleState.value = false
  clearTimeout(holdHintTimeout)
  if(!onlyClear) holdHintTimeout = setTimeout(userIdle, HOLD_HINT_DURATION)
}
const userIdle = () => {
  idleState.value = true
  clearTimeout(holdHintTimeout)
}

const minScale = 0
const enterDelay = 0
const enter = (el: Element, onComplete: () => void) => {
  const $ = gsap.utils.selector(el);

  $(".hold-touch") && gsap.set($(".hold-touch"), { visibility: Viewport.isMobile ? "visible" : "hidden", opacity: 0 });
  $(".hold") && gsap.set($(".hold"), { visibility: !Viewport.isMobile ? "visible" : "hidden", opacity: 0 });
  $(".hint") && gsap.set($(".hint"), { opacity: 0 });

  gsap.timeline({ onComplete, delay: enterDelay })
    .fromTo(el, { scale: minScale }, { scale: 1.2, duration: 0.25 })
    .to(el, { scale: 1, duration: 0.25, clearProps: "all" });
}

const onAfterEnter = async () => {
  await nextTick(gsap.ticker.add(update))

  userPlay()
}

const leave = (el: Element, onComplete: () => void) => {
  const $ = gsap.utils.selector(el);
  const $holdSvgTouch = $(".hold-svg-touch")

  const tl = gsap.timeline({ onComplete })
    .to(el, { scale: minScale, duration: 0.5 }, Viewport.isMobile ? 0.15 : 0)

  if ($holdSvgTouch) {
    tl.to($(".hold-touch > .inner"), { opacity: 0, scale: 0.5, duration: 0.25 }, 0)
  }

}

const onAfterLeave = (el: Element) => {
  gsap.killTweensOf(el.querySelectorAll(".center"));
  gsap.killTweensOf(el.querySelectorAll(".outline"));
  gsap.set(el.querySelectorAll(".hold-touch > .inner, .hold-svg"), { clearProps: "all" })
  gsap.set(el.querySelector(".hold-touch"), { opacity: 0, rotate: -90 });
}

watch(lottie, (value) => {
  value?.lottieAnim.goToAndStop(108, true)
});

watch(root, (el, prevEl) => {
  if (!el) {
    prevEl && destroy(prevEl);
    return;
  }

  init();
  onHoldTimeline();
});

const onUpRelease = () => {
  AppService.state.send("RELEASING");
  AppService.Scene.isHolding = false;

  userPlay()

  if (!canRelease.value) {
    return;
  }

  waiting.value = AppService.Scene.wasHolding;
  holding.value = false;
};

const onHoldTimeline = () => {
  killTimelines();

  const $ = gsap.utils.selector(root.value);
  const stepValues = [...Scene.stepValues];
  if (stepValues.length === 4) stepValues.shift();
  const durationHold = calculateIncrementalTimes(stepValues);

  tlHold = gsap.timeline({
    paused: true
  });
  tlHold
    .addLabel("hold1", 0)
    .fromTo(
      $(".hold-svg--progress .step--1"),
      {
        drawSVG: "0%",
      },
      {
        drawSVG: "100%",
        duration: durationHold[0],
        ease: "linear", // "quart.inOut",
      },
      "hold1"
    )
    .to(
      $(".wait .refill-progress"),
      {
        x: "+=1",
        y: "+=1",
        ease: "wiggle",
        duration: 1,
        clearProps: "all",
      },
      "hold1"
    )
    .addLabel("hold2")
    .fromTo(
      $(".hold-svg--progress .step--2"),
      {
        drawSVG: "0%",
      },
      {
        drawSVG: "100%",
        duration: durationHold[1],
        ease: "linear", // "quart.inOut",
      },
      "hold2"
    )
    .to(
      "#turb",
      {
        attr: { baseFrequency: 0.4 },
        duration: 4,
        ease: "linear"
      },
      "hold2"
    )
    .to(
      $(".wait .refill-progress"),
      {
        x: "+=1",
        y: "+=1",
        ease: "wiggle",
        duration: 1,
        clearProps: "all",
      },
      "hold2"
    )
    // .to(
    //   $(".refill-progress"),
    //   {
    //     scale: 1.5,
    //     duration: 0.5,
    //     ease: "linear", // "quart.inOut",
    //   },
    //   "hold2"
    // )
    // .to(
    //   $(".refill-progress"),
    //   {
    //     scale: 1,
    //     duration: 0.5,
    //     ease: "linear", // "quart.inOut",
    //   },
    //   "hold2+=0.5"
    // )
    .addLabel("hold3")
    .fromTo(
      $(".hold-svg--progress .step--3"),
      {
        drawSVG: "0%",
      },
      {
        drawSVG: "100%",
        duration: durationHold[2],
        ease: "linear", // "quart.inOut",
      },
      "hold3"
    )
    .to(
      $(".refill-progress"),
      {
        x: "+=1",
        y: "+=1",
        ease: "wiggle",
        duration: 1,
        clearProps: "all",
      },
      "hold3"
    )
    // .to(
    //   $(".refill-progress"),
    //   {
    //     scale: 1.5,
    //     duration: 0.5,
    //     ease: "linear", // "quart.inOut",
    //   },
    //   "hold3"
    // )
    // .to(
    //   $(".refill-progress"),
    //   {
    //     scale: 1,
    //     duration: 0.5,
    //     ease: "linear", // "quart.inOut",
    //   },
    //   "hold3+=0.5"
    // )
    .to(
      $(".hold-svg-stroke"),
      {
        rotation: 180,
        duration: Scene.duration,
        ease: "linear", // "power1.in",
      },
      0
    )

  tlHoldMax = gsap.timeline({
    paused: true
  });
  tlHoldMax
    .to(
      $(".hold-touch > .inner"),
      {
        rotate: 360,
        duration: 1.5,
        ease: "quart.out",
      },
      "0"
    )
    .to(
      $(".hold-svg-stroke"),
      {
        scale: 1.4,
        duration: 0.5,
        ease: "quart.out",
      },
      "0"
    )
    .to(
      $(".hold-svg-stroke"),
      {
        scale: 1,
        duration: 0.25,
        ease: "quart.out",
      },
      "1"
    )
    .add(() => {
      if (holding.value) {
        lottie.value?.lottieAnim.goToAndPlay(0, true);
      }
    }, "0")
    .to(
      $(".idle, .wait .refill-progress"),
      {
        scale: 0,
        duration: 0.2,
        ease: "quart.out",
      },
      "0"
    )
    .to(
      $(".idle, .wait .refill-progress"),
      {
        scale: 1,
        duration: 0.25,
        ease: "quart.out",
      },
      "2"
    );

  timelines.push(tlHold, tlHoldMax);
};

let startHoldTime = 0;
const onDown = (e: MouseEvent | KeyboardEvent | TouchEvent, isKeyboard = false) => {
  e.preventDefault();
  const target = isKeyboard ? null : (e as MouseEvent).target;
  const isCanvas = target && (target as Element).tagName === "CANVAS";
  isUp.value = false;
  if (Viewport.isMobile && !e.touches) return
  if (!Viewport.isMobile && (!isCanvas && !isKeyboard)) return;

  userPlay(true)

  countClick.value++

  const $ = gsap.utils.selector(root.value);

  AppService.state.send("HOLDING");
  AppService.Scene.isHolding = true;
  holding.value = true;

  startHoldTime = performance.now();

  lottie.value?.lottieAnim.goToAndStop(108, true)

  if (!canRelease.value) {
    return;
  }

  playedHoldMax.value = false
};

const isUp = ref(true);
const onUp = () => {
  isUp.value = true;

  onUpRelease();
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== " " || !isUp.value) return;
  onDown(e, true);
}

const onKeyUp = (e: KeyboardEvent) => {
  if (e.key !== " " || isUp.value) return;
  onUp();
}

const resetCursorData = () => {
  return {
    idle: {
      back: { scale: 1 },
      front: { opacity: 1, scale: 1 },
    },
    wait: {
      scale: 1,
    },
    hold: {
      opacity: 0,
      scale: 1,
      rotation: 0,
    },
    holdTouch: {
      opacity: 0,
      scale: 1,
      rotation: 90,
    },
  }
}

const cursorDataRef = ref(resetCursorData());
let canShowHoldHint = true
const update = () => {
  if (!props.show || !root.value) {
    return
  }
  const t = 0.075;
  const minScale = 30 / 48
  const cursorData = cursorDataRef.value;
  if (!isUp.value) {
    const currentTime = performance.now();
    const deltaTime = currentTime - startHoldTime;
    // const p = gsap.utils.clamp(0, 1, deltaTime / HOLD_THRESHOLD);
    canShowHoldHint = deltaTime <= HOLD_THRESHOLD
    if (!holdOnce.value && !canShowHoldHint) {
      holdOnce.value = true
    }
    cursorData.idle.back.scale = lerp(cursorData.idle.back.scale, 0, t);
    cursorData.idle.front = {
      opacity: lerp(cursorData.idle.front.opacity, 0, t),
      scale: lerp(cursorData.idle.front.scale, 0, t),
    };
    cursorData.wait.scale = lerp(cursorData.wait.scale, Viewport.isMobile ? 2 : minScale, t);
    cursorData.hold = {
      opacity: lerp(cursorData.hold.opacity, 1, t),
      scale: lerp(cursorData.hold.scale, Cursor.options.hint ? 96 / 72 : 1, t),
      rotation: lerp(cursorData.hold.rotation, 90, t),
    };
    cursorData.holdTouch = {
      opacity: lerp(cursorData.holdTouch.opacity, 1, t),
      scale: lerp(cursorData.holdTouch.scale, 1, t),
      rotation: lerp(cursorData.holdTouch.rotation, 0, t),
    };
  } else {
    cursorData.idle.back.scale = lerp(cursorData.idle.back.scale, (canShowHoldHint || canRelease.value) ? 1 : minScale, t);
    cursorData.idle.front = {
      opacity: lerp(cursorData.idle.front.opacity, (canShowHoldHint || canRelease.value) ? 1 : 0, t),
      scale: lerp(cursorData.idle.front.scale, (canShowHoldHint || canRelease.value) ? 1 : 0, t)
    }
    cursorData.wait.scale = lerp(cursorData.wait.scale, 1, t);
    if (holdProgress.value > 0.01) {
      cursorData.hold = { opacity: lerp(cursorData.hold.opacity, 1, t), scale: lerp(cursorData.hold.scale, Cursor.options.hint ? 96 / 72 : 1, t), rotation: lerp(cursorData.hold.rotation, 90, t) };
      cursorData.holdTouch = {
        opacity: lerp(cursorData.holdTouch.opacity, 1, t),
        scale: lerp(cursorData.holdTouch.scale, 1, t),
        rotation: lerp(cursorData.holdTouch.rotation, 0, t),
      };
    } else {
      cursorData.hold = { opacity: lerp(cursorData.hold.opacity, 0, t), scale: lerp(cursorData.hold.scale, Cursor.options.hint ? 96 / 72 : 1, t), rotation: lerp(cursorData.hold.rotation, -270, t) };
      cursorData.holdTouch = {
        opacity: lerp(cursorData.holdTouch.opacity, 0, t),
        scale: lerp(cursorData.holdTouch.scale, 1, t),
        rotation: lerp(cursorData.holdTouch.rotation, holdProgress.value >= 0.95 ? 90 : -90, t),
      };
    }
  }

  if (!tweening.value) {
    idleBackRef.value && gsap.set(idleBackRef.value, cursorData.idle.back);
    idleFrontRef.value && gsap.set(idleFrontRef.value, cursorData.idle.front);
    waitRef.value && gsap.set(waitRef.value, cursorData.wait);
    holdRef.value && gsap.set(holdRef.value, cursorData.hold);
    holdTouchRef.value && gsap.set(holdTouchRef.value, cursorData.holdTouch);
  }

  cursorDataRef.value = cursorData;

  const p = REFILL_PROGRESS_MIN_SCALE + (1 - holdProgress.value) * REFILL_PROGRESS_MIN_SCALE;
  refillProgressOptions.value = {
    backdrop: lerp(refillProgressOptions.value.backdrop, !isUp.value ? p : 1, 0.1),
    current: lerp(refillProgressOptions.value.current, waiting.value ? p + progress.value * p : holding.value ? p : 1, 0.1),
  }

  tlHold.progress(holdProgress.value);

  if (playedHoldMax.value || holdProgress.value < 1) return;

  tlHoldMax.progress(0);
  tlHoldMax.play();
  playedHoldMax.value = true;
};

watch(AppService.Scene.canReleaseRef, (canRelease) => {
  const $ = gsap.utils.selector(root.value);
  if (canRelease) {
    // if can hold, resume progress animation
    const obj = { val: Cursor.options.progress }
    gsap.timeline({
      onComplete: () => {
        waiting.value = false;
        if (isUp.value) {
          holding.value = false;
        }
      }
    })
      .to(obj, {
        val: 1, duration: 0.5, ease: 'quart.out', onUpdate: () => {
          setCursorOptions({ progress: obj.val });
        }
      })
  } else {
    waiting.value = true;

    refillProgressOptions.value = { backdrop: 1, current: 1 };

    // if cannot hold, fake animate progress until it can hold
    const obj = { val: 0 }
    gsap.timeline()
      .fromTo(obj, { val: 0 }, {
        val: 0.66, duration: FAKE_PROGRESS_DURATION, ease: 'quart.out', onUpdate: () => {
          if (AppService.Scene?.isIntroPlaying.value || AppService.Scene?.isOutroPlaying.value || AppService.Scene.canReleaseRef.value) return;
          setCursorOptions({ progress: obj.val });
        }
      })
  }
});

// const handleSoundBtn = (value: boolean) => {
//   if (value) {
//     gsap.to(".ui-sound-btn", {
//       opacity: 0,
//       duration: 0.5,
//       ease: "quart.out",
//     });
//   } else {
//     gsap.to(".ui-sound-btn", {
//       opacity: 1,
//       duration: 0.5,
//       ease: "quart.out",
//       clearProps: "all",
//     });
//   }
// }

// watch(holding, handleSoundBtn);

watch(isUp, (value) => {
  if (buttonRef.value && value) {
    gsap.timeline()
      .to(buttonRef.value, { duration: 0.25, scale: 1.2 })
      .to(buttonRef.value, { duration: 0.25, scale: 1 });
  }
});

watch(showHoldHint, (show) => {
  setCursorOptions({ hint: show ? t("global.hint_hold") : "" })
  hintRef.value && gsap.fromTo(hintRef.value,
    { opacity: show ? 0 : 1, rotation: show ? 30 : 0 },
    { opacity: show ? 1 : 0, rotation: show ? 0 : 30, duration: 0.5, ease: "quart.out" })
}, { immediate: true });

watch(sceneId, () => {
  root.value && onHoldTimeline();
});
</script>

<style lang="stylus" scoped>
.cursor-label
  font-size rem(10)
  font-weight 300
  font-style normal
  -webkit-text-stroke-color var(--dark-blue)
  -webkit-text-stroke-width rem(0.5)

.lottie-animation
  position absolute
  inset 0
  full()

.cursorImg-wrapper
  full()

  img
    full()
    object-fit cover

.hold-svg-stroke--progress, .hold-svg-stroke--placeholder,
.hold-svg-touch--progress, .hold-svg-touch--placeholder
  transition opacity 0.5s $easeQuartOut

  html:not(.is-safari) &
    filter url(#energy)

.refill-progress
  width rem(48)
  height @width
  position absolute

  top 50%
  left 50%
  margin-top (@height / -2)
  margin-left (@width / -2)

  display flex
  align-items center
  justify-content center
  overflow hidden
  border-radius 50%
  // border 1px solid #000

  // .refill-progress__backdrop, .refill-progress__current
  &__backdrop, &__current
    position absolute
    inset 0
    border-radius 50%

  &__backdrop
    opacity 0.5
    // background-color blue

  // &__current
  //   opacity 0.5
  //   background-color yellow

.center, .outline
  position absolute
  top 50%
  left 50%

  border-radius 50%

.center
  width rem(48)
  height @width

  margin-left (@width / -2)
  margin-top (@height / -2)

.outline
  width rem(72)
  height @width

  margin-left (@width / -2)
  margin-top (@height / -2)

.outline.hint
  width rem(72)
  height @width

  margin-left (@width / -2)
  margin-top (@height / -2)

  .body-s
    font-size rem(10)

  svg
    transform rotate(6deg)
    animation goRound 10s infinite linear

@keyframes goRound {
  0% {
    transform rotate(0deg);
  }
  100% {
    transform rotate(-360deg);
  }
}

.outline.hold svg
  position absolute
  inset 0
  full()
  overflow visible

  .step
    html:not(.is-safari) &
      filter url(#grainLine)

.outline.hold-touch
  width rem(118)
  height rem(32)

  margin-left (@width / -2)
  margin-top (@height / -2)

  top -50%

  transform-origin: 50% 260%;

  .inner
    position absolute
    inset 0
    transform-origin: 50% 260%;

  svg
    position absolute
    width 100%

    // .step
    //   filter url(#grainLine)

.hold-cursor
  --primary var(--light)
  display flex
  align-items center
  justify-content center

  width rem(64)
  height @width

  position absolute
  top 50%
  left 50%
  margin-top (@height / -2)
  margin-left (@width / -2)

  color $dark-blue

  user-select none
  pointer-events none

  .cursorImg 
    +mobile()
      position relative
      z-index 1
  .preload-circle
    full()
    width 80%
    height 80%
    left 10%
    top 10%
    position absolute
    background $cream
    border-radius 50%
    display none
    +mobile()
      display block

  +mobile()
    position fixed
    bottom rem(96)
    left 50%
    right auto
    top auto

    user-select auto

    &::before
      content ""
      position absolute
      inset 0
      border-radius 50%
      pointer-events auto

  .idle
    .back, .front
      position absolute
      inset 0
      full()
      border-radius 50%

    .front
      display flex
      align-items center
      justify-content center

    // .back
    //   background-color red
</style>