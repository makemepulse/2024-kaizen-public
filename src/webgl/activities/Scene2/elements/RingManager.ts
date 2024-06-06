import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import { Ring } from "./Ring";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import RingChunk from "../chunks/ring/RingChunk";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { ISheet } from "@theatre/core";


export default class RingManager {

  res: GltfResource
  gltf: Gltf

  ring: Ring
  ring1: Ring
  ring2: Ring
  ring3: Ring
  ring4: Ring
  ring5: Ring

  ringChunk: RingChunk

  rotationTimeline: TheatreFloat;
  opacityTimeline: TheatreFloat;

  rotation = { value: 1, startV: 0 };
  opacity = { value: 1, startV: 0 };

  sheetSuccess: ISheet;

  constructor(private renderer: Renderer) {

    const overrides = new MaterialOverrideExtension();
    overrides.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      this.ringChunk = new RingChunk(pass);
      pass.inputs.add(this.ringChunk);
      pass.glconfig.depthMask(true);

      return pass;
    });
    this.res = new GltfResource("scene2/ring.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.ring = new Ring(this.renderer);
    this.ring1 = new Ring(this.renderer);
    this.ring2 = new Ring(this.renderer);
    this.ring3 = new Ring(this.renderer);
    this.ring4 = new Ring(this.renderer);
    this.ring5 = new Ring(this.renderer);
  }

  async load() {
    await Promise.all([this.res.load()]);
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.ring.onLoaded(this.gltf);
    this.ring1.onLoaded(this.gltf);
    this.ring2.onLoaded(this.gltf);
    this.ring3.onLoaded(this.gltf);
    this.ring4.onLoaded(this.gltf);
    this.ring5.onLoaded(this.gltf);
  }

  start() {
    this.ring.start();
    this.ring1.start();
    this.ring2.start();
    this.ring3.start();
    this.ring4.start();
    this.ring5.start();

    this.ring.node.setScale(6.5);
    this.ring1.node.setScale(7);
    this.ring2.node.setScale(8.5);
    this.ring3.node.setScale(4);
    this.ring4.node.setScale(5.5);
    this.ring5.node.setScale(3);

    this.ring2.node.y = 0.1;
    this.ring.node.y = 0.11;
    this.ring1.node.y = 0.12;
    this.ring3.node.y = 0.06;
    this.ring4.node.y = 0.05;
    this.ring5.node.y = 0.04;
    // this.ring3.node.y = -0.01;
    // this.ring4.node.y = -0.005;
    // this.ring5.node.y = -0.002;

    this.ring.rotation = 0.2;
    this.ring1.rotation = 1;
    this.ring2.rotation = 0.8;
    this.ring3.rotation = 0.8;
    this.ring4.rotation = 0.3;
    this.ring5.rotation = 0.5;

    this.ring.opacity = 0.5;
    this.ring1.opacity = 0.5;
    this.ring2.opacity = 0.5;
    this.ring3.opacity = 0.3;
    this.ring4.opacity = 0.3;
    this.ring5.opacity = 0.3;

    this.ring2.timeMult += (Math.random() * 2 - 1) * (this.ring2.timeMult * 0.25);
    this.ring2.baseTime += (Math.random() * 2 - 1) * (this.ring2.baseTime * 0.25);
    this.ring1.timeMult += (Math.random() * 2 - 1) * (this.ring1.timeMult * 0.25);
    this.ring1.baseTime += (Math.random() * 2 - 1) * (this.ring1.baseTime * 0.25);
    this.ring3.timeMult += (Math.random() * 2 - 1) * (this.ring3.timeMult * 0.25);
    this.ring3.baseTime += (Math.random() * 2 - 1) * (this.ring3.baseTime * 0.25);
    this.ring4.timeMult += (Math.random() * 2 - 1) * (this.ring4.timeMult * 0.25);
    this.ring4.baseTime += (Math.random() * 2 - 1) * (this.ring4.baseTime * 0.25);
    this.ring5.timeMult += (Math.random() * 2 - 1) * (this.ring4.timeMult * 0.25);
    this.ring5.baseTime += (Math.random() * 2 - 1) * (this.ring4.baseTime * 0.25);

    this.ring.node.invalidate();
    this.ring1.node.invalidate();
    this.ring2.node.invalidate();
    this.ring3.node.invalidate();
    this.ring4.node.invalidate();
    this.ring5.node.invalidate();

    this.ring.node.updateWorldMatrix();
    this.ring1.node.updateWorldMatrix();
    this.ring2.node.updateWorldMatrix();
    this.ring3.node.updateWorldMatrix();
    this.ring4.node.updateWorldMatrix();
    this.ring5.node.updateWorldMatrix();

    this.rotationTimeline = new TheatreFloat(this.rotation, this.sheetSuccess, "Rings / Rotation");
    this.opacityTimeline = new TheatreFloat(this.opacity, this.sheetSuccess, "Rings / Opacity");

    this.rotation.startV = this.rotation.value;
    this.opacity.startV = this.opacity.value;
  }

  stop() {
    this.ring.stop();
    this.ring1.stop();
    this.ring2.stop();
    this.ring3.stop();
    this.ring4.stop();
    this.ring5.stop();

    this.rotationTimeline.dispose();
    this.opacityTimeline.dispose();
  }

  preRender() {
    this.ring.preRender(this.rotation.value);
    this.ring1.preRender(this.rotation.value);
    this.ring2.preRender(this.rotation.value);
    this.ring3.preRender(this.rotation.value);
    this.ring4.preRender(this.rotation.value);
    this.ring5.preRender(this.rotation.value);
  }

  render(ctx: RenderContext) {
    this.ring.render(ctx, this.ringChunk, this.opacity.value);
    this.ring1.render(ctx, this.ringChunk, this.opacity.value);
    this.ring2.render(ctx, this.ringChunk, this.opacity.value);
    this.ring3.render(ctx, this.ringChunk, this.opacity.value);
    this.ring4.render(ctx, this.ringChunk, this.opacity.value);
    this.ring5.render(ctx, this.ringChunk, this.opacity.value);
  }
}