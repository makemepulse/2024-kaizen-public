{{@version}}

#if __VERSION__ != 300
  #extension GL_OES_standard_derivatives : enable
#endif 

precision {{@highp}} float;


{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}


uniform vec3 uColor;

const float N = 150.0; // grid ratio

float gridTextureGradBox( in vec2 p, in vec2 ddx, in vec2 ddy, float thickness )
{
	// filter kernel
    vec2 w = max(abs(ddx), abs(ddy)) + 0.0001;

    // float n = N;
    float n = thickness;//.2/(min(length(ddx), length(ddy)));

	// analytic (box) filtering
    vec2 a = p + 0.5*w;                        
    vec2 b = p - 0.5*w;           
    vec2 i = (floor(a)+min(fract(a)*n,1.0)-
              floor(b)-min(fract(b)*n,1.0))/(n*w);
    //pattern
    return (1.0-i.x)*(1.0-i.y);
}

IN vec2 vTexCoord;

void main(void){
  		
  vec2 ddx_uv = dFdx( vTexCoord ); 
  vec2 ddy_uv = dFdy( vTexCoord ); 

  float grid = 
    gridTextureGradBox( vTexCoord, ddx_uv, ddy_uv, N ) *
    gridTextureGradBox( vTexCoord*10.0, ddx_uv*10.0, ddy_uv*10.0, N )*
    gridTextureGradBox( vTexCoord/10.0, ddx_uv/10.0, ddy_uv/10.0, N*3.0 );
    // *gridTextureGradBox( vTexCoord*100.0, ddx_uv*100.0, ddy_uv*100.0 );

  FragColor = vec4( uColor, 1.0-grid );
  // FragColor = vec4( vec3(grid), 1.0 );
}