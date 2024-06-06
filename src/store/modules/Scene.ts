import { reactive } from "vue";

export const Scene = reactive({
  duration: 0,
  stepValues: [0.01, 0.33, 0.66, 1],
});

export const setSceneDuration = (duration: number) => {
  Scene.duration = duration;
};

export const setSceneStepValues = (stepValues: number[]) => {
  Scene.stepValues = stepValues;
};
