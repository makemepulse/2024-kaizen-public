<template>
  <div class="pie-progress" ref="root" :style="style">
    <img
      :class="['cursorImg', { placeholder: showPlaceholder }]"
      src="PublicPath(assets/images/cursor/hold.png)"
      alt="hold cursor"
      @load="onImgLoad"
    />

    <svg width="0" height="0" :viewBox="`0 0 ${props.size} ${props.size}`">
      <defs>
        <mask id="mask">
          <circle class="circle-background" cx="50%" cy="50%" :r="r" />
          <circle class="circle" cx="50%" cy="50%" :r="r" />
        </mask>
        <filter id="energy">
          <feTurbulence
            id="turb"
            type="turbulence"
            numOctaves="2"
            baseFrequency="0.1"
            result="turb"
          />
          <feDisplacementMap
            xChannelSelector="R"
            yChannelSelector="G"
            in="SourceGraphic"
            in2="turb"
            result="map"
            scale="1"
          />
          <feComposite
            in="map"
            operator="arithmetic"
            k1="0"
            k2="0.5"
            k3="0.1"
            result="comp"
          />
          <feBlend mode="multiply" in="comp" result="blend" />
        </filter>
        <filter id="grain">
          <feTurbulence
            id="turb"
            type="turbulence"
            numOctaves="2"
            baseFrequency="0.1"
            result="turb"
          />
          <feDisplacementMap
            xChannelSelector="R"
            yChannelSelector="G"
            in="SourceGraphic"
            in2="turb"
            result="map"
            scale="4"
          />
          <feComposite
            in="map"
            operator="arithmetic"
            k1="1"
            k2="0.5"
            k3="0.1"
            result="comp"
          />
        </filter>
        <filter id="grainLine">
          <feTurbulence
            id="turb2"
            type="turbulence"
            numOctaves="2"
            baseFrequency="1"
            result="turb2"
          />
          <feDisplacementMap
            xChannelSelector="R"
            yChannelSelector="G"
            in="SourceGraphic"
            in2="turb2"
            result="map"
            scale="1"
          />
          <feComposite
            in="map"
            operator="arithmetic"
            k1="0"
            k2="0.5"
            k3="0.1"
            result="comp"
          />
          <feBlend mode="multiply" in="comp" result="blend" />
        </filter>
      </defs>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineExpose } from "vue";

const root = ref<SVGElement | null>(null);
const showPlaceholder = ref(true);

const props = defineProps({
  progress: { type: Number, default: 0 },
  size: { type: Number, default: 28 },
  duration: { type: Number, default: 0.08 },
});

const r = computed(() => props.size / 4);

const strokeDasharray = computed(() => {
  return Math.PI * 2 * r.value;
});

const strokeDashOffset = computed(() => {
  return strokeDasharray.value * (1 - props.progress);
});

const style = computed(() => [
  {
    "--size": props.size,
    "--stroke-dasharray": strokeDasharray.value,
    "--stroke-dashoffset": strokeDashOffset.value,
  },
]);

const onImgLoad = () => {
  showPlaceholder.value = false;
};

defineExpose({ root });
</script>

<style lang="stylus" scoped>
.pie-progress
    width: calc(var(--size) * 1px)
    height: calc(var(--size) * 1px)
    border-radius: 50%;
    transform: rotate(-90deg)
    transform-origin: center

    .cursorImg
        width: 100%
        height: 100%
        object-fit: cover
        -webkit-mask-image: url(#mask);
        mask-image: url(#mask);

    .circle, .circle-background
        fill: transparent;
        stroke: orange;
        stroke-width: calc(var(--size) * 0.5px);
        stroke-dasharray: var(--stroke-dasharray);
        stroke-dashoffset: var(--stroke-dashoffset);
        transition: stroke-dashoffset 0.1s;

    .circle-background
        stroke: green;
        stroke-opacity: 0.25;
        stroke-dashoffset: 0;

    &.light circle
        stroke: var(--light);

    &.light .placeholder
        background-color: var(--light);

    &.dark circle
        stroke: var(--dark);

    &.dark .placeholder
        background-color: var(--dark);
</style>
