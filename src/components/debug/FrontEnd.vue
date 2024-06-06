<template>
    <div class="debug" v-show="toggleDebug">
        <h5 class="debug__item"><u>D</u>ebug mode enabled</h5>
        <div>Debug keys : [D] for debug, [J] for jitter, [B] for blend mode</div>
        <div class="debug__item" v-if="Feature.jitter"><u>J</u>itter enabled</div>
        <div class="debug__item" v-if="Feature.blendMode"><u>B</u>lend mode enabled</div>
    </div>
</template>

<script setup lang="ts">
import Feature, { setFeatureBlendMode, setFeatureJitter } from '@/store/modules/Feature';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const toggleDebug = ref(false);

const enableDebug = (e) => {
    if (e.key === 'd') {
        toggleDebug.value = !toggleDebug.value;
    }
    if (e.key === 'j') {
        setFeatureJitter(!Feature.jitter);
    }
    if (e.key === 'b') {
        setFeatureBlendMode(!Feature.blendMode);
    }
};

onMounted(() => {
    document.addEventListener('keydown', enableDebug);
});

onBeforeUnmount(() => {
    document.removeEventListener('keydown', enableDebug);
});
</script>

<style lang="stylus" scoped>
.debug
    position fixed
    bottom 0
    left 0
    width 20vw
    z-index 1000
    padding 10px
    background rgba(0, 0, 0, 0.5)
    color white
    font-size 12px
    font-family monospace
    display flex
    flex-direction column
    gap 10px
    pointer-events none
</style>