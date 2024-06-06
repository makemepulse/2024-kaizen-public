import Node from "nanogl-node";
import Trail, { TrailOpts } from "./Trail";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import Renderer from "@webgl/Renderer";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { RenderContext } from "@webgl/core/Renderer";
import Texture2D from "nanogl/texture-2d";
import { TexturePool } from "@webgl/GameScene";

const TRAIL_PATH = "trail/Trail.glb";

export default class TrailManager {

  public renderAbove = false;

  private _trailResource: GltfResource;
  private _trailGltf: Gltf;

  private _trailPool: Trail[];

  private _matOverride: MaterialOverrideExtension;

  private _noiseTex: Texture2D

  constructor(private _renderer: Renderer, texturePool: TexturePool) {
    // Override Materials
    this._matOverride = new MaterialOverrideExtension();
    this._trailPool = [];

    this._trailResource = new GltfResource(TRAIL_PATH, this._renderer.gl, {
      defaultTextureFilter: this._renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [this._matOverride],
    });
    this._noiseTex = texturePool.get("fractalNoise").texture;
  }

  async load() {
    this._trailGltf = await this._trailResource.load();
  }

  onLoaded() {
    this._trailPool = [];
  }


  get trailPool() {
    return this._trailPool;
  }

  addTrail(followNode: Node, opts: TrailOpts): Trail {
    // console.log("Adding Trail");
    const t = new Trail(
      this._renderer,
      this._trailGltf.renderables[0],
      this._noiseTex,
      this._trailPool.length);

    this._trailPool.push(t);
    t.setActive(followNode, opts);

    return t;
  }

  removeAll() {
    for (const trail of this._trailPool) {
      trail.setInactive();
    }
    this._trailPool = [];
  }

  removeTrail(t: Trail) {
    t.setInactive();
    this._trailPool.splice(t.index, 1);
  }

  syncAllWithNode() {
    for (const trail of this._trailPool) {
      trail.syncWithObject();
    }
  }

  syncWithNode(t: Trail) {
    t.syncWithObject();
  }

  preRender() {
    for (const trail of this._trailPool) {
      trail.preRender();
    }

  }

  render(ctx: RenderContext) {
    for (const trail of this._trailPool) {
      trail.render(ctx);
    }
  }
}