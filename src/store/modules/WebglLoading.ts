import { reactive } from "vue";

type WebglLoading = {
  toLoad: number;
  loaded: number;
};

const WebglLoading = reactive<WebglLoading>({
  toLoad: 0,
  loaded: 0,
});
export default WebglLoading;

export function addToLoad(): void {
  WebglLoading.toLoad++;
}

export function setToLoad(toLoad: number): void {
  WebglLoading.toLoad = toLoad;
}

export function addLoaded(): void {
  WebglLoading.loaded++;
}
