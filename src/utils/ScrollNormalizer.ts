export type ScrollDirection = "down" | "up";

interface ScrollNormalizerOptions {
  threshold?: number;
  cooldownTime?: number; // Time in milliseconds to wait after the last scroll event before resetting.
}

export default class ScrollNormalizer {
  private callback: (direction: ScrollDirection) => void;
  private threshold: number;
  private cooldownTime: number;
  private accumulatedDelta: number;
  private lastEventTime: number;
  private isCooldownActive: boolean;

  constructor(callback: (direction: ScrollDirection) => void, options: ScrollNormalizerOptions = {}) {
    this.callback = callback;
    this.threshold = options.threshold || 100; // Default threshold for scroll intensity
    this.cooldownTime = options.cooldownTime || 750; // Default cooldown time in milliseconds
    this.accumulatedDelta = 0;
    this.lastEventTime = 0;
    this.isCooldownActive = false;
  }

  public handleScroll = (event: WheelEvent): void => {
    const now = Date.now();

    // Check if we are still within the cooldown period
    if (this.isCooldownActive && now - this.lastEventTime < this.cooldownTime) {
      return;
    }

    this.isCooldownActive = false; // Reset cooldown flag
    this.accumulatedDelta += event.deltaY;

    if (Math.abs(this.accumulatedDelta) >= this.threshold) {
      this.callback(this.accumulatedDelta > 0 ? "down" : "up");
      this.accumulatedDelta = 0; // Reset accumulatedDelta
      this.isCooldownActive = true; // Activate cooldown
      this.lastEventTime = now; // Update the time of the last event
    }
  }
}