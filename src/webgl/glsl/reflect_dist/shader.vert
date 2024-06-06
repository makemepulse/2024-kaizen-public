
#pragma SLOT definitions
#pragma SLOT precision

#if __VERSION__ == 300
  #define IN in
  #define OUT out
#else
  #define IN attribute
  #define OUT varying
#endif

#pragma SLOT pv

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uMVP;
uniform mat4 uWorldMatrix;
uniform mat4 uVP;

OUT vec3 vWorldPos;


struct VertexData {
  highp vec3 position;
  highp vec3 worldPos;
  #if hasNormals
    vec3 normal;
  #endif
  #if hasTangents
    vec3 tangent;
  #endif
  mat4 worldMatrix;
};


void InitVertexData( out VertexData vertex ){

  vertex.position = aPosition;
  #if hasNormals
    vertex.normal = aNormal;
  #endif
  #if hasTangents
    vertex.tangent = aTangent.xyz;
  #endif

  vertex.worldMatrix = uWorldMatrix;
   
}


void main(void) {

  #pragma SLOT v


  VertexData vertex;
  InitVertexData( vertex );

  #pragma SLOT vertex_warp

  vec4 worldPos = vertex.worldMatrix * vec4( vertex.position, 1.0 );
  vertex.worldPos.xyz = worldPos.xyz / worldPos.w;
  worldPos.w = 1.0;

  #pragma SLOT vertex_warp_world

  vWorldPos = worldPos.xyz;
  gl_Position = uVP * worldPos;

}
