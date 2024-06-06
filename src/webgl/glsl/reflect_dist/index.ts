
import Flag from 'nanogl-pbr/Flag'
import Precision from 'nanogl-pbr/ShaderPrecision'
import Version from 'nanogl-pbr/ShaderVersion'
import mat4 from 'gl-matrix/src/gl-matrix/mat4'

import MaterialPass, { MaterialPassId } from 'nanogl-pbr/MaterialPass'
import Program from 'nanogl/program'
import Node from 'nanogl-node'
import Camera from 'nanogl-camera'

import vShader from './shader.vert'
import fShader from './shader.frag'
import gui from '@webgl/dev/gui'
import AppService from '@/services/AppService'

const M4 = mat4.create();
const MAT_ID = 'refd';



export default class ReflectDistPass extends MaterialPass {

  version: Version
  precision: Precision
  shaderid: Flag<string>
  distScale = 1
  groundHeight = 0


  constructor(name = 'reflect-dist-pass') {

    super({
      uid: MAT_ID,
      vert: vShader(),
      frag: fShader(),
    });

    this.version = this.inputs.add(new Version('100'));
    this.precision = this.inputs.add(new Precision('mediump'));
    this.shaderid = this.inputs.add(new Flag('id_' + MAT_ID, true));


    this.glconfig
      .enableDepthTest()
    // .depthFunc( gl.EQUAL)

    /// #if DEBUG
    const reflectFolder = gui.folder("Reflect")
    reflectFolder.range(this, 'distScale', 0, 5)
    // HMR.register(this);
    /// #endif

  }



  prepare(prg: Program, node: Node, camera: Camera): void {

    if (prg.uMVP) {
      camera.modelViewProjectionMatrix(M4, node._wmatrix);
      prg.uMVP(M4);
    }


    prg.uWorldMatrix(node._wmatrix);
    prg.uVP(camera._viewProj);

    if (prg.uCamPos) prg.uCamPos(camera._wposition);

    prg.uDistScale(this.distScale);
    this.groundHeight = AppService.Scene.renderer.reflect.groundHeight;
    prg.uGroundHeight(this.groundHeight);

  }


};


// /// #if DEBUG

// import ShaderHMR from '@/webgl/dev/ShaderHMR'
// import gui from '@/webgl/dev/gui'

// const HMR = new ShaderHMR();

// if (module.hot) {
//   HMR.shaderAccessors(() => vShader, () => fShader)
//   module.hot.accept(['./shader.vert', './shader.frag'], HMR.update)
// }

// /// #endif