<template>
  <Transition :css="false" @enter="enter" @leave="leave">
    <div class="dot-cursor" :class="[`dot-cursor--${theme}`, { holding }]" ref="root" v-if="props.show">
      <div class="inner">
        <!-- <div class="scroll-hint" :class="{ active: canScroll }">
          <div class="top">
            <svg-icon name="arrow-next" />
          </div>
          <div class="bottom">
            <svg-icon name="arrow-next" />
          </div>
        </div> -->
        <div class="center">
          <svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0.0823347 4.22134C0.0823347 4.04696 0.0704945 3.90475 0.0848718 3.76593C0.106861 3.55601 0.133077 3.35708 0.0070641 3.15732C-0.0242277 3.10822 0.0544267 2.9203 0.125467 2.88644C0.402019 2.75439 0.342819 2.52754 0.331824 2.2956C0.377493 2.26682 0.424854 2.22535 0.479826 2.20588C0.656582 2.14239 0.887465 2.14662 0.876471 1.86559C1.18685 1.6836 1.17416 1.26544 1.46086 1.06652C1.51922 1.02589 1.57842 0.968331 1.6427 0.959866C1.83721 0.934472 1.88288 0.910769 1.96745 0.717773C2.26684 0.828661 2.55861 0.878604 2.74975 0.535781C2.82671 0.553557 2.89183 0.567948 2.97556 0.58657C3.02038 0.377491 3.02968 0.104079 3.3629 0.325009C3.40772 0.242055 3.43901 0.175183 3.47792 0.113391C3.53712 0.0185854 3.58955 -0.0440551 3.72656 0.0380531C3.84919 0.111696 3.99888 0.161639 4.15365 0.051597C4.26021 -0.0245858 4.82346 0.121007 4.9258 0.212427C5.14822 0.410502 5.39855 0.513772 5.65058 0.416428C5.76898 0.473988 5.85609 0.507847 5.9339 0.556943C6.07936 0.648362 6.21637 0.754173 6.36437 0.84136C6.46247 0.89892 6.57834 0.924314 6.67644 0.981028C6.77201 1.0369 6.85405 1.11731 6.94454 1.18418C7.03588 1.2519 7.11791 1.28322 7.11791 1.45252C7.11791 1.59388 7.28282 1.74793 7.40038 1.87237C7.51455 1.99257 7.55007 2.09414 7.42152 2.22535C7.52132 2.29814 7.61097 2.36671 7.70315 2.43189C7.80548 2.50468 7.86638 2.5597 7.7725 2.70699C7.64902 2.90168 7.6431 3.10822 7.80464 3.32153C7.91712 3.47051 8.02537 3.67705 7.75897 3.85312C7.85115 3.93184 7.92896 3.99787 7.9797 4.04188C7.98731 4.16208 7.99239 4.25435 8 4.36693C7.95349 4.33815 7.91796 4.31614 7.85115 4.27382C7.8706 4.38047 7.88414 4.45665 7.90105 4.54807C7.85792 4.57008 7.80041 4.59886 7.73106 4.63442C7.75051 4.67759 7.76489 4.71906 7.78603 4.75631C7.89851 4.94677 7.94757 5.12198 7.81141 5.33953C7.66932 5.56638 7.57629 5.82541 7.4672 6.07258C7.45366 6.10305 7.45958 6.15299 7.47565 6.18346C7.53993 6.3079 7.50271 6.39424 7.36063 6.43656C7.29974 6.45434 7.238 6.49582 7.17965 6.49158C6.90479 6.47211 6.89295 6.80478 6.67644 6.8598C6.65699 6.86488 6.63077 6.9072 6.63415 6.92836C6.67559 7.21363 6.44302 7.19924 6.27726 7.27119C6.1115 7.34314 5.95842 7.44556 5.79689 7.52852C5.71908 7.5683 5.63366 7.59369 5.58292 7.64871C5.47298 7.75791 5.36388 7.86795 5.2311 8C5.17951 7.88996 5.15414 7.83748 5.12539 7.77568C5.09156 7.78669 5.05857 7.79685 5.02474 7.80785C4.96724 7.82732 4.90042 7.87811 4.85306 7.86372C4.63994 7.79685 4.42682 7.72405 4.22469 7.63009C4.08684 7.56661 3.97689 7.48958 3.82128 7.6047C3.75024 7.65718 3.6293 7.65549 3.53035 7.65549C3.23266 7.65549 2.93411 7.6521 2.63811 7.6284C2.59836 7.62501 2.54423 7.50143 2.53747 7.42948C2.51886 7.23225 2.51125 7.04687 2.23301 7.06126C2.20172 7.06295 2.1662 6.97407 2.12983 6.92328C2.09685 6.94191 2.05372 6.96645 2.01312 6.99016C1.86597 6.80393 1.74164 6.62279 1.45156 6.69812C1.38137 6.71675 1.26889 6.56353 1.17247 6.49328C1.12088 6.45518 1.06253 6.4264 0.977112 6.37561C0.996564 6.33668 1.03462 6.26134 1.07775 6.17754C0.812196 6.1022 1.02024 5.87281 0.929752 5.69505C0.858711 5.73822 0.78936 5.78054 0.695485 5.8381C0.670113 5.78478 0.603299 5.70859 0.620214 5.66711C0.721701 5.41825 0.55763 5.21764 0.451069 5.06188C0.341125 4.90021 0.331821 4.75207 0.317443 4.58786C0.301375 4.40925 0.256555 4.25773 0.0831813 4.22303L0.0823347 4.22134Z"
              fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, watch } from "vue";
import { gsap } from "gsap";

import Cursor from "@/store/modules/Cursor";

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
});

const root = ref(null);

const theme = computed(() => Cursor.options.theme);
const holding = computed(() => Cursor.holding);

const minScale = 0
const enterDelay = 0
const enter = (el: Element, onComplete: () => void) => {
  const tl = gsap.timeline({ onComplete, delay: Cursor.hover ? 0 : enterDelay })
  tl.fromTo(el, { scale: minScale }, { scale: 1.2, duration: 0.25 })
  if (Cursor.hover) {
    tl.to(el, { opacity: 0.85, duration: 0.25 });
  } else {
    tl.to(el, { scale: 1, duration: 0.25, clearProps: 'all' });
  }
}

const leave = (el: Element, onComplete: () => void) => {
  gsap.timeline({ onComplete })
    .to(el, { scale: minScale, duration: 0.5 })
}

watch(() => Cursor.hover, (hover) => {
  if (hover) {
    root.value && gsap.to(root.value, { scale: 1.2, opacity: 0.85, duration: 0.25 });
  } else {
    root.value && gsap.to(root.value, { scale: 1, opacity: 1, duration: 0.25, clearProps: "all" });
  }
});
</script>

<style lang="stylus" scoped>
.dot-cursor
  display flex
  align-items center
  justify-content center

  position absolute

  user-select none
  pointer-events none

  color $dark

  &--light
    color $light

  .inner
    display flex
    align-items center
    justify-content center

    position absolute
    full()
    inset 0
    opacity 1
    transition opacity 0.25s ease-out

  .scroll-hint
    position absolute
    top 0
    left 0
    right 0
    bottom 0
    display flex
    align-items center
    justify-content center
    pointer-events none
    z-index 1
    .top,
    .bottom
      position absolute
      width 100%
      height rem(24)
      display flex
      align-items center
      justify-content center
      opacity 0
      transition transform 0.25s ease-out, opacity 0.25s ease-out
      svg
        width rem(14)
        height rem(14)
    .top
      top 0
      transform rotate(-90deg) translateX(rem(14))
    .bottom
      bottom rem(2)
      transform rotate(90deg) translateX(rem(14))

    &.active
      .top,
      .bottom
        opacity 1
      .top
        transform rotate(-90deg)
      .bottom
        transform rotate(90deg)

  .center, .outline
    position absolute
    display flex
    align-items center
    justify-content center
    
    svg
      // opacity 0
      // transform scale(0.5)
      opacity 1
      transform scale(1)
      transition opacity 0.25s ease-out, transform 0.25s ease-out
      transform-origin center

  .outline
    svg
      opacity 0
      transform scale(0.5)

  &.visible
    .center svg
        opacity 1
        transform scale(1)
    // .outline svg
    //   opacity 1
    //   transform scale(1)

  &.holding
    .center svg
      transform scale(1.6)
    .outline svg
      transform scale(0.94)

  // &:not(.hovering)
  //   .outline svg
  //     transform scale(0)
  //     opacity 0

  > *
    flex none
</style>
