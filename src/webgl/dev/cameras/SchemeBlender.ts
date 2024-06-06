import ControlScheme, { CameraMode } from "./ControlScheme";

/**
 * middle mouse to orbit
 *  + shift : pan
 *  + ctrl-shift  : dolly
 */
export default class SchemeBlender implements ControlScheme {
  
  inverseDolly = true

  getModeForEvt( e:MouseEvent ) : CameraMode {
    // middle mouse only 
    if( (e.buttons & 4) == 0 ) return CameraMode.IDLE

    if( e.shiftKey ){
      return e.ctrlKey ? CameraMode.DOLLY : CameraMode.PAN
    }
    return CameraMode.ORBIT;
  }

}
