import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import Lighting from "@webgl/engine/Lighting";
import Material from "nanogl-pbr/Material";
import MaterialEl from "nanogl-gltf/lib/elements/Material";
import LilyManager, { LOTUS_COUNT } from "./elements/LilyManager";
import RockManager from "./elements/RockManager";
import Fish from "./elements/Fish";
import Water from "./elements/Water";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import RenderPass from "@webgl/core/RenderPass";
import FloorReflectionChunk from "@webgl/glsl/standard_ssr/FloorReflectionChunk";
import { Uniform } from "nanogl-pbr/Input";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Clouds from "./elements/Clouds";
import Energy from "./elements/Energy";
import { vec3 } from "gl-matrix";
import Ripples from "./elements/Ripples";
import RingManager from "./elements/RingManager";
import ReedManager from "./elements/ReedManager";
import Scene2 from "./Scene2";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import Splashes from "./elements/Splashes";

/// #if DEBUG
import gui from "@webgl/dev/gui";
/// #endif

export default class Pond {

  water: Water;
  lilies: LilyManager;
  rocks: RockManager;
  reeds: ReedManager;
  rings: RingManager;
  fish: Fish;
  energyParticles: Energy;
  // lotusParticles: Energy[] = [];
  clouds: Clouds;
  ripples: Ripples;
  splash: Splashes;

  ambientAdd = 1;

  floorReflectivityUniform: Uniform;

  floorReflectivity = 0.03

  constructor(private renderer: Renderer, tileAddChunk: TextureAddChunk) {
    const ambientChunk = new AmbientAddChunk();
    ambientChunk.ambientAddUniform.set(this.ambientAdd);

    this.lilies = new LilyManager(this.renderer, ambientChunk, tileAddChunk);
    this.rocks = new RockManager(this.renderer, ambientChunk, tileAddChunk);
    this.reeds = new ReedManager(this.renderer, ambientChunk);
    this.fish = new Fish(this.renderer, ambientChunk, tileAddChunk);
    this.water = new Water(this.renderer, ambientChunk, tileAddChunk);
    this.energyParticles = new Energy(this.renderer, 150, 8, vec3.fromValues(0.2, 0.8, 0.65), 4);
    this.clouds = new Clouds(this.renderer, tileAddChunk);
    this.ripples = new Ripples(this.renderer);
    this.splash = new Splashes(this.renderer, ambientChunk);
    this.rings = new RingManager(this.renderer);

    // this.lotusParticles = Array.from({ length: LOTUS_COUNT }, () => new Energy(this.renderer, 20, 0.1, vec3.fromValues(0.7, 0.1, 0.1), 2));

    /// #if DEBUG
    const f = Scene2.guiFolder.folder("Pond");
    f.range(this, "ambientAdd", -2, 2).onChange(() => ambientChunk.ambientAddUniform.set(this.ambientAdd));
    /// #endif
  }

  async load() {
    return Promise.all([this.water.load(), this.lilies.load(), this.rocks.load(), this.reeds.load(), this.rings.load(), this.fish.load(), this.clouds.load(), this.ripples.load(), this.splash.load()]);
  }

  onLoaded() {
    this.lilies.onLoaded();
    this.water.onLoaded();
    this.rocks.onLoaded();
    this.reeds.onLoaded();
    this.clouds.onLoaded();
    this.ripples.onLoaded();
    this.splash.onLoaded();
    this.rings.onLoaded();

    this.fish.onLoaded();

    this.fish.enterWater.on(() => {
      this.splash.spawnStart(this.fish.position);
      this.ripples.spawnStart(this.fish.position);
    });
    this.fish.exitWater.on(() => {
      this.splash.spawnEnd(this.fish.position);
      this.ripples.spawnEnd(this.fish.position);
    });
  }

  start() {
    this.water.start();
    this.lilies.start();
    this.rocks.start(this.water.center[1]);
    this.fish.start(this.water.center[1]);
    this.clouds.start();
    this.energyParticles.start(vec3.fromValues(this.water.center[0], this.water.center[1], this.water.center[2]));
    this.ripples.start();
    this.splash.start();
    this.rings.start();

    // this.lilies.lilies.filter((lily) => lily.hasLotus).forEach((lily, i) => {
    //   if (lily.hasLotus) {
    //     this.lotusParticles[i].start(vec3.fromValues(lily.position[0], lily.position[1], lily.position[2]));
    //     this.lotusParticles[i].offset[1] = .3;
    //   }
    // });
  }

  stop() {
    this.fish.stop();
    this.ripples.stop();
    this.splash.stop();
    this.rings.stop();
    this.water.stop();
    this.lilies.stop();
    this.clouds.stop();
    this.energyParticles.dispose();
  }

  setupSceneLighting(lighting: Lighting) {
    this.setupLighting(
      lighting,
      [...this.lilies.renderables, ...this.rocks.renderables, ...this.reeds.renderables, ...this.fish.renderables, ...this.water.renderables]
    );
  }

  setupWaterLighting(lighting: Lighting) {
    this.setupLighting(
      lighting,
      []
    );
  }

  setupLighting(lighting: Lighting, renderables: MeshRenderer[]) {
    lighting.lightSetup.prepare(this.renderer.gl);
    const materials = [] as Material[];

    // for (const renderable of renderables) {
    //   for (const material of renderable.materials) {
    //     if (!material.hasPass(RenderPass.REFLECT_DEPTH)) {
    //       material.addPass(this.renderer.reflectDistPass, RenderPass.REFLECT_DEPTH);
    //     }
    //   }
    // }


    for (const renderable of renderables) {
      for (const mat of renderable.materials) {
        if (materials.indexOf(mat) === -1) {
          materials.push(mat);
        }
      }
    }
    for (const material of materials) {
      lighting.setupMaterial(material);
    }

    // this.floorReflectivityUniform = new Uniform("fru", 1);
    // this.floorReflectivityUniform.set(this.floorReflectivity);
    // this.createWaterReflection(this.water.gltf.getElementByName(GltfTypes.MATERIAL, "Plane.002_Baked") as MaterialEl);



    /// #if DEBUG
    // gui.folder("Reflect").range(this, "floorReflectivity", 0, 1).onChange(() => {
    //   if (this.floorReflectivityUniform) {
    //     this.floorReflectivityUniform.set(this.floorReflectivity);
    //   }
    // });
    /// #endif

  }



  createWaterReflection(mat: MaterialEl) {
    if (!mat) return;
    const pass = mat.materialPass;

    // pass.glconfig.enableCullface(true)
    //   .enableDepthTest()
    //   .depthMask(true)
    // pass.mask = RenderMask.OPAQUE

    const reflChunk = new FloorReflectionChunk();
    reflChunk.reflectionTexture = this.renderer.reflect.getOutput();
    // reflChunk.strength.attachConstant( .9 )
    pass.inputs.add(reflChunk);

    reflChunk.strength.attach(this.floorReflectivityUniform);

  }

  preRender(isIntroPlaying = false, isOutroPlaying = false) {
    this.fish.preRender(isIntroPlaying, isOutroPlaying);
    this.energyParticles.preRender();
    this.rocks.preRender();
    this.lilies.preRender();
    this.water.preRender();
    this.ripples.preRender();
    this.splash.preRender();
    this.rings.preRender();
    this.reeds.preRender();
  }

  render(ctx: RenderContext) {

    if (ctx.pass !== RenderPass.DEPTH && ctx.pass !== RenderPass.REFLECT_DEPTH) this.water.render(ctx);
    this.lilies.render(ctx);
    this.rocks.render(ctx);
    this.reeds.render(ctx);
    if (ctx.pass !== RenderPass.DEPTH) this.clouds.render(ctx);
    if (ctx.pass !== RenderPass.REFLECT_DEPTH) this.fish.render(ctx);
    if (ctx.pass !== RenderPass.DEPTH && ctx.pass !== RenderPass.REFLECT_DEPTH) {
      this.splash.render(ctx);
      this.ripples.render(ctx);
    }
    if (ctx.pass !== RenderPass.DEPTH && ctx.pass !== RenderPass.REFLECT_DEPTH) {
      this.rings.render(ctx);
    }
    if (ctx.pass !== RenderPass.DEPTH && ctx.pass !== RenderPass.REFLECT_DEPTH) this.energyParticles.render(ctx);
    // for (const lotusParticle of this.lotusParticles) {
    //   if (ctx.pass !== RenderPass.DEPTH && ctx.pass !== RenderPass.REFLECT_DEPTH) lotusParticle.render(ctx);
    // }
  }

}