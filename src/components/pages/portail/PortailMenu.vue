<template>
    <div class="portail-menu body-s">
        <Transition name="fade" mode="out-in" appear>
            <jitter-animation class="step-title body-s o-hidden" :key="`step-title-${portailStep}`">
                {{ title }}
            </jitter-animation>
        </Transition>
        <ul>
            <li v-for="(stepId, i) in OrigamiIds" :key="i">
                <PortailMenuItem
                    :class="{ 'is-active': i === currentStep }"
                    :stepId="i"
                    :active="i === currentStep"
                    :disabled="disableLinks"
                    @click="(e) => setStep(e, i)"
                />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from "vue-i18n";

import AppService from "@/services/AppService";
import { useAppContext } from '@/services/Composition';
import { OrigamiIds, framesData } from '@/services/models/OrigamiModel';

import ArchivesManager from "@webgl/activities/Archives/ArchivesManager";
import PortailMenuItem from "@/components/pages/portail/PortailMenuItem.vue";

const portailStep = useAppContext('step');
const currentStep = ref(portailStep.value);

const { t } = useI18n();

const emit = defineEmits(['keyboardNav'])
const title = computed(() => t(`scene-${portailStep.value + 1}.title`))

const setStep = (e: PointerEvent, step: number) => {
    emit('keyboardNav', e.detail === 0);
    currentStep.value = step;
    const activeActivity = AppService.Scene.activities.active[0];
    (activeActivity as ArchivesManager).gotoArchive(step);
}

const disableLinks = computed(() => {
    const activeActivity = AppService.Scene.activities.active[0];
    return !(activeActivity as ArchivesManager).canChangeStep.value;
})

watch(portailStep, (newVal, oldVal) => {
    if(newVal !== currentStep.value) {
        currentStep.value = newVal;
    }
})
</script>

<style lang="stylus" scoped>
.portail-menu
    position absolute
    bottom rem(24)
    right 0
    left 0

    +desktop()
        top rem(20)
        bottom rem(20)
        right rem(20 + 20 + 24 + 16)

    display flex
    flex-direction column
    justify-content center
    gap rem(12)

    .step-title
        display flex
        justify-content center
        align-items center
        +desktop()
            display none

    ul
      display flex
      align-items center
      justify-content center
      gap rem(8)

      list-style none
      padding 0
      margin 0

      +desktop()
        gap rem(20)
        flex-direction column
        justify-content center
        align-items flex-end
</style>