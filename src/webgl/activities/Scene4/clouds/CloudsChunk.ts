import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";

import Material from "nanogl-pbr/Material";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";
import TexCoord, { StaticTexCoord } from "nanogl-pbr/TexCoord";
import Texture from "nanogl/texture";
import { MAX_SPEED } from "../Crane";

export default class CloudsChunk extends Chunk {
  speed: Input
  speedU: Uniform

  speedScale: Input
  speedScaleU: Uniform

  opacity: Input
  opacityU: Uniform

  transformedCode: string;

  noiseInput: Input;

  cloudScroll = Math.random();
  offsetX = 0;

  speedRatio: number;

  offsetTexture = -0.8

  constructor(mat: Material, noiseTex: Texture) {
    super(true, false);

    this.cloudScroll = Math.random();
    this.addChild(
      (this.speed = new Input("uSpeed", 1, ShaderType.ALL))
    );
    this.addChild(
      (this.opacity = new Input("uOpacity", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.speedScale = new Input("uSpeedScale", 1, ShaderType.ALL))
    );
    this.addChild(this.noiseInput = new Input("noise", 4, ShaderType.FRAGMENT));

    this.opacityU = this.opacity.attachUniform();
    this.speedU = this.speed.attachUniform();
    this.speedU.set(this.cloudScroll);
    this.speedScaleU = this.speedScale.attachUniform()
    this.speedScaleU.set(1);

    const tc = TexCoord.create("aTexCoord0");
    this.noiseInput.attachSampler("noisecolor", tc).set(noiseTex);

    this.transformedCode = (((mat.getPass("color").pass as StandardPass<MetalnessSurface>).surface.baseColor.param as Sampler).texCoords as StaticTexCoord).getTransformCode();

    this.offsetTexture += (Math.random() * 2 - 1) * 0.4;

    this.transformedCode = this.transformedCode.split("aTexCoord0").join(`aTexCoord0 * vec2(2.44, 1.0) * vec2(mix(1., 0.05, uSpeedScale()), 1.) + vec2(${this.offsetTexture} + uSpeed(), 0.)`);

    this.speedRatio = (0.000225 + Math.random() * 0.000025) * (0.2 + (Math.random() * 2 - 1) * 0.05);
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", `
      OUT vec2 vTexCoordCopy;
    `);
    slots.add("postv", `
    vTexCoordCopy = aTexCoord0;
      ${this.transformedCode}
    `);
    slots.add("pf", `
      IN vec2 vTexCoordCopy;
    `);
    slots.add("postf", `
      vec3 noise = texture2D(noisecolor, baseColor_texCoord() * 2. + vec2(uSpeed(), 0.0)).rgb;
      // float a = FragColor.a;
      FragColor.a *= floor(noise.r + 0.5) + floor(noise.g + 0.3);
      FragColor.a += noise.b * 0.2;
      float s = vTexCoordCopy.x;
      float alpha = smoothstep(0.2 + (noise.g - 0.5) * 0.2, 0.5 - (noise.b - 0.5) * 0.2, s + vTexCoordCopy.y * (noise.r - 0.5) * 0.3);
      FragColor.a *= alpha * uOpacity();
      // FragColor.a = a;
      FragColor.a = clamp(FragColor.a, 0., 1.);
      // FragColor.rgb = vec3(vTexCoordCopy.x, alpha, 0.);
    `);
  }
}
