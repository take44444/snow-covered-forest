import fs from 'node:fs';
const gltf=JSON.parse(fs.readFileSync('.cache/fir/fir.gltf','utf8')),bin=fs.readFileSync('.cache/fir/fir.bin');
function values(id){const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView],Type={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];return new Type(bin.buffer,bin.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count*size);}
for(let t=0;t<3;t++){
 const p=gltf.meshes[t].primitives.find(p=>gltf.materials[p.material].name.endsWith('_twig')),n=gltf.accessors[p.attributes.POSITION].count,idx=values(p.indices),parent=new Uint32Array(n);for(let i=0;i<n;i++)parent[i]=i;
 const root=a=>{while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;};
 for(let i=0;i<idx.length;i+=3){const a=root(idx[i]),b=root(idx[i+1]),c=root(idx[i+2]);parent[b]=a;parent[c]=a;}
 const counts=new Uint32Array(n);for(let i=0;i<idx.length;i+=3)counts[root(idx[i])]++;
 const histogram={};let components=0;for(let i=0;i<n;i++)if(counts[i]){components++;histogram[counts[i]]=(histogram[counts[i]]||0)+1;}
 console.log({tree:t,vertices:n,triangles:idx.length/3,components,histogram});
}
