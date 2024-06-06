const skinop = function (options) {

  return async doc => {

    const logger = doc.getLogger();

    const nodes = doc.getRoot().listNodes();

    for (const node of nodes) {
      const skin = node.getSkin();
      if (!skin) continue;

      console.log( 'process node', node.getName() )
      console.log( skin.listJoints().length )

      const mesh = node.getMesh();
      if (!mesh) continue;

      const primitives = mesh.listPrimitives();

      const usedSet = new Set();
      for (const primitive of primitives) {

        const jointsAttrib = primitive.getAttribute('JOINTS_0');
        const weightsAttrib = primitive.getAttribute('WEIGHTS_0');
        if (!jointsAttrib) continue;

        

        const numElems = jointsAttrib.getCount()
        const elementSize = jointsAttrib.getElementSize();
        const buff = new Array(elementSize)
        const wbuff = new Array(elementSize)
        for (let i = 0; i < numElems; i++) {

          jointsAttrib.getElement(i, buff)
          weightsAttrib.getElement(i, wbuff)
          for (let j = 0; j < elementSize; j++) {

            if( wbuff[j] > 0 ){
              usedSet.add(buff[j])
            }
          }
        }

      }

      const usedIndices = Array.from(usedSet);

      console.log( usedIndices.length )

      // no need to optimize if all bones are used
      if (usedIndices.length === skin.listJoints().length) continue;


      const remap = new Map();
      for (let i = 0; i < usedIndices.length; i++) {
        remap.set(usedIndices[i], i);
      }
      
      // remap joints indices with only used ones
      for (const primitive of primitives) {
        const jointsAttrib = primitive.getAttribute('JOINTS_0');
        if (!jointsAttrib) continue;
        remapSkinJoints(jointsAttrib, remap)
      }
      const newSkin = remapSkin( skin, Array.from(remap.entries()) )
      node.setSkin( newSkin )
      
    };
  };
}


function remapSkinJoints(jointsAccessor, remap) {
  const numElems = jointsAccessor.getCount()
  const elementSize = jointsAccessor.getElementSize();
  const buff = new Array(elementSize)

  for (let i = 0; i < numElems; i++) {
    jointsAccessor.getElement(i, buff)
    for (let j = 0; j < elementSize; j++) {
      
      buff[j] = remap.get(buff[j]) ?? 0
    }
    jointsAccessor.setElement(i, buff)
  }
}


function remapSkin( baseSkin, remapEntries ) {
  // create a new skin base on baseSkin
  // but only keep joins that are in remap

  const numRemaps = remapEntries.length
  
  // remap inverse bind matrices accessor
  const oIbm = baseSkin.getInverseBindMatrices()
  const nIbm = oIbm.clone()
  nIbm.setArray( new Float32Array( numRemaps * 16) )
  

  const elementSize = oIbm.getElementSize();
  const buff = new Array(elementSize)

  const oJointList = baseSkin.listJoints()
  const nJointList = new Array(remapEntries.length)

  const newSkin = baseSkin.clone()
  
  for (let i = 0; i < numRemaps; i++) {
    const [oi, ni] = remapEntries[i]
    oIbm.getElement(oi, buff)
    nIbm.setElement(ni, buff)
    
    nJointList[ni] = oJointList[oi]
  }
  
  for (let i = 0; i < oJointList.length; i++) {
    newSkin.removeJoint(oJointList[i])
  }
  console.log( "A", newSkin.listJoints().length )
  
  for (let i = 0; i < nJointList.length; i++) {
    newSkin.addJoint(nJointList[i])
  }
  console.log( "B", newSkin.listJoints().length )

  newSkin.setInverseBindMatrices(nIbm)

  return newSkin

}

export default skinop