import { reactive } from "vue";

const Feature = reactive({
  jitter: true,
  blendMode: true,
});

export default Feature;

export function setFeatureJitter(enable: boolean) {
  Feature.jitter = enable;
}

export function setFeatureBlendMode(enable: boolean) {
  Feature.blendMode = enable;
}
