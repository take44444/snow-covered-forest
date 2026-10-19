// All snow uses metre-scaled world projections, including instanced boulders.
// Vertical snow edges must not collapse their texture coordinates onto a line.
export function configureWorldMaterial(material,{repeat=.5,sparkle=true}={}){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
 varying vec3 vSnowWorld;
 varying vec3 vSnowNormalWorld;`);
  shader.vertexShader=shader.vertexShader.replace('#include <defaultnormal_vertex>',`#include <defaultnormal_vertex>
 vSnowNormalWorld=normalize(inverseTransformDirection(transformedNormal,viewMatrix));`);
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 vec4 snowWorld=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 snowWorld=instanceMatrix*snowWorld;
 #endif
 vSnowWorld=(modelMatrix*snowWorld).xyz;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vSnowWorld;
 varying vec3 vSnowNormalWorld;
 float grain(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,39.425)))*43758.5453);}
 vec3 snowWeights(){vec3 w=pow(abs(normalize(vSnowNormalWorld)),vec3(5.0));return w/max(w.x+w.y+w.z,.0001);}
 vec4 snowSample(sampler2D tex){vec3 w=snowWeights();return texture2D(tex,vSnowWorld.zy*${repeat.toFixed(3)})*w.x+texture2D(tex,vSnowWorld.xz*${repeat.toFixed(3)})*w.y+texture2D(tex,vSnowWorld.xy*${repeat.toFixed(3)})*w.z;}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','diffuseColor*=snowSample(map);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
 vec3 snowN=normalize(vSnowNormalWorld),snowW=snowWeights();
 vec3 grainX=texture2D(normalMap,vSnowWorld.zy*${repeat.toFixed(3)}).xyz*2.0-1.0;
 vec3 grainY=texture2D(normalMap,vSnowWorld.xz*${repeat.toFixed(3)}).xyz*2.0-1.0;
 vec3 grainZ=texture2D(normalMap,vSnowWorld.xy*${repeat.toFixed(3)}).xyz*2.0-1.0;
 vec3 snowDetail=vec3(0.,grainX.y,grainX.x)*snowW.x+vec3(grainY.x,0.,grainY.y)*snowW.y+vec3(grainZ.x,grainZ.y,0.)*snowW.z;
 normal=normalize(mat3(viewMatrix)*(snowN+snowDetail*normalScale.x));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`
 float roughnessFactor=roughness*snowSample(roughnessMap).g;
 float crystal=${sparkle?'pow(grain(floor(vSnowWorld*950.0)),95.0)':'0.0'};
 roughnessFactor=clamp(roughnessFactor-crystal*.3,.4,1.0);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','gl_FragColor.rgb+=crystal*.025;\n#include <dithering_fragment>');
 };
 material.customProgramCacheKey=()=> `world-triplanar-${repeat}-${sparkle}`;
 return material;
}

export const configureSnowMaterial=material=>configureWorldMaterial(material);
