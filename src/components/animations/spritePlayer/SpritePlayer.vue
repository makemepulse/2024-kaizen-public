<template>
  <canvas class="sprite-canvas" ref="canvas" />
</template>

<script setup lang="ts">
import { loadImage, getImageFormat } from '@/utils/Image';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  src: {
    type: String,
    default: "",
  },
  nbFrames: {
    type: Number,
    default: 0,
  },
  framerate: {
    type: Number,
    default: 0,
  },
  autoplay: {
    type: Boolean,
    default: true,
  },
  loop: {
    type: Boolean,
    default: true,
  },
  yoyo: {
    type: Boolean,
    default: false,
  },
});

const canvas = ref();
const allFramesLoaded = ref(false);
const firstFrameLoaded = ref(false);
const isPlaying = ref(false);

let et = 0;
let time = 0;
let currentFrame = -1;
let lastFrameDrawn = -1;
let ctx: CanvasRenderingContext2D | null = null;
let size = {
  width: 0,
  height: 0,
  dpr: 1,
};
let scale = 1;
let frames: HTMLImageElement[] = [];
let loopId = 0;

const loadAllFrames = async (format: string) => {  
  const promises = [];
  for (let i = 0; i < props.nbFrames; i++) {
    const idx = i > 9 ? i.toString() : `0${i}`;
    const promise = loadImage(`${props.src}/${format}/${idx}.${format}`).then((img) => {
      frames[i] = img;
      if(i === 0) firstFrameLoaded.value = true;
    });
    promises.push(promise);
  }
  await Promise.all(promises);
  allFramesLoaded.value = true;
}

watch(firstFrameLoaded, (isLoaded) => {
  if(isLoaded) {
    onResize();
    draw(frames[0]);
  }
})

const onResize = () => {
  size.dpr = Math.min(2, window.devicePixelRatio);
  size.width = canvas.value.offsetWidth * size.dpr;
  size.height = canvas.value.offsetHeight * size.dpr;
  canvas.value.width = size.width;
  canvas.value.height = size.height;

  const ratioCanvas = size.width / size.height;
  const ratioImage = frames[0].width / frames[0].height;

  if (ratioCanvas > ratioImage) {
    scale = size.height / frames[0].height;
  } else {
    scale = size.width / frames[0].width;
  }
}

const draw = (forcedImg?: HTMLImageElement) => {
  if(!forcedImg && (currentFrame === -1 || currentFrame === lastFrameDrawn || !frames[currentFrame])) return;
  const img = forcedImg || frames[currentFrame];
  ctx.clearRect(0, 0, size.width  * size.dpr, size.height  * size.dpr);
  
  const w = img.width * scale;
  const h = img.height * scale;

  ctx.drawImage(img, size.width / 2 - w / 2, size.height / 2 - h / 2, w, h);
  lastFrameDrawn = currentFrame;
}

const tick = () => {
  if (!isPlaying.value) return; // Stop here if not playing

  const now = performance.now();
  const dt = now - et;
  et = now;
  time += Math.min(1/5, dt / 1000);
  currentFrame = Math.floor(time * props.framerate) % props.nbFrames;
  if(props.yoyo && Math.floor(time * props.framerate) % (props.nbFrames * 2) >= props.nbFrames) {
    currentFrame = props.nbFrames - currentFrame - 1;
  }
  draw();

  if (currentFrame === props.nbFrames - 1 && !props.loop) {
    isPlaying.value = false;
    return;
  }

  loopId = requestAnimationFrame(tick);
}

const init = async () => {
  ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  const format = await getImageFormat();
  await loadAllFrames(format);
}

const play = () => {
  if (!isPlaying.value) {
    isPlaying.value = true;
    et = performance.now(); // Reset elapsed time to avoid jumping frames
    tick(); // Ensure animation starts if it was paused
  }
};

const pause = () => {
  isPlaying.value = false;
};

onMounted(() => {
  if(props.autoplay) {
    play();
  }

  init();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  cancelAnimationFrame(loopId);
  window.removeEventListener('resize', onResize);
})

defineExpose({
  play,
  pause,
})
</script>

<style setup lang="stylus">
.sprite-canvas
  width 100%
  height 100%
  pointer-events none
  user-select none
</style>