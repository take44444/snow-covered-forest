export const WORLD_RADIUS = 100;
export const WARNING_RADIUS = 88;
export function randomGenerator(seed = 7421) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hash = (x,z) => { const n=Math.sin(x*127.1+z*311.7)*43758.5453; return n-Math.floor(n); };
const smooth = t => t*t*(3-2*t);
export function noise(x,z) {
 const ix=Math.floor(x), iz=Math.floor(z), fx=smooth(x-ix), fz=smooth(z-iz);
 return (hash(ix,iz)*(1-fx)+hash(ix+1,iz)*fx)*(1-fz)+(hash(ix,iz+1)*(1-fx)+hash(ix+1,iz+1)*fx)*fz;
}
export function terrainHeight(x,z) {
 return noise(x*.018,z*.018)*8 + noise(x*.055+15,z*.055)*2.8 + noise(x*.19,z*.19)*.32 + Math.sin(x*.045+z*.025)*1.2 - 5;
}
export function snowHeight(x,z) { return terrainHeight(x,z)+noise(x*.65,z*.65)*.055; }
export function constrainPosition(p) {
 const distance=Math.hypot(p.x,p.z);
 if(distance>WORLD_RADIUS) { p.x*=WORLD_RADIUS/distance; p.z*=WORLD_RADIUS/distance; }
 p.y=Math.max(snowHeight(p.x,p.z)+.25,Math.min(65,p.y));
 return p;
}
export function movementSpeed(keys) { return keys.has('AltLeft')||keys.has('AltRight') ? .8 : keys.has('ShiftLeft')||keys.has('ShiftRight') ? 14 : 4; }
export function forestLayout() {
 const r=randomGenerator(893); const trees=[];
 for(let i=0;i<1050;i++) {
  const a=r()*Math.PI*2, radius=Math.sqrt(r())*175, x=Math.cos(a)*radius,z=Math.sin(a)*radius;
  const trail=Math.sin(z*.028)*9;
  if(Math.abs(x-trail)<3.0 && z<40 && z>-65) continue;
  if(Math.hypot(x-3,z-11)<6) continue;
  if(trees.some(t=>(t.x-x)**2+(t.z-z)**2<8)) continue;
  trees.push({x,z,y:terrainHeight(x,z)-.12,height:10+r()*12,variant:Math.floor(r()*6),angle:r()*Math.PI*2,width:.8+r()*.5});
 }
 return trees;
}
