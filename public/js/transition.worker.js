

self.addEventListener('message', (event) => {
  const { imageLoadRequests, key } = event.data;

  imageLoadRequests.forEach(async ({ assetPath, layerIndex, frameIndex }) => {
    const response = await fetchRetry(assetPath);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage({
        imageBase64: reader.result,
        layerIndex,
        frameIndex,
        key,
      });
    };
    reader.readAsDataURL(blob);
  });
});

const MAX_NB_RETRY = 5;
const RETRY_DELAY_MS = 200;

async function fetchRetry(input, init = null) {
  let retryLeft = MAX_NB_RETRY;
  while (retryLeft > 0) {
    try {
      return await fetch(input, init);
    }
    catch (err) {
      await sleep(RETRY_DELAY_MS)
    }
    finally {
      retryLeft -= 1;
    }
  }
  throw new Error(`Too many retries`);
}

function sleep(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}