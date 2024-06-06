import { vec3, mat4 } from "gl-matrix";
import Texture2D from "nanogl/texture-2d";
import SpotLight from "nanogl-pbr/lighting/SpotLight";
import { RenderContext } from "@webgl/core/Renderer";
import Frustum, { FrustumRenderOptions } from "./FrustumGuizmo";
import Guizmo from "./CrossGuizmo";
import TextureDraw from "./TextureDraw";
import TextRenderer from "./Text";
import Grid, { GridOrientation } from "./Grid";
import Lines from "./Lines";
import ConeGuizmo from "./ConeGuizmo";
import { GLContext } from "nanogl/types";
import gui from "../gui";
import { CreateGui, Gui, GuiFolder, RangeGui } from "../gui/decorators";
import { Control } from "../gui/api";
import Points from "./Points";
import GLState from "nanogl-state/GLState";

const Orange = 0xfe9f2c;

/// #if DEBUG

type ConeParams = {
  m: mat4;
  height: number;
  angle: number;
};

type TextureParams = {
  name: string;
  tex: Texture2D;
  flipY?: boolean;
};

// TEST SWITCH HERE
//*

function m4fromV3(v3: vec3): mat4 {
  const m = mat4.create();
  mat4.fromTranslation(m, v3);
  return m;
}

@GuiFolder("DebugDraw")
class DebugDrawImpl {
  _textures: TextureParams[];
  _guizmos: mat4[];
  _frustums: FrustumRenderOptions[];
  _cones: ConeParams[];

  guizmo: Guizmo;
  frustum: Frustum;
  cone: ConeGuizmo;
  texDraw: TextureDraw;
  textRenderer: TextRenderer;
  grid: Grid;
  lines: Lines;
  points: Points;

  @Gui
  enabled = true;

  @Gui
  gridXZ = false;

  @Gui
  gridXY = false;

  @Gui
  gridZY = false;

  @RangeGui(0.1, 4, { step: 0.05 })
  public textureScale = 1;

  private currentTextureName = "--";
  private _textureNames: string[] = ["--"];
  private _texListGuiCtrl: Control = null;

  constructor(private gl: GLContext) {
    this._textures = [];
    this._guizmos = [];
    this._frustums = [];
    this._cones = [];

    this.guizmo = new Guizmo(gl);
    this.frustum = new Frustum(gl);
    this.cone = new ConeGuizmo(gl);
    this.texDraw = new TextureDraw(gl);
    this.textRenderer = new TextRenderer(gl);
    this.grid = new Grid(gl);
    this.lines = new Lines(gl);
    this.points = new Points(gl);

    this._updateTexList();

    CreateGui(this);
  }

  clear() {
    this._guizmos.length = 0;
    this._frustums.length = 0;
    this._cones.length = 0;
    this._textures.length = 0;
    this.textRenderer.clear();
  }

  drawTexture(name: string, tex: Texture2D, flipY = false) {
    if (!this.enabled) return;

    if (!this._textureNames.includes(name)) {
      if (this.currentTextureName === "--") {
        this.currentTextureName = name;
      }
      this._textureNames.push(name);
      this._updateTexList();
    }

    this._textures.push({ name, tex, flipY });
  }

  // take vec3 or mat4
  drawGuizmo(x: vec3 | mat4) {
    if (!this.enabled) return;
    if (x.length === 3) {
      this._guizmos.push(m4fromV3(x as vec3));
    } else {
      this._guizmos.push(x as mat4);
    }
  }

  // take vec3 or mat4
  drawFrustum(projection: mat4, color = Orange) {
    if (!this.enabled) return;
    this._frustums.push({ projection, color });
  }

  drawCone(m: mat4, height: number, angle: number) {
    if (!this.enabled) return;
    this._cones.push({ m, height, angle });
  }

  drawText(txt: string, wpos: vec3): void {
    if (!this.enabled) return;
    this.textRenderer.add(txt, wpos);
  }

  drawLine(a: vec3, b: vec3, color = Orange) {
    if (!this.enabled) return;
    this.lines.addLine(a, b, color);
  }

  drawPoint(a: vec3) {
    if (!this.enabled) return;
    this.points.addPoint(a);
  }

  drawSpotLight(l: SpotLight): void {
    DebugDraw.drawCone(l._wmatrix, -l.radius, l.angle);
    // DebugDraw.drawCircle( l._wmatrix, -l.radius, l.angle )
  }

  render(ctx: RenderContext) {
    if (!this.enabled) return;

    this.grid.draw(
      (this.gridXZ ? GridOrientation.XZ : 0) |
        (this.gridXY ? GridOrientation.XY : 0) |
        (this.gridZY ? GridOrientation.YZ : 0),
      ctx
    );

    for (let i = 0; i < this._guizmos.length; i++) {
      this.guizmo._wmatrix.set(this._guizmos[i]);
      this.guizmo.render(ctx.camera);
    }

    for (let i = 0; i < this._frustums.length; i++) {
      this.frustum.render(ctx.camera, this._frustums[i]);
    }

    for (let i = 0; i < this._cones.length; i++) {
      this.cone.setMatrix(this._cones[i].m);
      this.cone.height = this._cones[i].height;
      this.cone.angle = this._cones[i].angle;

      this.cone.updateWorldMatrix();
      this.cone.render(ctx.camera);
    }

    for (const cmd of this._textures) {
      if (cmd.name === this.currentTextureName) {
        this.texDraw.draw(
          {
            ...cmd,
            x: 8,
            y: 8,
            w: cmd.tex.width * this.textureScale,
            h: cmd.tex.height * this.textureScale,
          },
          ctx
        );
      }
    }

    this.lines.render(ctx.camera);
    this.points.render(ctx.camera);
    this.textRenderer.draw(ctx);

    GLState.get(ctx.gl).apply();
  }

  private _updateTexList() {
    this._texListGuiCtrl?.remove();
    this._texListGuiCtrl = gui
      .folder("DebugDraw")
      .addSelect(this, "currentTextureName", this._textureNames);
  }
}

let _instance: DebugDrawImpl;

function init(gl: GLContext): void {
  _instance = new DebugDrawImpl(gl);
}

const DebugDraw = {
  init,

  get enabled(): boolean {
    return _instance.enabled;
  },
  set enabled(v: boolean) {
    _instance.enabled = v;
  },

  get textureScale(): number {
    return _instance.textureScale;
  },

  set textureScale(v: number) {
    _instance.textureScale = v;
  },

  drawGuizmo(x: vec3 | mat4): void {
    _instance.drawGuizmo(x);
  },

  drawFrustum(vp: mat4): void {
    _instance.drawFrustum(vp);
  },

  drawCone(m: mat4, height: number, angle: number): void {
    _instance.drawCone(m, height, angle);
  },

  drawSpotLight(l: SpotLight): void {
    _instance.drawSpotLight(l);
  },

  drawTexture(name: string, t: Texture2D, flipY = false): void {
    _instance.drawTexture(name, t, flipY);
  },

  drawLine(a: vec3, b: vec3, color = Orange): void {
    _instance.drawLine(a, b, color);
  },

  drawPoint(a: vec3): void {
    _instance.drawPoint(a);
  },

  drawText(txt: string, wpos: vec3): void {
    _instance.drawText(txt, wpos);
  },

  render(ctx: RenderContext): void {
    _instance.render(ctx);
    _instance.clear();
  },
};

export default DebugDraw;

/*/ 

/// #else

const DebugDraw = {
  enabled:false,
  init(gl:GLContext):void{0},
  drawGuizmo(x : vec3 | mat4 ):void{0},
  drawFrustum( vp : mat4 ):void{0},
  drawCone( m : mat4 ):void{0},
  drawSpotLight( l :SpotLight ):void{0},
  drawTexture( name:string, t:Texture2D, flipY = false ):void{0},
  drawText( txt:string, wpos: vec3 ):void{0},
  drawLine( a:vec3, b:vec3, color = Orange ):void{0},
  drawPoint( a:vec3 ):void{0},
  render(ctx:IRenderContext):void{0}
}

export default DebugDraw;

/// #endif
//*/
