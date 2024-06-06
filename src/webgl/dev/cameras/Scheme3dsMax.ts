import ControlScheme, { CameraMode } from "./ControlScheme";

/**
 * middle mouse to pan
 *  + alt : orbit
 *  + ctrl-alt  : dolly
 */
export default class Scheme3dsMax implements ControlScheme {
  
  inverseDolly = false
  
  getModeForEvt( e:MouseEvent ) : CameraMode {
    if( (e.buttons & 4) == 0 ) return CameraMode.IDLE
    if( e.altKey ){
      return e.ctrlKey ? CameraMode.DOLLY : CameraMode.ORBIT
    }
    return CameraMode.PAN;
  }

}
