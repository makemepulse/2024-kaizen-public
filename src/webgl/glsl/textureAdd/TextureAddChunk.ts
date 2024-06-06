import Renderer from "@webgl/Renderer";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";
import TexCoord from "nanogl-pbr/TexCoord";

export default class TextureAddChunk extends Chunk {
  noise: Input
  noiseT: Sampler;
  tile: Input;
  tileT: Sampler;

  textureRepeat: Input;
  textureRepeatU: Uniform;
  textureRepeatV = 2.5;

  textureOpacity: Input;
  textureOpacityU: Uniform;
  textureOpacityV = 0.3;

  displacement: Input;
  displacementU: Uniform;
  displacementV = 0.07;

  timeScale: Input;
  timeScaleU: Uniform;
  timeScaleV = 0.004;

  textureLuminosity: Input;
  textureLuminosityU: Uniform;
  textureLuminosityV = 1;

  backgroundInfluence: Input;
  backgroundInfluenceU: Uniform;
  backgroundInfluenceV = 1;

  time: Input;
  timeU: Uniform;

  constructor(renderer: Renderer) {
    super(true, false);
    this.addChild(
      (this.noise = new Input("tileNoise", 4, ShaderType.FRAGMENT))
    );

    this.noiseT = this.noise.attachSampler("tTileNoise", TexCoord.create("aTexCoord0"));
    this.noiseT._tex = renderer.scene.texturePool.get("perlinNoise").texture;

    this.addChild(
      (this.tile = new Input("tile", 4, ShaderType.FRAGMENT))
    );

    this.tileT = this.tile.attachSampler("tTile", TexCoord.create("aTexCoord0"));
    this.tileT._tex = renderer.scene.texturePool.get("tile").texture;

    this.addChild(
      (this.textureRepeat = new Input("uRepeat", 1, ShaderType.FRAGMENT))
    );

    this.textureRepeatU = this.textureRepeat.attachUniform();
    this.textureRepeatU.set(this.textureRepeatV);

    this.addChild(
      (this.textureOpacity = new Input("uOpacity", 1, ShaderType.FRAGMENT))
    );

    this.textureOpacityU = this.textureOpacity.attachUniform();
    this.textureOpacityU.set(this.textureOpacityV)
    // this.addChild(
    //   (this.aspectRatio = new Input("uAspectRatio", 1, ShaderType.FRAGMENT))
    // );

    // this.aspectRatioU = this.aspectRatio.attachUniform();
    // this.aspectRatioU.set(this.aspectRatioV)
    this.addChild(
      (this.displacement = new Input("uDisplacement", 1, ShaderType.FRAGMENT))
    );

    this.displacementU = this.displacement.attachUniform();
    this.displacementU.set(this.displacementV)
    this.addChild(
      (this.timeScale = new Input("uTimeScale", 1, ShaderType.FRAGMENT))
    );

    this.timeScaleU = this.timeScale.attachUniform();
    this.timeScaleU.set(this.timeScaleV)
    this.addChild(
      (this.textureLuminosity = new Input("uTextureLuminosity", 1, ShaderType.FRAGMENT))
    );

    this.textureLuminosityU = this.textureLuminosity.attachUniform();
    this.textureLuminosityU.set(this.textureLuminosityV)
    // this.addChild(
    //   (this.backgroundInfluence = new Input("uBackgroundInfluence", 1, ShaderType.FRAGMENT))
    // );

    // this.backgroundInfluenceU = this.backgroundInfluence.attachUniform();
    // this.backgroundInfluenceU.set(this.backgroundInfluenceV)

    this.addChild(
      (this.time = new Input("uTime2", 1, ShaderType.FRAGMENT))
    );

    this.timeU = this.time.attachUniform();
    this.timeU.set(1)
  }

  protected _genCode(slots: ChunksSlots): void {

    slots.add("pf", `
      float blendOverlay(float base, float blend) {
        return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
      }

      vec3 blendOverlay(vec3 base, vec3 blend) {
        return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
      }

      vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
        return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
      }

      float greyscale(vec3 col){
        float grey = dot(col, vec3(0.299, 0.587, 0.114));
        return grey;
      }

      float easeInOutCubic(float x) {
        return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2. * x + 2., 3.) / 2.;
      }
    `);

    slots.add("postf", /*glsl*/`
    vec4 noiseJitter = texture2D(tTileNoise, tileNoise_texCoord() + vec2(floor(uTime2() * uTimeScale()) * .1));
    vec2 shakeUV = tileNoise_texCoord();

    shakeUV = shakeUV - vec2(0.5, 0.5);
    shakeUV = shakeUV * vec2(uRepeat(), uRepeat());
    shakeUV = shakeUV + vec2(0.5, 0.5);

    shakeUV += (noiseJitter.rg - 0.5) * uDisplacement();

    vec3 texTile = texture2D(tTile, shakeUV).rgb;
    texTile *= uTextureLuminosity();

    float greyBackground = greyscale(FragColor.rgb);
    // float greyBackgroundContrasted = easeInOutCubic(greyBackground);
    // greyBackground = greyBackgroundContrasted;

    // float blendingOpacity = uOpacity();
    // blendingOpacity = clamp(uOpacity() - greyBackground * uBackgroundInfluence(), 0., 1.);
    // FragColor.rgb = blendOverlay(FragColor.rgb, texTile, blendingOpacity);
    FragColor.rgb = mix(FragColor.rgb, FragColor.rgb * 1. - texTile, uOpacity());
    `);
  }
}