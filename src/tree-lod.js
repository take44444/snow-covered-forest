export const TREE_FADE_START=120;
export const TREE_CULL_DISTANCE=155;
export function treeVisibility(distance){const t=Math.max(0,Math.min(1,(distance-TREE_FADE_START)/(TREE_CULL_DISTANCE-TREE_FADE_START)));return 1-t*t*(3-2*t);}
// These intervals partition coverage between meshes derived from the same source.
export function treeLodWeights(distance){
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const hero=1-smooth(8,11,distance),far=smooth(38,47,distance);return [hero,1-hero-far,far];
}
export function treeDistance(tree,position){return Math.hypot(tree.x-position.x,tree.z-position.z,Math.max(0,position.y-tree.y-tree.height));}
export function configureTreeDither(base,level){
 const material=base.clone();
 material.onBeforeCompile=(shader,renderer)=>{
  base.onBeforeCompile(shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float vTreeDistance;');
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 treeOrigin=vec4(0.,0.,0.,1.);float treeHeight=16.;
 #ifdef USE_INSTANCING
 treeOrigin=instanceMatrix*treeOrigin;treeHeight=length(instanceMatrix[1].xyz)*16.;
 #endif
 treeOrigin=modelMatrix*treeOrigin;
 vTreeDistance=length(vec3(cameraPosition.x-treeOrigin.x,max(0.,cameraPosition.y-treeOrigin.y-treeHeight),cameraPosition.z-treeOrigin.z));
 #include <project_vertex>`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTreeDistance;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`float heroCoverage=1.-smoothstep(8.,11.,vTreeDistance),farCoverage=smoothstep(38.,47.,vTreeDistance);
 float treeVisibility=1.-smoothstep(${TREE_FADE_START.toFixed(1)},${TREE_CULL_DISTANCE.toFixed(1)},vTreeDistance);
 float treeNoise=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
 ${level===0?'if(treeNoise>=heroCoverage)discard;':level===1?'if(treeNoise<heroCoverage||treeNoise>=1.-farCoverage)discard;':'if(treeNoise<1.-farCoverage||treeNoise>=treeVisibility)discard;'}
 #include <alphatest_fragment>`);
 };
 material.customProgramCacheKey=()=>`${base.customProgramCacheKey()}-tree-level-${level}`;
 return material;
}
