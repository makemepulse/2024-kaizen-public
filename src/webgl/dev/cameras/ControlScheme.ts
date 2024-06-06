
export enum CameraMode {
  NONE  = -1,
  IDLE  = 0,
  ORBIT = 1,
  PAN   = 2,
  DOLLY = 3,
}

export default interface ControlScheme {
  /**
   * Called on mouse move. Return a camera action type depending on keys/mouse btn combo
   * @param e 
   */
  getModeForEvt( e:MouseEvent|TouchEvent ) : CameraMode

  /**
   * set to true to reverse dolly direction
   * false : pull mouse down to move forward
   */
  readonly inverseDolly:boolean
}
