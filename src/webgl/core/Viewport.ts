import { GLContext } from "nanogl/types"

export default class Viewport {

  x:number
  y:number
  width:number
  height:number

  static fromSize(width:number, height:number):Viewport{
    return new Viewport(0, 0, width, height)
  }

  constructor(x=0, y=0, width=0, height=0){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  setSize(width:number, height:number):void{
    this.width = width
    this.height = height
  }

  setupGl( gl:GLContext ):void {
    gl.viewport(this.x, this.y, this.width, this.height)
  }

}