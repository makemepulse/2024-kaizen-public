

async function isLowPowerMode(video: HTMLVideoElement): Promise<boolean> {
  const Viewport = (await import("@/store/modules/Viewport")).default;
  if (Viewport.isIOS) {
    try {
      await video.play();
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        return true;
      }
    } finally {
      video = null;
    }
  }
  
  return false;
}

export default isLowPowerMode;