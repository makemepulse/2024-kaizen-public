import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";

export default class AmbientAddChunkFog extends Chunk {
  ambientAdd: Input;
  ambientAddUniform: Uniform;
  cameraPos: Input;
  maxDist: Input;
  minDist: Input;
  cameraPosUniform: Uniform;
  maxDistUniform: Uniform;
  minDistUniform: Uniform;

  constructor() {
    super(true, false);
    this.addChild(this.ambientAdd = new Input("ambientAdd", 1, ShaderType.FRAGMENT));
    this.addChild(this.cameraPos = new Input("CameraPos", 3, ShaderType.VERTEX));
    this.addChild(this.maxDist = new Input("MaxDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.minDist = new Input("MinDist", 1, ShaderType.FRAGMENT));


    this.ambientAddUniform = this.ambientAdd.attachUniform();
    this.ambientAddUniform.set(1);

    this.cameraPosUniform = this.cameraPos.attachUniform();
    this.cameraPosUniform.set(0, 0, 0);

    this.maxDistUniform = this.maxDist.attachUniform();
    this.maxDistUniform.set(36);

    this.minDistUniform = this.minDist.attachUniform();
    this.minDistUniform.set(10);
  }

  protected _genCode(slots: ChunksSlots): void {

    slots.add("pv", /*glsl*/`
    OUT float vDistAmbientAdd;
    `);

    slots.add("postv", /*glsl*/`
    vec3 wPosAmb = vWorldPosition;
    vec3 camPosAmb = CameraPos();

    float distAmb = distance(camPosAmb, wPosAmb);

    vDistAmbientAdd = distAmb;
    `);

    slots.add("pf", /*glsl*/`
    IN float vDistAmbientAdd;
    `);

    slots.add("postlightsf", /*glsl*/`
      float finalDistAmb = smoothstep(MinDist(), MaxDist(), vDistAmbientAdd);

      float ambientAdd = ambientAdd();
      // vec3 ambient = vec3(0.717, 0.658, 0.874);
      vec3 ambient = vec3(0.0);

      #if HAS_baseColor
        ambient += surface.albedo * ambientAdd * (1.0 - finalDistAmb);
      #endif
      #if HAS_baseColorFactor
        ambient += baseColorFactor() * ambientAdd * (1.0 - finalDistAmb);
      #endif

      ambient = vec3(0.0);

      #if HAS_baseColor
        ambient += surface.albedo * ambientAdd ;
      #endif
      #if HAS_baseColorFactor
        ambient += baseColorFactor() * ambientAdd;
      #endif

      // FragColor.rgb += ambient * ambientAdd * (1.0 - finalDistAmb);

      lightingData.lightingColor += ambient * ambientAdd;
      // FragColor.rgb += mix(surface.albedo, ambient, ambientAdd * (1.0 - finalDistAmb));
      // FragColor.rgb = ((FragColor.rgb - 0.5) * max(1.5, 0.0)) + 0.5;
      

    `);
  }
}