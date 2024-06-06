import { lightIsShadowMappedLight } from "nanogl-pbr/lighting/Light";
import LightSetup from "nanogl-pbr/lighting/LightSetup";
import GLState from "nanogl-state/GLState";
import GLConfig from "nanogl-state/GLConfig";
import { GLContext } from "nanogl/types";
import { RenderContext } from "./Renderer";
import RenderMask from "./RenderMask";
import RenderPass from "./RenderPass";
import Viewport from "./Viewport";
import PixelFormats from "nanogl-pf";
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import SpotLight from "nanogl-pbr/lighting/SpotLight";
import { ShadowMappedLight } from "nanogl-pbr/lighting/Light";

export type LightmapRenderFunction = (ctx: RenderContext) => void;

export default class LightmapRenderer {
  /**
   * Render shadowmaps for each lights in the given light setup.
   * @param gl
   * @param lightSetup
   * @param renderFunction
   */
  static render(
    gl: GLContext,
    lightSetup: LightSetup,
    renderFunction: LightmapRenderFunction
  ) {
    const lights = lightSetup._lights;
    // const depthpass = this.matlib.depthPass;
    const glstate = GLState.get(gl);
    // console.log(this.lighting.lightSetup.depthFormat.value());

    const isRgb = lightSetup.depthFormat.value() === "D_RGB";

    const config = new GLConfig()
      .enableCullface(true)
      .enableDepthTest(true)
      .depthMask(true)
      .colorMask(isRgb, isRgb, isRgb, isRgb);

    glstate.push(config);
    glstate.apply();

    for (const l of lights) {
      if (lightIsShadowMappedLight(l) && l.castShadows) {
        l.bindShadowmap();
        // console.log(
        //   "has depth tex",
        //   PixelFormats.getInstance(gl).hasDepthTexture()
        // );

        // fbodebug.debug( l._fbo );

        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // DebugDraw.drawTexture("test", (l as any)._fbo.getColorTexture());
        // DebugDraw.drawFrustum((l as any)._camera._viewProj);
        //
        renderFunction({
          gl,
          viewport: new Viewport(0, 0, l.shadowmapSize, l.shadowmapSize),
          glConfig: config,
          camera: l.getCamera(),
          mask: RenderMask.OPAQUE,
          pass: RenderPass.DEPTH,
        });
      }
    }

    glstate.pop();
    glstate.apply();
  }
}
