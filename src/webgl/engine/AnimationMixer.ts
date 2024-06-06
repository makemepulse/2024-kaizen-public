import { mat4, quat, vec3 } from "gl-matrix"
import type Animation from "nanogl-gltf/lib/elements/Animation"
import type AnimationChannel from "nanogl-gltf/lib/elements/AnimationChannel"
import type Node from "nanogl-gltf/lib/elements/Node"

const M4 = mat4.create()
const Q0 = quat.create()
const S0 = vec3.create()
const P0 = vec3.create()


export class AnimationLayer {

  range: [number, number] = [0, 0]
  
  time = 0
  
  weight = 1.0
  
  constructor( readonly animation: Animation ) {
    this.range = [0, animation.duration]
  }

  get duration() {
    return this.range[1] - this.range[0]
  }



}


class NodeLayer {

  node: Node

  layers: AnimationLayer[] = []
  channels: AnimationChannel[][] = []

  evaluate() {

    let totalWeight = 0
    for( let layer of this.layers ) {
      totalWeight += layer.weight
    }

    if( totalWeight === 0 ) return

    
    let weightAccum = 0

    for( let i=0; i<this.layers.length; i++ ) {
      let layer = this.layers[i]

      if( layer.weight === 0 ) continue

      let normalizedWeight = layer.weight / totalWeight
      weightAccum += normalizedWeight

      let mix = normalizedWeight / weightAccum

      const t = (layer.time % (layer.range[1] - layer.range[0])) + layer.range[0]

      for( let j= 0; j < this.channels[i].length; j++ ) {
        this.channels[i][j].evaluate( t )
      }

      if( i === 0 ) {
        Q0.set( this.node.rotation )
        S0.set( this.node.scale )
        P0.set( this.node.position )
      } else {
        quat.slerp( Q0, Q0, this.node.rotation, mix )
        vec3.lerp( S0, S0, this.node.scale, mix )
        vec3.lerp( P0, P0, this.node.position, mix )
      }

    }  
    
    this.node.rotation.set( Q0 )
    this.node.scale.set( S0 )
    this.node.position.set( P0 )
    this.node.invalidate()

  }

}

export default class AnimationMixer 
{

  layers: AnimationLayer[] = []

  _nodeLayers: NodeLayer[] = []
  _nodeLayerMap: Map<Node, NodeLayer> = new Map()

  private _invalidLayers: boolean

  addLayer( layer: AnimationLayer ) {
    this.layers.push( layer )
    this._invalidLayers = true
  }

  evaluate() {

    if( this._invalidLayers ) {
      this._rebuildLayers()
    }

    for( let layer of this._nodeLayers ) {
      layer.evaluate()
    }

  }

  /**
   * create list of all nodes animated by animation layers
   */
  private _rebuildLayers() {
    
    this._nodeLayers.length = 0
    this._nodeLayerMap.clear()

    for( let layer of this.layers ) {

      layer.animation.channels.forEach( (channel, i) => {
        let nodeLayer = this._nodeLayerMap.get( channel.node )
        if( !nodeLayer ){
          nodeLayer = new NodeLayer()
          nodeLayer.node = channel.node
          this._nodeLayers.push( nodeLayer )
          this._nodeLayerMap.set( channel.node, nodeLayer )
        }
        const index = nodeLayer.layers.indexOf( layer )
        if( index === -1 ){
          nodeLayer.layers.push( layer )
          nodeLayer.channels.push( [channel] )
        }else {
          nodeLayer.channels[index].push( channel )
        }
        
      })

    }

    this._invalidLayers = false

  }

}