// A branch can retain a shallow cap when its foliage spreads horizontally.
// A densely sampled vertical twig alone is not enough support.
export function supportedArea(density,index,x,y,z,radius){
 let occupied=0,total=0;
 for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
  if(dx*dx+dz*dz>radius*radius)continue;total++;
  if(Math.max(density[index(x+dx,y-1,z+dz)],density[index(x+dx,y,z+dz)],density[index(x+dx,y+1,z+dz)])>=3)occupied++;
 }
 return occupied/total;
}

export function hasOverheadFoliage(density,index,x,y,z,cells){
 for(let dy=1;dy<=cells;dy++)if(density[index(x,y+dy,z)]>=3)return true;
 return false;
}

export function capField(radialSquared,height,depth){
 // A compacted base follows the support. The rounded top is much deeper than
 // the underside, avoiding the spherical envelopes of a metaball deposit.
 if(radialSquared>=1)return 0;
 const top=depth*(1-.35*radialSquared);
 return Math.max(0,Math.min(1-radialSquared,(height+.018)/.025,(top-height)/.035))*100;
}

const rays=Array.from({length:8},(_,i)=>{const u=(i+.5)/8,a=i*2.399963229728653;return [Math.sqrt(u)*Math.cos(a),Math.sqrt(u)*Math.sin(a),Math.sqrt(1-u)];});
export function ambientVisibility(x,y,z,nx,ny,nz,isSolid){
 // Cosine-distributed rays estimate the fraction of ambient light reaching
 // this surface. This is baked once, rather than tracing the forest at runtime.
 let tx,ty,tz;
 if(Math.abs(ny)<.9){const l=Math.hypot(nx,nz);tx=nz/l;ty=0;tz=-nx/l;}
 else{const l=Math.hypot(ny,nz);tx=0;ty=-nz/l;tz=ny/l;}
 const bx=ny*tz-nz*ty,by=nz*tx-nx*tz,bz=nx*ty-ny*tx;
 let blocked=0;
 for(const [a,b,c] of rays){
  const dx=tx*a+bx*b+nx*c,dy=ty*a+by*b+ny*c,dz=tz*a+bz*b+nz*c;
  for(const d of [.05,.1,.19,.32])if(isSolid(x+nx*.035+dx*d,y+ny*.035+dy*d,z+nz*.035+dz*d)){blocked++;break;}
 }
 return Math.max(.2,1-blocked/rays.length);
}

export function smoothVisibility(values,indices,iterations=12){
 let current=new Float32Array(values),next=new Float32Array(values.length);
 const weights=new Float32Array(values.length);for(const i of indices)weights[i]+=2;
 for(let pass=0;pass<iterations;pass++){
  for(let i=0;i<current.length;i++)next[i]=current[i]*weights[i];
  for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];next[a]+=current[b]+current[c];next[b]+=current[a]+current[c];next[c]+=current[a]+current[b];}
  for(let i=0;i<next.length;i++)next[i]=weights[i]?next[i]/(weights[i]*2):current[i];
  [current,next]=[next,current];
 }
 return current;
}
