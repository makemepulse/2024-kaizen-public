import Lighting from "@webgl/engine/Lighting";
import IblResource from "@webgl/resources/IblResource";


/// #if DEBUG
//*

// const DevIblDir = "https://mmp-labs.s3.eu-west-1.amazonaws.com/resources/ibls"
// import { loadJson, loadText } from "@webgl/resources/Net";
// import gui from "./gui";


// async function _addDevIbls(lighting: Lighting): Promise<void> {


//   const listFile = await loadText(DevIblDir + '/list.txt')

//   const list = listFile.split('\n').filter((s) => s.length > 0).sort((a, b) => a.localeCompare(b))

//   let res: IblResource = null

//   gui.folder('Lighting').select('ibls', list).onChange(ibl => {
//     res?.unload()
//     res = new IblResource({
//       path: `${DevIblDir}/${ibl}`,
//       ibl: lighting.ibl,
//     }, lighting.gl)
//     res.load()
//   })

// }

/*/ 
/// #else
function _addDevIbls():void {}
/// #endif
//*/

export default function addDevIbls(lighting: Lighting): void {
  // _addDevIbls(lighting)
}
