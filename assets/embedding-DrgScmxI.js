import{W as ze,d as ge,S as Ue,P as Ye,e as Z,f as M,c as _e,L as we,g as Xe,N as Ve,h as xe,i as ke,j as Qe,k as We,G as Oe,C as te,V as Me,b as je}from"./three.module-D4kkC7wv.js";const be=5,Ae=["who is egor?","fastapi + pgvector","k-nn cosine","build a rag bot"],S=[{id:"backend",center:[1.6,.4,.2]},{id:"llm",center:[-.2,1.5,.8]},{id:"rag",center:[-1.5,.3,.4]},{id:"ml",center:[.3,-1.4,.6]},{id:"mobile",center:[1.1,-.6,-1.3]},{id:"data",center:[-.9,-.2,-1.4]}],Se=["0","1","·","+","*","▪",":"],Pe=["fastapi","rag","attention","vector","torch","sql"],ee=8,He=2,v=128;function Q(t,o){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()||o}function P(t){const o=new te(t);return new Me(o.r,o.g,o.b)}function Ne(t){return()=>{t|=0,t=t+1831565813|0;let o=Math.imul(t^t>>>15,1|t);return o=o+Math.imul(o^o>>>7,61|o)^o,((o^o>>>14)>>>0)/4294967296}}function Ie(){const t=document.createElement("canvas");t.width=ee*v,t.height=He*v;const o=t.getContext("2d");return o&&(o.clearRect(0,0,t.width,t.height),o.textAlign="center",o.textBaseline="middle",o.fillStyle="#ffffff",[...Se,"",...Pe].forEach((g,m)=>{if(!g)return;const p=m%ee,u=Math.floor(m/ee),i=p*v+v/2,F=u*v+v/2;o.font=g.length>1?`600 ${Math.floor(v*.22)}px ui-monospace, monospace`:`600 ${Math.floor(v*.55)}px ui-monospace, monospace`,o.fillText(g,i,F)})),t}function Ce(){return{ink:Q("--ink","#f3efe8"),accent:Q("--accent","#c4562a"),accent2:Q("--accent-2","#d9a066"),faint:Q("--ink-faint","#7f7972")}}const Ke=`
  attribute float aGlyph;
  attribute float aBoost;
  uniform float uSize;
  uniform float uDpr;
  varying float vGlyph;
  varying float vBoost;
  varying float vDepth;
  void main() {
    vGlyph = aGlyph;
    vBoost = aBoost;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = clamp((-mv.z - 2.0) / 6.0, 0.0, 1.0);
    gl_PointSize = uSize * uDpr * mix(0.55, 1.45, 1.0 - vDepth) * mix(1.0, 1.7, vBoost);
    gl_Position = projectionMatrix * mv;
  }
`,$e=`
  uniform sampler2D uAtlas;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform vec3 uCaramel;
  varying float vGlyph;
  varying float vBoost;
  varying float vDepth;
  void main() {
    float cols = 8.0;
    float rows = 2.0;
    float idx = floor(vGlyph + 0.5);
    float col = mod(idx, cols);
    float row = floor(idx / cols);
    vec2 uv = vec2((col + gl_PointCoord.x) / cols, (row + gl_PointCoord.y) / rows);
    vec4 glyph = texture2D(uAtlas, uv);
    if (glyph.a < 0.12) discard;
    vec3 color = mix(uColor, mix(uCaramel, uAccent, 0.35), vBoost);
    float alpha = glyph.a * mix(0.22, 0.95, 1.0 - vDepth);
    gl_FragColor = vec4(color, alpha);
  }
`;function Ze(t,o){const d=new ze({canvas:t,antialias:!1,alpha:!0,powerPreference:"high-performance"});d.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),d.setClearColor(0,0),d.outputColorSpace=ge;const g=new Ue,m=new Ye(42,1,.1,40);m.position.set(0,0,6.2);const p=o.mobile?760:2048,u=Ne(1337),i=new Float32Array(p*3),F=new Float32Array(p),R=new Float32Array(p),Le=new Uint8Array(p),oe=S.map(()=>0);for(let e=0;e<p;e++){const a=e%S.length;Le[e]=a,oe[a]+=1;const r=S[a].center,c=.55+u()*.25;i[e*3]=r[0]+(u()-.5)*c*2.4,i[e*3+1]=r[1]+(u()-.5)*c*2.4,i[e*3+2]=r[2]+(u()-.5)*c*2.4;const s=u()<.08;F[e]=s?8+Math.floor(u()*Pe.length):Math.floor(u()*Se.length)}const L=new Z;L.setAttribute("position",new M(i,3)),L.setAttribute("aGlyph",new M(F,1));const W=new M(R,1);L.setAttribute("aBoost",W);const w=new _e(Ie());w.colorSpace=ge,w.minFilter=we,w.magFilter=we,w.needsUpdate=!0;const E=Ce(),B={uAtlas:{value:w},uSize:{value:o.mobile?14:18},uDpr:{value:Math.min(2,window.devicePixelRatio||1)},uColor:{value:P(E.ink)},uAccent:{value:P(E.accent)},uCaramel:{value:P(E.accent2)}},ne=new Xe({uniforms:B,vertexShader:Ke,fragmentShader:$e,transparent:!0,depthWrite:!1,blending:Ve}),Ee=new xe(L,ne),D=new Z;D.setAttribute("position",new M(new Float32Array(3),3));const x=new ke({color:E.accent,size:18,sizeAttenuation:!1,transparent:!0,opacity:0}),Be=new xe(D,x),h=new Float32Array(be*6),T=new Z;T.setAttribute("position",new M(h,3));const G=new Qe({color:E.accent,transparent:!0,opacity:0}),Ge=new We(T,G),y=new Oe;y.add(Ee),y.add(Be),y.add(Ge),g.add(y);let z=1,U=1,Y=!0,ie=o.reduced,O=0,_=!1,j=0,H=.12,q=.0018,N=0,X=!1,I=0,K=0,b=null,re=0,ae=0,ce=performance.now()+1600;const A=new je(-10,-10),$=new Me,J=(e,a,r)=>($.set(e,a,r).applyMatrix4(y.matrixWorld).project(m),{x:($.x*.5+.5)*z,y:(-$.y*.5+.5)*U}),qe=()=>{const e=Ce();B.uColor.value=P(e.ink),B.uAccent.value=P(e.accent),B.uCaramel.value=P(e.accent2),x.color=new te(e.accent),G.color=new te(e.accent)},se=()=>{const e=t.parentElement??t;z=Math.max(1,e.clientWidth),U=Math.max(1,e.clientHeight),d.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),B.uDpr.value=Math.min(2,window.devicePixelRatio||1),d.setSize(z,U,!1),m.aspect=z/U,m.updateProjectionMatrix()},le=()=>{x.opacity=0,G.opacity=0,R.fill(0),W.needsUpdate=!0,o.onQuery(null)},Fe=e=>{const a=Ae[re%Ae.length];re+=1;const r=Math.floor(u()*p),c=i[r*3],s=i[r*3+1],f=i[r*3+2],k=Math.hypot(c,s,f)||1,C=[];for(let n=0;n<p;n++){if(n===r)continue;const l=i[n*3],he=i[n*3+1],ye=i[n*3+2],De=Math.hypot(l,he,ye)||1,Te=(l*c+he*s+ye*f)/(De*k);C.push({i:n,s:Te})}C.sort((n,l)=>l.s-n.s);const ve=C.slice(0,be);R.fill(0),D.setAttribute("position",new M(new Float32Array([c,s,f]),3)),ve.forEach((n,l)=>{R[n.i]=1,h[l*6]=c,h[l*6+1]=s,h[l*6+2]=f,h[l*6+3]=i[n.i*3],h[l*6+4]=i[n.i*3+1],h[l*6+5]=i[n.i*3+2]}),W.needsUpdate=!0,T.getAttribute("position").needsUpdate=!0,x.opacity=1,G.opacity=.7,ae=e+1500,ce=e+4e3,o.onQuery({text:a,query:J(c,s,f),neighbors:ve.map(n=>({...J(i[n.i*3],i[n.i*3+1],i[n.i*3+2]),score:Math.min(.99,Math.max(.72,n.s)).toFixed(2)}))})},Re=()=>{let e=-1,a=46;for(let s=0;s<S.length;s++){const f=S[s].center,k=J(f[0],f[1],f[2]),C=Math.hypot(k.x-A.x,k.y-A.y);C<a&&(a=C,e=s)}const r=e>=0?{id:S[e].id,n:oe[e]}:null;b?.id===r?.id&&b?.n===r?.n||(b=r,o.onCluster(b))},ue=e=>{O=requestAnimationFrame(ue),!(!Y||!_)&&(ie||(X||(j+=q,H+=N,q*=.96,N*=.96,Math.abs(q)<.0018&&(q=.0018)),y.rotation.y=j,y.rotation.x=H,e>ae&&x.opacity>0&&le(),e>=ce&&Fe(e)),d.render(g,m))},de=e=>{X=!0,I=e.clientX,K=e.clientY,t.style.cursor="grabbing",t.setPointerCapture(e.pointerId)},pe=e=>{const a=t.getBoundingClientRect();if(A.x=e.clientX-a.left,A.y=e.clientY-a.top,Re(),!X)return;const r=e.clientX-I,c=e.clientY-K;I=e.clientX,K=e.clientY,j+=r*.005,H+=c*.005,q=r*9e-4,N=c*9e-4},V=e=>{X=!1,t.style.cursor="grab";try{t.releasePointerCapture(e.pointerId)}catch{}},fe=()=>{A.x=-10,A.y=-10,b&&(b=null,o.onCluster(null))};t.style.cursor="grab",t.addEventListener("pointerdown",de),t.addEventListener("pointermove",pe),t.addEventListener("pointerup",V),t.addEventListener("pointerleave",fe),t.addEventListener("pointercancel",V);const me=()=>{_=document.visibilityState==="visible"&&Y};return document.addEventListener("visibilitychange",me),se(),_=document.visibilityState==="visible"&&Y,O=requestAnimationFrame(ue),{dispose:()=>{cancelAnimationFrame(O),document.removeEventListener("visibilitychange",me),t.removeEventListener("pointerdown",de),t.removeEventListener("pointermove",pe),t.removeEventListener("pointerup",V),t.removeEventListener("pointerleave",fe),t.removeEventListener("pointercancel",V),L.dispose(),ne.dispose(),w.dispose(),D.dispose(),x.dispose(),T.dispose(),G.dispose(),d.dispose()},resize:se,setActive:e=>{Y=e,_=e&&document.visibilityState==="visible"},setTheme:qe,setReduced:e=>{ie=e,e&&le()}}}export{Ae as QUERY_TEXTS,be as TOP_K,Ze as createEmbedding};
