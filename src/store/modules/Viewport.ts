import { reactive } from "@vue/runtime-core";
import MobileDetect from "mobile-detect";

type Viewport = {
  md: MobileDetect
  windowWidth: number
  windowHeight: number
  landscape: MediaQueryList
  isMobile: boolean
  isDesktop: boolean
  isLandscape: boolean
  isIOS: boolean
  isTouch: boolean
  isSafari: boolean
}

const Viewport = reactive<Viewport>({
  md: null,
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  landscape: null,
  isMobile: false,
  isDesktop: false,
  isLandscape: false,
  isIOS: false,
  isTouch: "ontouchstart" in window,
  isSafari: false,
}) as Viewport;
export default Viewport;

Viewport.md = new MobileDetect(window.navigator.userAgent);
Viewport.landscape = window.matchMedia("(orientation: landscape)");
Viewport.isMobile = isMobile();
Viewport.isDesktop = isDesktop();
Viewport.isLandscape = isLandscape();
Viewport.isIOS = isIOS();
Viewport.isTouch = isTouch();
Viewport.isSafari = isSafari();

function isMobile(){
  return Viewport.md.mobile() !== null;
}

function isDesktop(){
  return Viewport.windowWidth >= 1050;
}

function isLandscape(){
  return Viewport.landscape.matches;
}

function isTouch(){
  return "ontouchstart" in window;
}

function isIOS() {
  return [
    "iPad Simulator",
    "iPhone Simulator",
    "iPod Simulator",
    "iPad",
    "iPhone",
    "iPod"
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function isSafari() {
  const ua = window.navigator.userAgent;
  return /(iPhone|iPod|iPad).*AppleWebKit/i.test(ua) || /^((?!chrome|android).)*safari/i.test(ua);
}

function onResize(){
  Viewport.windowWidth = window.innerWidth;
  Viewport.windowHeight = window.innerHeight;
  Viewport.isMobile = isMobile();
  Viewport.isDesktop = isDesktop();
  Viewport.isLandscape = isLandscape();

  calculateVH();
}

const calculateVH = () => {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
};

export function disposeViewport(): void {
  window.removeEventListener("resize", onResize);
  Viewport.landscape.removeEventListener("change", onResize);
}

window.addEventListener("resize", onResize);
Viewport.landscape.addEventListener("change", onResize);
calculateVH();

if (Viewport.isSafari) {
  document.documentElement.classList.add("is-safari");
}
