import Signal from "@/core/Signal"
import { vec2 } from "gl-matrix"


const EventIds = [
  "pointercancel",
  "pointerdown",
  "pointerenter",
  "pointerleave",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
] as const

export enum Buttons {
  /**
   * left mouse
   * touch contact
   * pen contact
   */
  Left = 1,
  Right = 2,
  Middle = 4,
  Back = 8,
  Forward = 16,
  Eraser = 32,
}

class PointerCoordinates {
  readonly client = vec2.create()
  readonly viewport = vec2.create()
}



export class Pointer {

  readonly coord = new PointerCoordinates()
  readonly downCoord = new PointerCoordinates()


  onDown = new Signal<PointerEvent>()
  onUp = new Signal<PointerEvent>()


  private _lastEvent: PointerEvent = null
  /**
   * the latest PointerEvent received for this pointer
   */
  public get lastEvent(): PointerEvent {
    return this._lastEvent
  }

  private _pointerId = -1
  public get pointerId(): number {
    return this._pointerId
  }

  private _pressed = 0
  private _depressed = 0

  constructor(private _inputs: Pointers) { }

  /**
   * @returns true if the pointer is down for the given button id 
   */
  isDown(button: Buttons = Buttons.Left): boolean {
    if (this._lastEvent === null) return false
    return (this._lastEvent.buttons & button) !== 0
  }

  /**
   * @returns true if the pointer has been pressed down during the current frame
   */
  isPressed(button: Buttons = Buttons.Left): boolean {
    return (this._pressed & button) !== 0
  }

  /**
   * @returns true if the pointer has been released down during the current frame
   */
  isDepressed(button: Buttons = Buttons.Left): boolean {
    return (this._depressed & button) !== 0
  }


  /**
   * 
   * @internal
   */
  _handleEvent(event: PointerEvent) {
    this._lastEvent = event
    this._pointerId = event.pointerId
    this._computeCoords(this.coord, event)
    switch (event.type) {

      case "pointercancel":
      case "pointerleave":
        if (event.pointerType !== "mouse") {
          this._pointerId = -1
        }
        break;

      case "pointerdown":
        this._computeCoords(this.downCoord, event)
        this.onDown.emit(event)
        this._pressed = event.buttons
        break;

      case "pointerup":
        this.onUp.emit(event)
        this._depressed = event.buttons
        break;
    }
  }

  private _computeCoords(coords: PointerCoordinates, event: PointerEvent) {
    coords.client[0] = event.offsetX
    coords.client[1] = event.offsetY
    coords.viewport[0] = (event.offsetX / this._inputs.viewportSize[0]) * 2.0 - 1.0
    coords.viewport[1] = -(event.offsetY / this._inputs.viewportSize[1]) * 2.0 + 1.0
  }

  /**
   * reset the last frame state
   */
  endFrame(): void {
    this._pressed = 0
    this._depressed = 0
  }

}


export default class Pointers {


  readonly primary = new Pointer(this)
  readonly secondary = new Pointer(this)

  private _resizeObs: ResizeObserver

  readonly viewportSize = vec2.create()

  constructor(private el: HTMLElement) {
    EventIds.forEach(id => {
      el.addEventListener(id, this._onPointerEvent)
    })

    this._resizeObs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      this.viewportSize[0] = width
      this.viewportSize[1] = height
    })
    this._resizeObs.observe(el)
  }

  dispose() {
    EventIds.forEach(id => {
      this.el.removeEventListener(id, this._onPointerEvent)
    })
    this._resizeObs.disconnect()
  }



  private _onPointerEvent = (evt: PointerEvent) => {

    let pointer = null

    // Pointers keep there actual pointer ids
    // so if both are active and primary is removed, secondary stay secondary
    // event if it's events actually became primary
    if (evt.pointerId === this.secondary.pointerId) {
      pointer = this.secondary
    }
    else if (evt.pointerId === this.primary.pointerId) {
      pointer = this.primary
    }
    else if (evt.isPrimary) {
      pointer = this.primary
    }
    else if (this.secondary.pointerId === -1) {
      pointer = this.secondary
    }

    if (pointer !== null) pointer._handleEvent(evt)
  }

  endFrame(): void {
    this.primary.endFrame()
    this.secondary.endFrame()
  }


}