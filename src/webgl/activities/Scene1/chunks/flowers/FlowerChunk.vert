{{= if(obj.slot === 'pv' ){ }}
    IN vec4 aInstanceMatrix1;
    IN vec4 aInstanceMatrix2;
    IN vec4 aInstanceMatrix3;
    IN vec4 aInstanceMatrix4;
    IN float aRandomOffset;
    IN float aIsLeftOrRight;
    IN float aRandomRotationFactor;
    IN float aRenderable; 
    IN float aScaleOffset;

    OUT vec3 vPosition;
    OUT float vDistance;
    OUT vec3 vVertexColor;
    OUT float vRenderable;

    float map(float value, float min1, float max1, float min2, float max2) {
      return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }
{{= } }}

{{= if(obj.slot === 'vertex_warp' ){ }}

    #define M_PI 3.1415926535897932384626433832795
    mat4 posMat = mat4(
        aInstanceMatrix1,
        aInstanceMatrix2,
        aInstanceMatrix3,
        aInstanceMatrix4 );

    float xPos = aInstanceMatrix4[0];

    vec4 worldPosTest = posMat * vec4(vertex.position, 1.0);
    float distanceM = distance(worldPosTest.xyz, uMousePos());
    float distanceSmooth = smoothstep(0.0, uRadius(), distanceM);

    vDistance = distanceSmooth;

    // Moving the position of the flower
    float distanceMoveFX = distance(worldPosTest.xyz, vec3(0.0, 13.5, 55.0));
    float distanceSmoothMoveFX = smoothstep(0.0, 45.0, distanceMoveFX);
    posMat[3][0] = mix(xPos - aIsLeftOrRight * 4.0, xPos, 1.0 - distanceSmoothMoveFX);

    float vertexColz = aColor0.r;
    float vertexColx = aColor0.g;
    vertex.position.z += sin((uTime() * 0.001) + aRandomOffset) * vertexColx;
    // vertex.position.y += cos((uTime() * 0.001) + aRandomOffset) * vertexColx;
    
    vVertexColor = aColor0;
    // Reset so the color doesn't apply to base colro in fragment
    v_aColor0 = vec3(1.0, 1.0, 1.0);

    vRenderable = aRenderable;

    // float angle = sin((uTime() * 0.001)) * vertexColz * (1.0-distanceSmooth);
    float angle = aIsLeftOrRight * vertexColz * (1.0-distanceSmooth) * 0.4 * aRandomRotationFactor;

    vec3 flowerPos = worldPosTest.xyz;
    vec3 cameraPos = CameraPos();

    vec3 diff = cameraPos - flowerPos;

    float angleY = atan(diff.z, diff.x) - M_PI/2.0 + (aRandomRotationFactor * 0.8);

    // Create a rotation matrix
    // Y axis
    // mat4 rotation = mat4(
    //   cos(angle), 0.0, sin(angle), 0.0,
    //   0.0, 1.0, 0.0, 0.0,
    //   -sin(angle), 0.0, cos(angle), 0.0,
    //   0.0, 0.0, 0.0, 1.0
    // );

    // X axis
    mat4 rotationX = mat4(
      1.0, 0.0, 0.0, 0.0,
      0.0, cos(angleY), -sin(angleY), 0.0,
      0.0, sin(angleY), cos(angleY), 0.0,
      0.0, 0.0, 0.0, 1.0
    );

    // Z axis
    mat4 rotation = mat4(
      cos(angle), -sin(angle), 0.0, 0.0,
      sin(angle), cos(angle), 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    );

    // Scale matrix
    float vDistScale = distance(worldPosTest.xyz, CameraPos());
    float bisScale = uScale() < aScaleOffset ? 0.0 : map(uScale(), aScaleOffset, 1.0, 0.0, 1.0);
    float scale = smoothstep(MinDistScale(), MaxDistScale(), vDistScale) * bisScale;
    mat4 scaleMat = mat4(
      vec4(scale, 0.0, 0.0, 0.0),
      vec4(0.0, scale, 0.0, 0.0),
      vec4(0.0, 0.0, scale, 0.0),
      vec4(0.0, 0.0, 0.0, 1.0)
    );

    vPosition = vertex.position;

    vertex.worldMatrix = posMat * scaleMat * rotationX * rotation;
{{= } }}