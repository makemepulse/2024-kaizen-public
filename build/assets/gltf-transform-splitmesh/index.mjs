
const attribute = "_index"

const semanticToKeep = [
  "POSITION",
  "NORMAL",
  // "TANGENT",
  "TEXCOORD_0",
  "TEXCOORD_1",
  // "COLOR_0",
  "JOINTS_0",
  "WEIGHTS_0"

]


const skinop = function (options) {



  return async doc => {

    const logger = doc.getLogger();

    const nodes = doc.getRoot().listNodes();

    for (const node of nodes) {

      const skin = node.getSkin();
      
      const mesh = node.getMesh();
      if (!mesh) continue;

      console.log( 'process node', mesh.getName() )

      const matchSet = getMatchSet( mesh, attribute )

      console.log( matchSet )
      
      if( matchSet.size < 2 ) continue;

      const matches = Array.from(matchSet)

      for( let mi = 0; mi < matches.length; mi++ ){
        const match = matches[mi]
        
        const newNode = doc.createNode( `${mesh.getName()}_${match}` )
        newNode.setMatrix( node.getMatrix() )

        if( skin ){
          newNode.setSkin( skin )
        }

        const newMesh = filterMesh( mesh, attribute, match )
        newNode.setMesh( newMesh );

        const parent = node.getParent()
        if( parent ){
          parent.addChild( newNode );
        } else {
          doc.getRoot().getDefaultScene().addChild( newNode );
        }
      }

      mesh.dispose()
      node.dispose()
      
    };
  };
}


function getMatchSet( mesh, attribute ) {
  const primitives = mesh.listPrimitives();

  const matchSet = new Set();
  for (const primitive of primitives) {

    const attribs = primitive.getAttribute(attribute);

    const numAttribs = attribs.getCount()

    for (let i = 0; i < numAttribs; i++) {
      matchSet.add( attribs.getScalar(i) )
    }
  }
  return matchSet
}

function getMatchRemap( primitive, attribute, value ) {
  const attribs = primitive.getAttribute(attribute);
  
  const numAttribs = attribs.getCount()
  const remap = new Array(numAttribs)
  let c = 0
  for (let i = 0; i < numAttribs; i++) {
    if( value === attribs.getScalar(i) ){
      remap[i] = c++
    } else {
      remap[i] = -1
    }
  }

  const indices = primitive.getIndices().getArray()
  const newIndices = []
  for (let i = 0; i < indices.length/3; i++) {
    const a = indices[i*3]
    const b = indices[i*3+1]
    const c = indices[i*3+2]
    if( remap[a] !== -1 && remap[b] !== -1 && remap[c] !== -1 ){
      newIndices.push( remap[a], remap[b], remap[c] )
    }
  }
  
  return {
    remap, count: c, indices: newIndices
  }
}

function filterMesh( mesh, attribute, value ) {
  const newMesh = mesh.clone()

  const primitives = newMesh.listPrimitives();

  for (const oldPrimitive of primitives) {
    newMesh.removePrimitive( oldPrimitive )

    const primitive = oldPrimitive.clone() 
    newMesh.addPrimitive( primitive )
    

    const {remap, count, indices} = getMatchRemap( primitive, attribute, value )

    for (const semantic of primitive.listSemantics()) {
      const attribute = primitive.getAttribute(semantic);
      if( !semanticToKeep.includes(semantic) ) {
        primitive.setAttribute(semantic, null)

	    if (attribute.listParents().length === 1) attribute.dispose();
        continue
      }
			swapAttributes(primitive, attribute, remap, count);
		}
    const dstIndicesArray = count <= 65534 ? new Uint16Array(indices.length) : new Uint32Array(indices.length);
    dstIndicesArray.set(indices);
    const srcIndices = primitive.getIndices();
    primitive.setIndices(srcIndices.clone().setArray(dstIndicesArray));
    if (srcIndices.listParents().length === 1) srcIndices.dispose();

  }
  
  return newMesh
  
}

function createArrayOfType(array, length) {
	const ArrayCtor = array.constructor;
	return new ArrayCtor(length);
}

function swapAttributes(
	primitive,
	srcAttr,
	remap,
	dstCount,
) {
	const dstAttrArray = createArrayOfType(srcAttr.getArray(), dstCount * srcAttr.getElementSize());
	const dstAttr = srcAttr.clone().setArray(dstAttrArray);
	const done = new Uint8Array(dstCount);

	for (let i = 0, el = []; i < remap.length; i++) {
		if (!done[remap[i]]) {
			dstAttr.setElement(remap[i], srcAttr.getElement(i, el));
			done[remap[i]] = 1;
		}
	}

	primitive.swap(srcAttr, dstAttr);

	// Clean up.
	if (srcAttr.listParents().length === 1) srcAttr.dispose();
}



export default skinop