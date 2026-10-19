import * as THREE from 'three';
// The scanned atlas contains opaque UV-padding outside each black-backed twig.
// Isolate the connected needle silhouette from its stem, excluding unrelated
// opaque UV padding even when that padding is an island inside the atlas. This prevents UV-padding triangles appearing on the cards.
export function needleCutout(diffuse,alpha,rect={x:.648,y:.348,w:.295,h:.175}){
 const canvas=document.createElement('canvas');canvas.width=alpha.width;canvas.height=alpha.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(alpha,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,w=canvas.width,h=canvas.height;
 const selected=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const cx=Math.round(w*.78),cy=Math.round(h*.435);let seed=-1,best=Infinity;
 for(let y=cy-32;y<=cy+32;y++)for(let x=cx-32;x<=cx+32;x++){const i=y*w+x,d=(x-cx)**2+(y-cy)**2;if(pixels[i*4+1]>128&&d<best){best=d;seed=i;}}
 if(seed<0)throw new Error('The photographed needle silhouette could not be isolated.');
 const add=i=>{if(i>=0&&i<w*h&&!selected[i]&&pixels[i*4+1]>96){selected[i]=1;queue[tail++]=i;}};
 add(seed);while(head<tail){const i=queue[head++],x=i%w;if(x>0)add(i-1);if(x<w-1)add(i+1);if(i>=w)add(i-w);if(i<(h-1)*w)add(i+w);}
 context.clearRect(0,0,w,h);context.drawImage(diffuse,0,0);const colors=context.getImageData(0,0,w,h);
 const x0=Math.floor(rect.x*w),y0=Math.floor(rect.y*h),cw=Math.floor(rect.w*w),ch=Math.floor(rect.h*h);
 const output=document.createElement('canvas');output.width=cw;output.height=ch;const outContext=output.getContext('2d'),image=outContext.createImageData(cw,ch);
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const source=(y0+y)*w+x0+x,dest=(y*cw+x)*4;image.data[dest]=colors.data[source*4];image.data[dest+1]=colors.data[source*4+1];image.data[dest+2]=colors.data[source*4+2];image.data[dest+3]=selected[source]?pixels[source*4+1]:0;}
 outContext.putImageData(image,0,0);const texture=new THREE.CanvasTexture(output);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
