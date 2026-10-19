import * as THREE from 'three';
// Match the visible horizon to the same working-space colour used by scene fog.
// Lighting still uses the physical Sky environment generated in main.js.
export function createAtmosphere(fogColor,sunDirection){
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,toneMapped:false,fog:false,
  uniforms:{uHorizon:{value:fogColor},uZenith:{value:new THREE.Color(0x91adc5)},uSun:{value:sunDirection}},
  vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uHorizon;uniform vec3 uZenith;uniform vec3 uSun;varying vec3 vDirection;
 void main(){vec3 direction=normalize(vDirection);float height=pow(max(0.,direction.y),.65);vec3 sky=mix(uHorizon,uZenith,height*.7);
 float aureole=pow(max(0.,dot(direction,uSun)),48.)*smoothstep(0.,.2,direction.y);sky+=vec3(.08,.065,.04)*aureole;
 gl_FragColor=vec4(sky,1.);
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(250,32,16),material);mesh.renderOrder=-1000;mesh.frustumCulled=false;return mesh;
}
