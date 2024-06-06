import Post from "nanogl-post";
import gui from "@webgl/dev/gui";
import Renderer from "@webgl/Renderer";
import Fetch from "nanogl-post/effects/fetch";
import { MsaaFbo } from "@/webgl/core/MsaaFbo";
import Texture2D from "nanogl/texture-2d";
import Contrast from "nanogl-post/effects/contrast";
import Saturation from "nanogl-post/effects/saturation";
import BaseEffect from "nanogl-post/effects/base-effect";
import Vignette from "nanogl-post/effects/vignette";
import VignetteBlur from "@webgl/glsl/vignetteblur";
import Chromashift from "@webgl/glsl/post/chromashift";
import { vec3, vec4 } from "gl-matrix";
// import VignetteGrain from "@webgl/glsl/vignettegrain/vignettegrain";
import Frame from "@webgl/glsl/frame";
import Splat from "@webgl/glsl/splat/Splat";
import TexturePass from "@webgl/glsl/texutrepass";
import TransitionPass from "@webgl/glsl/transitionPass";

export default class PostProcess {

  _effectList: Array<BaseEffect> = [];
  post: Post;
  fetch: Fetch;

  msaa: MsaaFbo;

  clearColor = vec4.fromValues(1, 1, 1, 1);

  chroma: Chromashift
  vignette: Vignette;
  contrast: Contrast;
  saturation: Saturation;
  vignetteblur: VignetteBlur;
  // vignetteGrain: VignetteGrain;
  splat: Splat;
  frame: Frame;
  texturepass: TexturePass;
  transitionPass: TransitionPass;

  noiseTex: Texture2D;

  get enabled(): boolean {
    return this.post.enabled;
  }
  set enabled(value) {
    this.post.enabled = value;
  }

  constructor(
    public readonly renderer: Renderer
  ) {
    this.noiseTex = renderer.scene.texturePool.get("perlinNoise").texture;

    this.post = new Post(renderer.gl, false);
    this.post.enabled = true;
    this.fetch = new Fetch();

    this.chroma = new Chromashift();
    this.chroma.amount = 0.0;

    this.saturation = new Saturation(1.1);
    this.contrast = new Contrast(1.04, 1.0, 1.07);
    this.texturepass = new TexturePass(renderer);
    this.transitionPass = new TransitionPass(renderer);
    this.vignette = new Vignette([0, 0, 0], 0.0, -0.2);
    this.frame = new Frame(this.noiseTex);

    this.post.add(this.fetch);
    this.post.add(this.chroma);
    this.post.add(this.vignette);
    this.post.add(this.contrast);
    this.post.add(this.saturation);
    this.post.add(this.texturepass);

    // MSAA
    // this.setup.
    this.msaa = new MsaaFbo(renderer.gl, true, 8, true, false);
    this.post.mainColor = this.msaa.blitFbo.getColorTexture();
    this.post.mainFbo = this.msaa.blitFbo;

    const blurSize = 0.01;
    const vignetteStart = 0.11;
    const vignetteSize = 0.47;
    this.vignetteblur = new VignetteBlur(blurSize, vignetteStart, vignetteSize);
    this.vignetteblur.effectStrength = 0;

    // this.vignetteGrain = new VignetteGrain(0.09, 0.5, 0.18, 0.37);
    // this.post.add(this.vignetteGrain);
    // this.vignetteGrain.effectStrength = 1;

    this.splat = new Splat();
    this.splat.effectStrength = 0;


    /// #if DEBUG
    this.paneSetup();
    /// #endif

  }

  paneSetup() {
    /// #if DEBUG

    const rootFld = gui.folder("Postprocess");

    rootFld.add(this, "enabled");

    const sat = rootFld.folder("Saturation");
    sat.add(this.saturation, "amount", { min: 0, max: 2.0 });

    const contrast = rootFld.folder("Contrast");
    contrast.add(this.contrast, "contrast", { min: 0, max: 2.0 });
    contrast.add(this.contrast, "brightness", { min: 0, max: 2.0 });
    contrast.add(this.contrast, "bias", { min: 0, max: 2.0 });

    const vignette = rootFld.folder("Vignette");
    const PARAMS = { color: "#FFFFFF" };
    vignette.addColor(PARAMS, "color").onChange((v) => {
      const colorString = PARAMS.color;
      const r = parseInt(colorString.substring(1, 3), 16) / 255;
      const g = parseInt(colorString.substring(3, 5), 16) / 255;
      const b = parseInt(colorString.substring(5, 7), 16) / 255;

      this.vignette.color = vec3.fromValues(r, g, b);
    });
    vignette.add(this.vignette, "strength", { min: -1.0, max: 1.0 });
    vignette.add(this.vignette, "curve", { min: -1.0, max: 1.0 });

    const chroma = rootFld.folder("Chroma");
    chroma.add(this.chroma, "amount", { min: 0, max: 1.0 });

    const vignetteblur = rootFld.folder("Vignette Blur");
    vignetteblur.add(this.vignetteblur, "vignetteSize", { min: 0, max: 1.0 });
    vignetteblur.add(this.vignetteblur, "vignetteStart", { min: 0, max: 1.0 });
    vignetteblur.add(this.vignetteblur, "size", { min: 0, max: 0.1 });
    vignetteblur.add(this.vignetteblur, "effectStrength", { min: 0, max: 1 });

    // const vignettegrain = rootFld.folder("Vignette Grain");
    // vignettegrain.add(this.vignetteGrain, "amount", { min: 0, max: 2.0 });
    // vignettegrain.add(this.vignetteGrain, "sharpness", { min: 0, max: 2.0 });
    // vignettegrain.add(this.vignetteGrain, "vignetteSize", { min: 0, max: 1.0 });
    // vignettegrain.add(this.vignetteGrain, "vignetteStart", { min: 0, max: 1.0 });
    // vignettegrain.add(this.vignetteGrain, "effectStrength", { min: 0, max: 1 });

    const splat = rootFld.folder("Splat");
    splat.add(this.splat, "h", { min: 0, max: 2.0 });
    splat.add(this.splat, "lacunarity", { min: 0, max: 5.0 });
    splat.add(this.splat, "frequency", { min: 0, max: 5.0 });
    splat.add(this.splat, "octaves", { min: 1.0, max: 20.0 });
    splat.add(this.splat, "effectStrength", { min: 0, max: 1 });
    splat.add(this.splat, "speed", { min: 0, max: 5 });
    splat.add(this.splat, "scale", { min: 0, max: 10 });

    const texturepass = rootFld.folder("Texture Pass");
    texturepass.add(this.texturepass, "textureRepeat", { min: 0, max: 5 });
    texturepass.add(this.texturepass, "textureOpacity", { min: 0, max: 1 });
    texturepass.add(this.texturepass, "timeScale", { min: 0.0001, max: 0.03 });
    texturepass.add(this.texturepass, "displacement", { min: 0, max: 1 });
    texturepass.add(this.texturepass, "textureLuminosity", { min: 0, max: 2 });
    texturepass.add(this.texturepass, "backgroundInfluence", { min: 0, max: 1 });

    const frame = rootFld.folder("Frame");
    frame.addColor(this.frame, "color");
    for (let i = 0; i < 3; i++) {
      const layer = frame.folder(`Frame ${i + 1}`);
      layer.add(this.frame.borderWidth[i], "0", { min: 0, max: 0.5, step: 0.001, label: "top" });
      layer.add(this.frame.borderWidth[i], "1", { min: 0, max: 0.5, step: 0.001, label: "bottom" });
      layer.add(this.frame.borderWidth[i], "2", { min: 0, max: 0.5, step: 0.001, label: "left" });
      layer.add(this.frame.borderWidth[i], "3", { min: 0, max: 0.5, step: 0.001, label: "right" });
    }
    /// #endif

  }

  preRender(w: number, h: number) {
    this.post.preRender(w, h);
    this.msaa.setSize(w, h);
  }

  bindColor(clearColor: vec4) {
    vec4.copy(this.clearColor, clearColor);

    if (!this.post.enabled) {
      const gl = this.post.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const c = clearColor;
      gl.clearColor(c[0], c[1], c[2], c[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      return;
    }

    // MSAA
    this.msaa.renderFbo.bind();
    this.renderer.gl.viewport(0, 0, this.post.renderWidth, this.post.renderHeight);
    this.msaa.renderFbo.clear();
  }

  render(x = 0, y = 0, w = this.post.renderWidth, h = this.post.renderHeight) {
    const post = this.post;

    if (!post.enabled) {
      return;
    }

    const gl = post.gl;
    this.msaa.blitMsaa();

    for (let i = 0; i < post._effects.length; i++) {
      post._effects[i].preRender();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const c = this.clearColor;
    gl.clearColor(c[0], c[1], c[2], c[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(x, y, w, h);

    if (post._shaderInvalid) {
      post.buildProgram();
    }

    post.prg.use();

    for (let i = 0; i < post._effects.length; i++) {
      post._effects[i].setupProgram(post.prg);
    }

    if (post._needDepth()) {
      if (post.hasDepthTexture) {
        // MSAA
        // post.prg.tDepth(post.mainFbo.getDepth());
        post.prg.tDepth(this.msaa.blitFbo.getDepth());
      }
      else
        throw "no depth texture";
      //post.prg.tDepth( post.depthFbo.color );
    }

    post.prg.tInput(this.msaa.getColorTexture());

    post.fillScreen(post.prg);

  }

}