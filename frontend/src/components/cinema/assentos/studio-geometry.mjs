// Geometria, materiais e primitivas do CineAstra Studio v2.
const COLOR={velvet:'#8d475a',navy:'#506a89',gold:'#c6a06b',charcoal:'#494d59',teal:'#3e8a87',orange:'#c58051',cream:'#d0bd9e',wood:'#865c45',black:'#343743'};
function hexRgb(hex){if(!/^#[0-9a-f]{6}$/i.test(hex||''))hex='#777988';return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
function alter(c,k=1){const v=hexRgb(c);return v.map(x=>Math.min(1,Math.max(0,x*k)))}
function parts(o,environment){
 const q=[],col=o.color||COLOR.charcoal;
 const add=(geo,p,s,c=col,rot=0,a=1)=>q.push({geo,p,s,c,rot,a});
 const B=(p,s,c=col)=>add('box',p,s,c),C=(p,s,c=col)=>add('cyl',p,s,c),S=(p,s,c=col)=>add('sphere',p,s,c);
 const metal='#313743',chrome='#94a0ac',trim='#e0b77c',dark='#232833';
 switch(o.type){
  case 'seat':case 'vip':{
   if(environment==='stadium'&&o.type==='seat'&&o.label?.startsWith('Setor ')){
    B([0,.25,0],[1.54,.5,1.38],alter(col,.68));B([0,.7,.24],[1.43,.32,.93],col);B([0,1.12,-.47],[1.43,1.03,.29],alter(col,1.1));break;
   }
   const vip=o.type==='vip',w=vip?2.24:1.76,edge=w/2;
   B([0,.57,-.02],[w,.48,1.63],alter(col,.62));
   S([0,.97,.23],[w*.86,.42,1.37],alter(col,1.16));
   B([0,1.76,-.59],[w*.86,1.79,.37],alter(col,.72));
   S([0,1.8,-.35],[w*.79,1.55,.27],alter(col,1.1));
   S([0,2.61,-.53],[w*.79,.39,.39],alter(col,1.18));
   for(const side of[-1,1]){
    B([side*(edge+.04),1.10,.15],[.3,.53,1.49],dark);
    B([side*(edge+.04),1.4,.17],[.38,.16,1.48],alter(col,.96));
    B([side*(edge-.13),.29,.04],[.18,.58,.27],metal);
    B([side*(edge-.2),.22,.48],[.14,.45,.25],metal);
    if(vip){C([side*(edge+.06),1.49,.76],[.29,.035,.29],chrome);C([side*(edge+.06),1.52,.76],[.18,.025,.18],dark)}
   }
   if(vip){S([0,1.66,-.22],[w*.57,.38,.15],alter(col,1.31));B([0,.63,1.19],[w*.85,.19,.62],alter(col,.83));B([0,.59,1.52],[w*.71,.11,.2],chrome)}
   else{B([0,.41,-.04],[w*.61,.11,.97],metal);}
   break;
  }
  case 'bench':{
   B([0,.82,.1],[3.6,.2,1.04],alter(col,1.15));
   for(const z of[-.42,.05,.46])B([0,.93,z],[3.45,.09,.19],alter(col,1.34));
   B([0,1.63,-.55],[3.55,1.34,.18],alter(col,.66));
   for(const y of[1.28,1.56,1.85])B([0,y,-.42],[3.55,.14,.21],alter(col,1.14));
   for(const x of[-1.37,1.37]){
    B([x,.39,.24],[.18,.7,.58],metal);B([x,1.13,-.49],[.18,.95,.18],metal)
   }
   break;
  }
  case 'car':{
   // Frente do automóvel = eixo +Z; nos templates o carro gira para a tela (-Z).
   B([0,.81,0],[3.55,.82,5.7],alter(col,.92));
   B([0,.50,0],[3.65,.23,5.55],dark);
   B([0,1.48,-.32],[2.72,.87,2.8],alter(col,1.12));
   B([0,1.85,-.36],[2.64,.22,2.15],alter(col,.88));
   B([0,1.44,.98],[2.5,.69,.09],'#6999aa');
   B([0,1.43,-1.70],[2.5,.68,.08],'#577b8e');
   for(const x of[-1.81,1.81]){
    for(const z of[-1.9,1.78]){
     S([x,.52,z],[.68,.81,1.05],'#1d222c');
     C([x*1.01,.52,z],[.38,.14,.38],chrome);
    }
    B([x*.71,1.13,.22],[.12,.14,.6],chrome);
    B([x*.78,.84,2.87],[.7,.28,.13],'#f4dcab');
    B([x*.78,.86,-2.85],[.68,.22,.12],'#ac3440');
    B([x*.81,1.42,.67],[.18,.31,.19],dark);
   }
   B([0,.74,2.88],[1.25,.34,.08],dark);B([0,.91,-2.87],[2.9,.13,.07],chrome);
   B([0,.46,2.92],[3.12,.16,.19],metal);
   break;
  }
  case 'screen':{
   // Moldura externa, projeção e duas colunas de sustentação; sem flutuar fora da sala.
   B([0,3.65,0],[12.6,7.15,.55],'#171c27');
   B([0,3.66,.33],[11.95,6.52,.13],trim);
   B([0,3.66,.44],[11.63,6.22,.13],'#29465b');
   B([0,3.66,.515],[11.15,5.87,.045],alter(col,1.24));
   B([0,7.25,0],[12.9,.18,.76],dark);
   B([0,.22,.23],[12.75,.23,.82],metal);
   for(const x of[-5.6,5.6])B([x,1.5,-.32],[.36,3,.32],metal);
   break;
  }
  case 'stage':{
   B([0,.55,0],[10,1.08,7],alter(col,.78));
   B([0,1.1,0],[10.3,.19,7.26],alter(col,1.34));
   B([0,.60,3.56],[10.35,.25,.22],trim);
   for(let i=0;i<3;i++)B([0,.14+i*.14,4.6-i*.46],[4.3,.24,1.0],alter(col,.71+i*.13));
   for(const x of[-4.7,4.7]){
    B([x,3.45,-3.5],[.40,4.35,.35],metal);
    C([x,5.67,-3.5],[.63,.3,.63],trim);
   }
   B([0,5.78,-3.5],[10,.34,.42],metal);
   break;
  }
  case 'stage360':{
   C([0,.48,0],[9.7,.95,9.7],dark);
   C([0,.98,0],[10.1,.15,10.1],chrome);
   C([0,1.08,0],[9.5,.13,9.5],col);
   C([0,1.17,0],[8.2,.10,8.2],alter(col,1.24));
   for(const [x,z] of[[4.9,0],[-4.9,0],[0,4.9],[0,-4.9]]){
    B([x,2.9,z],[.28,3.4,.28],metal);
    C([x,4.6,z],[.6,.16,.6],trim)
   }
   break;
  }
  case 'curtain':{
   B([0,4.1,0],[6.1,7.8,.3],alter(col,.65));
   for(let i=0;i<10;i++){
    const x=-2.75+i*.61;
    B([x,4.07,.20],[.25,7.7,.32],i%2?alter(col,.9):alter(col,1.2));
   }
   B([0,8.1,.25],[6.7,.28,.61],trim);
   B([0,.2,.30],[6.4,.15,.48],alter(col,.74));
   break;
  }
  case 'speaker':{
   B([0,1.15,0],[1.62,2.45,1.3],metal);
   B([0,1.17,.68],[1.44,2.2,.09],'#121721');
   C([0,.85,.76],[1.14,.09,1.14],chrome);
   C([0,.85,.84],[.81,.095,.81],dark);
   C([0,1.72,.78],[.59,.12,.59],chrome);
   C([0,1.72,.84],[.40,.14,.40],dark);
   B([0,2.4,.1],[1.56,.09,1.36],trim);
   break;
  }
  case 'podium':{
   B([0,.83,0],[1.02,1.6,.92],alter(col,.75));
   B([0,1.68,-.24],[1.85,.25,1.35],alter(col,1.30));
   B([0,.11,.03],[1.38,.2,1.3],dark);
   B([0,1.86,-.45],[1.25,.04,.12],trim);
   break;
  }
  case 'wall':{
   // Unidade de modelagem em metros; o tamanho é controlado somente por sx/sy/sz.
   B([0,.5,0],[1,1,1],col);
   B([0,.985,0],[1.005,.03,1.005],alter(col,1.23));
   break;
  }
  case 'floor':B([0,0,0],[1,.5,1],col);break;
  case 'bleacher':{
   B([0,.12,0],[1,.54,1],col);
   B([0,.41,0],[1,.065,1],alter(col,1.26));
   B([0,.26,-.49],[1,.22,.035],alter(col,.7));
   B([0,.24,.49],[1,.16,.04],trim);
   break;
  }
  case 'riser':{
   B([0,.0,0],[1,.35,1],col);
   B([0,.18,0],[1,.045,1],alter(col,1.2));
   B([0,.02,.49],[1,.12,.025],trim);
   break;
  }
  case 'aisle':{
   B([0,0,0],[1,.04,1],col);
   B([-.49,.04,0],[.017,.012,1],trim);
   B([.49,.04,0],[.017,.012,1],trim);
   break;
  }

  case 'turf':{
   const chalk='#f0eee1';
   B([0,.01,0],[46,.12,73],col);
   for(let stripe=0;stripe<8;stripe++)if(stripe%2===0)B([0,.073,(stripe-3.5)*9],[45.9,.013,9],alter(col,1.09));
   B([0,.094,0],[44.16,.02,.15],chalk);
   for(const side of [-1,1]){
    B([0,.094,side*35],[44.16,.02,.17],chalk);
    B([side*22,.094,0],[.17,.02,70],chalk);
    for(const [halfWidth,depth] of [[12.5,11],[5.7,3.6]]){
     B([0,.095,side*(35-depth)],[halfWidth*2,.02,.17],chalk);
     for(const x of [-halfWidth,halfWidth])B([x,.095,side*(35-depth/2)],[.16,.02,depth],chalk);
    }
    for(const x of [-2.6,2.6])B([x,.87,side*35.5],[.18,1.65,.18],chalk);
    B([0,1.68,side*35.5],[5.4,.17,.18],chalk);
    B([0,.095,side*27.5],[.28,.02,.28],chalk);
   }
   C([0,.105,0],[5.05,.015,5.05],chalk);
   C([0,.117,0],[4.88,.015,4.88],col);
   B([0,.127,0],[.26,.018,.26],chalk);
   break;
  }
  case 'door':{
   B([0,2,0],[2.3,4,.3],col);
   B([-1.25,2,0],[.18,4.45,.48],metal);B([1.25,2,0],[.18,4.45,.48],metal);
   B([0,4.19,0],[2.7,.16,.48],metal);
   B([0,2,.2],[1.83,3.7,.1],alter(col,.9));
   S([.75,1.97,.33],[.13,.13,.14],trim);
   break;
  }
  case 'barrier':{
   for(let x=-1.5;x<=1.5;x+=.75)C([x,.9,0],[.13,1.8,.13],metal);
   for(const y of[.68,1.57])B([0,y,0],[3.5,.10,.17],col);
   break;
  }
  case 'light':{
   C([0,2.65,0],[.17,5.25,.17],metal);
   B([0,5.2,0],[2.0,.3,.95],col);
   B([0,5.21,.52],[1.7,.24,.08],'#fff4cf');
   B([0,.13,0],[.68,.24,.68],dark);
   for(const x of[-.65,0,.65])B([x,5.32,.52],[.13,.19,.05],'#f9e6b9');
   break;
  }
  case 'sconce':{
   B([0,3.2,0],[.15,.45,.55],metal);
   B([0,3.33,.0],[.58,.47,.68],col);
   B([0,3.42,.39],[.46,.29,.06],'#fff0ba');
   B([0,3.71,.0],[.66,.08,.75],alter(col,.83));
   break;
  }
  case 'ceiling-light':{
   B([0,5.04,0],[4.35,.2,.9],metal);
   B([0,4.91,0],[3.86,.09,.70],col);
   B([0,4.85,0],[3.5,.04,.50],'#fff2cc');
   break;
  }
  case 'rib':{
   B([0,2.7,0],[.2,5.4,.22],col);
   B([0,5.35,0],[.31,.08,.26],alter(col,1.25));
   break;
  }
  case 'column':{
   C([0,2.6,0],[.8,5.2,.8],col);
   C([0,5.23,0],[1.25,.24,1.25],trim);
   C([0,.2,0],[1.1,.4,1.1],metal);
   break;
  }
  case 'tree':{
   C([0,1.8,0],[.65,3.6,.65],'#715a44');
   S([0,4.85,0],[4.2,4.15,4.2],alter(col,.9));
   S([-1.12,4.0,.6],[2.65,2.75,2.75],col);
   S([1.05,5.2,-.3],[2.8,2.9,2.85],alter(col,1.13));
   break;
  }
  case 'planter':{
   B([0,.43,0],[3.2,.85,1.75],'#7b6559');
   B([0,.88,0],[3.28,.16,1.82],alter(col,.7));
   B([0,.99,0],[2.85,.13,1.49],'#3b4438');
   for(const x of[-.94,0,.94])S([x,1.51,0],[1.03,1.19,1.05],col);
   break;
  }
 }
 return q;
}
function applyPart(o,p){const s=[p.s[0]*o.sx,p.s[1]*o.sy,p.s[2]*o.sz],x=p.p[0]*o.sx,y=p.p[1]*o.sy,z=p.p[2]*o.sz,r=o.rotation;return{geo:p.geo,pos:[o.x+x*Math.cos(r)+z*Math.sin(r),o.y+y,o.z-x*Math.sin(r)+z*Math.cos(r)],scale:s,color:p.c,rot:r+p.rot,alpha:p.a,id:o.id}}

const V={add:(a,b)=>a.map((v,i)=>v+b[i]),sub:(a,b)=>a.map((v,i)=>v-b[i]),scale:(v,k)=>v.map(x=>x*k),dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length:v=>Math.hypot(...v),norm:v=>{let l=Math.hypot(...v)||1;return v.map(x=>x/l)}};
const Mat={model(p,s,a=0){const c=Math.cos(a),n=Math.sin(a);return new Float32Array([c*s[0],0,-n*s[0],0,0,s[1],0,0,n*s[2],0,c*s[2],0,p[0],p[1],p[2],1])},lookAt(eye,target,up=[0,1,0]){const z=V.norm(V.sub(eye,target)),x=V.norm(V.cross(up,z)),y=V.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-V.dot(x,eye),-V.dot(y,eye),-V.dot(z,eye),1])},perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0])}};
export function studioGraphics(gl){
const shaders={vertex:`attribute vec3 aPos;attribute vec3 aNormal;uniform mat4 uProj,uView,uModel;varying vec3 vNormal;varying vec3 vWorld;void main(){vec4 w=uModel*vec4(aPos,1.0);vWorld=w.xyz;vNormal=mat3(uModel)*aNormal;gl_Position=uProj*uView*w;}`,fragment:`precision mediump float;varying vec3 vNormal;varying vec3 vWorld;uniform vec3 uColor,uPickColor,uBackdrop;uniform float uPick,uAlpha;uniform vec3 uCamera;void main(){if(uPick>0.5){gl_FragColor=vec4(uPickColor,1.0);return;}vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-0.55,0.95,0.5));float diffuse=max(dot(n,light),0.0);float fill=max(dot(n,normalize(vec3(0.7,.5,-.4))),0.0);float intensity=0.47+0.39*diffuse+0.15*fill;vec3 c=uColor*intensity;float dist=length(uCamera-vWorld);float fog=clamp((dist-52.0)/190.0,0.0,.28);c=mix(c,uBackdrop,fog);gl_FragColor=vec4(c,uAlpha);}`};
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
let program,loc={},meshes={};
function compile(){program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,shaders.vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,shaders.fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);for(const n of ['aPos','aNormal'])loc[n]=gl.getAttribLocation(program,n);for(const n of ['uProj','uView','uModel','uColor','uPickColor','uPick','uAlpha','uCamera','uBackdrop'])loc[n]=gl.getUniformLocation(program,n);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}
function mesh(vertices,normals){const b=gl.createBuffer(),n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);return{buffer:b,normal:n,count:vertices.length/3}}
function addFace(v,n,corners,normal){const ids=[0,1,2,0,2,3];for(const i of ids){v.push(...corners[i]);n.push(...normal)}}
function boxMesh(){const v=[],n=[];const p=[-.5,.5];addFace(v,n,[[p[1],p[0],p[1]],[p[1],p[1],p[1]],[p[0],p[1],p[1]],[p[0],p[0],p[1]]],[0,0,1]);addFace(v,n,[[p[0],p[0],p[0]],[p[0],p[1],p[0]],[p[1],p[1],p[0]],[p[1],p[0],p[0]]],[0,0,-1]);addFace(v,n,[[p[0],p[0],p[1]],[p[0],p[1],p[1]],[p[0],p[1],p[0]],[p[0],p[0],p[0]]],[-1,0,0]);addFace(v,n,[[p[1],p[0],p[0]],[p[1],p[1],p[0]],[p[1],p[1],p[1]],[p[1],p[0],p[1]]],[1,0,0]);addFace(v,n,[[p[0],p[1],p[1]],[p[1],p[1],p[1]],[p[1],p[1],p[0]],[p[0],p[1],p[0]]],[0,1,0]);addFace(v,n,[[p[0],p[0],p[0]],[p[1],p[0],p[0]],[p[1],p[0],p[1]],[p[0],p[0],p[1]]],[0,-1,0]);return mesh(v,n)}
function cylMesh(nsegments=12){let v=[],norm=[];for(let i=0;i<nsegments;i++){const a=i*Math.PI*2/nsegments,b=(i+1)*Math.PI*2/nsegments,c=Math.cos(a),s=Math.sin(a),d=Math.cos(b),t=Math.sin(b);const sides=[[c,-.5,s],[c,.5,s],[d,.5,t],[d,-.5,t]];for(let k of [0,1,2,0,2,3]){v.push(...sides[k]);let nn=k<2?[c,0,s]:[d,0,t];norm.push(...nn)}for(const [y,flip] of [[.5,false],[-.5,true]]){const tri=flip?[[0,y,0],[c,y,s],[d,y,t]]:[[0,y,0],[d,y,t],[c,y,s]];for(const p of tri){v.push(...p);norm.push(0,flip?-1:1,0)}}}return mesh(v,norm)}
function sphereMesh(){let v=[],n=[];const lats=10,lons=12;function pt(th,ph){return[Math.sin(th)*Math.cos(ph)*.5,Math.cos(th)*.5,Math.sin(th)*Math.sin(ph)*.5]}for(let i=0;i<lats;i++)for(let j=0;j<lons;j++){const a=pt(i*Math.PI/lats,j*2*Math.PI/lons),b=pt((i+1)*Math.PI/lats,j*2*Math.PI/lons),c=pt((i+1)*Math.PI/lats,(j+1)*2*Math.PI/lons),d=pt(i*Math.PI/lats,(j+1)*2*Math.PI/lons);for(const p of[a,c,b,a,d,c]){v.push(...p);n.push(...V.norm(p))}}return mesh(v,n)}
function draw(geometry,position,scale,color,rotation=0,id=0,alpha=1,picking=false){const m=meshes[geometry];gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.enableVertexAttribArray(loc.aPos);gl.vertexAttribPointer(loc.aPos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,m.normal);gl.enableVertexAttribArray(loc.aNormal);gl.vertexAttribPointer(loc.aNormal,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(loc.uModel,false,Mat.model(position,scale,rotation));gl.uniform3fv(loc.uColor,typeof color==='string'?hexRgb(color):color);gl.uniform3fv(loc.uPickColor,[(id&255)/255,((id>>8)&255)/255,((id>>16)&255)/255]);gl.uniform1f(loc.uPick,picking?1:0);gl.uniform1f(loc.uAlpha,alpha);gl.drawArrays(gl.TRIANGLES,0,m.count)}

compile();meshes={box:boxMesh(),cyl:cylMesh(),sphere:sphereMesh()};
return {program,loc,draw,dispose(){for(const m of Object.values(meshes)){gl.deleteBuffer(m.buffer);gl.deleteBuffer(m.normal);}gl.deleteProgram(program);}};
}
export {V,Mat,hexRgb};
export const studioParts=(object,environment)=>parts(object,environment).map(part=>applyPart(object,part));
