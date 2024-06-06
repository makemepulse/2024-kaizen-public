import { reactive, toRefs, onMounted, onUnmounted } from "vue";
// import { gsap, ScrollTrigger } from "gsap/all";

// gsap.registerPlugin(ScrollTrigger);

export default function useMousePosition() {
  const position = reactive({ x: 0, y: 0 });
  //   const observer = ref(null);

  function onMouseMove({ clientX, clientY }: MouseEvent) {
    position.x = clientX;
    position.y = clientY;
  }

  onMounted(() => {
    // observer.value = ScrollTrigger.observe({
    //   type: "pointer",
    //   onMove: onMouseMove,
    // });

    window.addEventListener("mousemove", onMouseMove, false);
  });

  onUnmounted(() => {
    // observer.value?.kill();

    window.removeEventListener("mousemove", onMouseMove, false);
  });

  return toRefs(position);
}
