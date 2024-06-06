vec2 transitionUvs = mix(texCoordFull.xy, texCoordFull.yx, uTransitionRotate);
vec4 transitionColor = texture2D(uTransitionTex, transitionUvs);
c = mix(c, transitionColor.rgb, transitionColor.a);