import gsap from "gsap";
import { vec3 } from "gl-matrix";
import Camera from "nanogl-camera";

export function cameraShake(camera: Camera, duration = 0.5, intensity = 0.05) {
  const cam = camera;
  
  const tl = gsap.timeline();
    
  const params = { transformProgress: 0 };
    
  const originalPosition = cam._parent.position;
    
  const randomOffset = Math.random();
    
  tl.to(params, {
    transformProgress: 1,
    duration: duration,
    ease: "power2.inOut",
    onUpdate: () => {
      cam._parent.position[0] = originalPosition[0] + Math.sin(params.transformProgress * Math.PI * 4) * intensity;
      cam._parent.position[1] = originalPosition[1] + Math.sin(params.transformProgress * Math.PI * 4 + randomOffset) * intensity;
    },
    onComplete: () => {
      vec3.copy(cam._parent.position, originalPosition);
    }
  }, "0");
}

export function cameraShakeWithLookAt(camera: Camera, cameraLookAt: vec3, duration = 0.5, intensity = 0.05, intensityLookAt = 0.05) {
  const cam = camera;

  const tl = gsap.timeline();
  
  const params = { transformProgress: 0 };
  
  const originalPosition = cam._parent.position;
  const originalPositionLookAt = cameraLookAt;
  
  const randomOffset = Math.random();
  
  tl.to(params, {
    transformProgress: 1,
    duration: duration,
    ease: "power2.inOut",
    onUpdate: () => {
      cam._parent.position[0] = originalPosition[0] + Math.sin(params.transformProgress * Math.PI * 4) * intensity;
      cam._parent.position[1] = originalPosition[1] + Math.sin(params.transformProgress * Math.PI * 4 + randomOffset) * intensity;
      cameraLookAt[0] = originalPositionLookAt[0] + Math.cos(params.transformProgress * Math.PI * 4) * intensityLookAt;
      cameraLookAt[1] = originalPositionLookAt[1] + Math.cos(params.transformProgress * Math.PI * 4 + randomOffset) * intensityLookAt;
    },
    onComplete: () => {
      vec3.copy(cam._parent.position, originalPosition);
      cam._parent.lookAt(originalPositionLookAt);
    }
  }, "0");
}
