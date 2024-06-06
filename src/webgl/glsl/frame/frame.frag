vec2 frameCoords = texCoordFull * uFrameAspect;
float frameNoiseTime = uFrameTime * 0.000008;
vec4 frameNoise = texture2D(uFrameNoise, vec2(texCoordFull.x * uFrameNoiseRepeat + uFrameNoiseOffset.x + frameNoiseTime, texCoordFull.y * uFrameNoiseRepeat + uFrameNoiseOffset.y + frameNoiseTime));

vec4 frameShape1 = frame(frameCoords, uFrameBorderWidth1, frameNoise.r, texCoordFull);
vec4 frameShape2 = frame(frameCoords, uFrameBorderWidth2, frameNoise.g, texCoordFull);
vec4 frameShape3 = frame(frameCoords, uFrameBorderWidth3, frameNoise.b, texCoordFull);

c = blendFrame(c, uFrameColor, frameShape1);
c = blendFrame(c, uFrameColor, frameShape2);
c = blendFrame(c, uFrameColor, frameShape3);