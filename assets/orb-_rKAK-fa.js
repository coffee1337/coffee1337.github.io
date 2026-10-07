import{_ as Ue}from"./index-B29Jf8oD.js";function Xe(l){return l==="light"?{node:"#3a2f28",nodeDim:"#6e4fe0",link:"#2a241c",core:"#b6d234",field:"#8ea34a",shell:"#6e4fe0"}:{node:"#f3ede4",nodeDim:"#b7a6ff",link:"#8b6cff",core:"#d6f25c",field:"#9aaa4a",shell:"#8b6cff"}}function Ye(l,o){const e=new Float32Array(l*3),s=Math.PI*(3-Math.sqrt(5));for(let r=0;r<l;r++){const h=1-r/(l-1)*2,d=Math.sqrt(Math.max(0,1-h*h)),u=s*r,c=1+(r*37%17-8)/220;e[r*3]=Math.cos(u)*d*c,e[r*3+1]=h*c,e[r*3+2]=Math.sin(u)*d*c}return e}function qe(l,o,e){const s=[];for(let r=0;r<o;r++){let h=99,d=99,u=-1,c=-1;for(let y=r+1;y<o;y++){const C=l[r*3]-l[y*3],x=l[r*3+1]-l[y*3+1],F=l[r*3+2]-l[y*3+2],m=Math.sqrt(C*C+x*x+F*F);m<h?(d=h,c=u,h=m,u=y):m<d&&(d=m,c=y)}u>=0&&s.push({i:r,j:u,d:h}),c>=0&&d<.72&&s.push({i:r,j:c,d})}return s.sort((r,h)=>r.d-h.d),s.slice(0,e)}function Ie(l,o){const e=new Float32Array(l*3);for(let s=0;s<l;s++){const r=Math.random(),h=Math.random(),d=2*Math.PI*r,u=Math.acos(2*h-1),c=o*(.35+Math.random()*.75);e[s*3]=c*Math.sin(u)*Math.cos(d),e[s*3+1]=c*Math.sin(u)*Math.sin(d),e[s*3+2]=c*Math.cos(u)}return e}const Oe=`
  varying vec3 vNormal;
  varying vec3 vView;
  uniform float uTime;
  uniform float uAmp;
  void main() {
    vec3 p = position;
    float n = sin(p.x * 3.1 + uTime) * sin(p.y * 2.7 - uTime * 0.7) * sin(p.z * 3.4 + uTime * 0.4);
    p += normal * n * uAmp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`,Je=`
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uStrength;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.8);
    float alpha = (0.035 + fres * 0.22) * uStrength;
    gl_FragColor = vec4(uColor, alpha);
  }
`,Ke=`
  varying vec3 vNormal;
  varying vec3 vObj;
  varying vec3 vView;
  uniform float uTime;
  uniform float uAmp;
  void main() {
    vObj = position;
    float n = sin(position.y * 9.0 + uTime * 0.6) * sin(position.z * 8.0 - uTime * 0.4);
    vec3 p = position + normal * n * uAmp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`,Qe=`
  varying vec3 vNormal;
  varying vec3 vObj;
  varying vec3 vView;
  uniform vec3 uHot;
  uniform vec3 uMid;
  uniform vec3 uEdge;
  uniform vec3 uLight;
  uniform float uTime;
  uniform float uPulse;
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                  mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    return n;
  }
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float ndv = max(dot(n, v), 0.0);
    float fres = pow(1.0 - ndv, 1.7);
    float radial = clamp(length(vObj) / 0.2, 0.0, 1.0);
    float grain = noise(normalize(vObj) * 3.4 + vec3(uTime * 0.12, uLight.x * 0.4, 0.0));
    float filament = pow(0.5 + 0.5 * sin(vObj.y * 22.0 + grain * 5.0 + uTime * 0.7), 3.0);
    float flow = 0.5 + 0.5 * sin(dot(normalize(vObj), uLight) * 6.0 - uTime * 0.9);
    vec3 col = mix(uHot, uMid, smoothstep(0.05, 0.62, radial));
    col = mix(col, uEdge, smoothstep(0.38, 1.0, radial));
    col = mix(col, uHot, filament * 0.22 * (1.0 - radial));
    col += uHot * flow * 0.08 * (1.0 - radial);
    vec3 l = normalize(uLight);
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 18.0);
    float wrap = pow(max(dot(n, l), 0.0), 0.55);
    col *= 0.42 + 0.58 * wrap;
    col += uHot * spec * (0.45 + uPulse * 0.4);
    col += uMid * fres * (0.22 + uPulse * 0.2);
    gl_FragColor = vec4(col, 1.0);
  }
`,Ze=`
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uAlpha;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.1);
    float alpha = fres * 0.5 * uAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;async function et(l,o){const e=await Ue(()=>import("./three.module-Dcbj-bkz.js"),[]),s=o.mobile?70:130,r=Ye(s),h=Math.round(o.mobile?52:96),d=qe(r,s,h),u=new Float32Array(s*3),c=new Float32Array(s*3),y=new Float32Array(s),C=new Float32Array(s);for(let t=0;t<s;t++)C[t]=t*47%100/100;const x=new Float32Array(d.length*6),F=new Float32Array(d.length*6),m=new Float32Array(s*3),B=new e.WebGLRenderer({canvas:l,alpha:!0,antialias:!o.mobile,powerPreference:"high-performance"});B.setClearColor(0,0),B.setPixelRatio(Math.min(window.devicePixelRatio||1,o.mobile?1.25:1.5));const w=new e.Scene,J=new e.PerspectiveCamera(32,1,.1,20);J.position.set(0,.05,4.7),w.add(new e.AmbientLight(16777215,o.theme==="dark"?.35:.6));const be=new e.DirectionalLight(15986148,.7);be.position.set(2.2,1.6,3),w.add(be);const ge=new e.DirectionalLight(9137407,.45);ge.position.set(-2.5,-.4,-1.5),w.add(ge);const D=()=>Xe(z);let z=o.theme;const T=new e.BufferGeometry;T.setAttribute("position",new e.BufferAttribute(u,3)),T.setAttribute("color",new e.BufferAttribute(c,3)),T.setAttribute("size",new e.BufferAttribute(y,1));const oe=new e.PointsMaterial({size:o.mobile?.045:.034,vertexColors:!0,transparent:!0,opacity:.95,depthWrite:!1,sizeAttenuation:!0});w.add(new e.Points(T,oe));const E=new e.BufferGeometry;E.setAttribute("position",new e.BufferAttribute(x,3)),E.setAttribute("color",new e.BufferAttribute(F,3));const ae=new e.LineBasicMaterial({vertexColors:!0,transparent:!0,opacity:0,depthWrite:!1});w.add(new e.LineSegments(E,ae));const ie=o.mobile?36:70,re=Ie(ie,.85),K=new Float32Array(ie*3),Q=new e.BufferGeometry;Q.setAttribute("position",new e.BufferAttribute(K,3));const ne=new e.PointsMaterial({color:new e.Color(D().core),size:o.mobile?.012:.016,transparent:!0,opacity:.45,depthWrite:!1});w.add(new e.Points(Q,ne));const H={uTime:{value:0},uAmp:{value:o.mobile?.02:.045},uColor:{value:new e.Color(D().field)},uStrength:{value:o.theme==="dark"?.28:.16}},L=new e.Mesh(new e.SphereGeometry(.62,o.mobile?28:40,o.mobile?20:28),new e.ShaderMaterial({uniforms:H,vertexShader:Oe,fragmentShader:Je,transparent:!0,depthWrite:!1,side:e.FrontSide}));w.add(L);const k={uTime:{value:0},uAmp:{value:o.mobile?.004:.008},uHot:{value:new e.Color},uMid:{value:new e.Color},uEdge:{value:new e.Color},uLight:{value:new e.Vector3(.4,.5,1)},uPulse:{value:0}},Z=new e.Mesh(new e.SphereGeometry(.2,o.mobile?28:40,o.mobile?20:30),new e.ShaderMaterial({uniforms:k,vertexShader:Ke,fragmentShader:Qe}));w.add(Z);const W={uTime:{value:0},uAmp:{value:o.mobile?.012:.028},uColor:{value:new e.Color},uAlpha:{value:1}},R=new e.Mesh(new e.SphereGeometry(.33,o.mobile?28:42,o.mobile?20:32),new e.ShaderMaterial({uniforms:W,vertexShader:Oe,fragmentShader:Ze,transparent:!0,depthWrite:!1,side:e.DoubleSide}));w.add(R);const V=new e.Mesh(new e.SphereGeometry(.46,20,14),new e.MeshBasicMaterial({color:new e.Color(D().core),transparent:!0,opacity:.05,depthWrite:!1}));w.add(V);const _=new e.Mesh(new e.SphereGeometry(1.16,o.mobile?28:40,o.mobile?20:30),new e.MeshBasicMaterial({color:new e.Color(D().shell),transparent:!0,opacity:o.theme==="dark"?.05:.035,wireframe:!1,depthWrite:!1,side:e.BackSide}));w.add(_);let U=o.mode,n=o.reduced,se=!0,ye=!0,b=U==="assemble"?.05:1,X=b,$=U==="exit"?1:0,le=0,ce=0,G=0,Y=0,me=.35,ue=.45,N=0,xe=9+Math.random()*6;const Ae=new e.Clock,ee=new e.Color,te=new e.Color,Ce=new e.Color,ze=new e.Color,Se=new e.Color,ke=()=>{const t=D();Ce.set(t.node),ze.set(t.nodeDim),Se.set(t.core),ee.set(t.link),H.uColor.value.set(t.field),H.uStrength.value=z==="dark"?.28:.16;const i=z==="dark";k.uHot.value.set(i?"#f7f8c4":"#d7e45a"),k.uMid.value.set(i?"#b6d63a":"#7c9a1c"),k.uEdge.value.set(i?"#4e6820":"#3f5518"),W.uColor.value.set(i?"#d2e86a":"#6d8624"),W.uAlpha.value=i?.8:.55,V.material.color.set(i?"#d6f25c":"#8ea83a"),V.material.opacity=i?.035:.02,_.material.color.set(t.shell),_.material.opacity=z==="dark"?.05:.04};ke();const Pe=()=>{const t=l.parentElement,i=t?.clientWidth||l.clientWidth||320,he=t?.clientHeight||l.clientHeight||320;B.setPixelRatio(Math.min(window.devicePixelRatio||1,o.mobile?1.25:1.5)),B.setSize(i,he,!1),J.aspect=1,J.updateProjectionMatrix()};Pe();const Fe=()=>{ye=document.visibilityState==="visible"};document.addEventListener("visibilitychange",Fe);const Te=t=>{if(n||U!=="hero")return;const i=l.getBoundingClientRect();le=(t.clientX-i.left)/Math.max(i.width,1)*2-1,ce=(t.clientY-i.top)/Math.max(i.height,1)*2-1};window.addEventListener("pointermove",Te,{passive:!0});let P=0;const de=()=>{if(P=requestAnimationFrame(de),!se||!ye)return;const t=Math.min(Ae.getDelta(),.05),i=Ae.elapsedTime;X=o.getAssemble();const he=n?1:Math.min(1,t*1.8);b+=(X-b)*he;const Ee=U==="exit"?1:0;$+=(Ee-$)*Math.min(1,t*2.2);const j=1-$,De=(n?0:i*.07)+(n?0:le*.09),He=n?0:ce*.06;G+=(De-G)*(n?1:Math.min(1,t*1.6)),Y+=(He-Y)*(n?1:Math.min(1,t*1.6));const fe=.78+b*.3,Le=(1-b)*1.55,Re=Math.cos(G),Ve=Math.sin(G),_e=Math.cos(Y),je=Math.sin(Y);let Be=0;for(let a=0;a<s;a++){const M=n?0:Math.sin(i*.6+C[a]*6.2)*.012,v=C[a]*Math.PI*2+i*(n?0:.15);let f=r[a*3]*fe+Math.cos(v)*Le*(.55+C[a])+M,p=r[a*3+1]*fe+Math.sin(v*.8)*Le*.5,g=r[a*3+2]*fe+M;const pe=p*_e-g*je,O=p*je+g*_e,we=f*Re+O*Ve,Me=-f*Ve+O*Re;f=we,p=pe,g=Me;const A=a*3;u[A]=f,u[A+1]=p,u[A+2]=g,m[A]=f,m[A+1]=p,m[A+2]=g,Be+=g}const Ge=Be/s;for(let a=0;a<s;a++){const M=m[a*3+2],v=Math.max(0,Math.min(1,(M-Ge)/1.15+.5)),f=C[a]>.93;te.copy(f?Se:C[a]>.62?ze:Ce);const p=.28+v*.72;c[a*3]=te.r*p,c[a*3+1]=te.g*p,c[a*3+2]=te.b*p,y[a]=(f?1.7:.7+v)*(o.mobile?.8:1)}T.attributes.position.needsUpdate=!0,T.attributes.color.needsUpdate=!0;const We=b<.55?0:Math.min(1,(b-.55)/.25);let ve=0;for(const a of d){const M=a.i*3,v=a.j*3,f=(m[M+2]+m[v+2])*.5,g=(.08+Math.max(0,Math.min(1,(f-Ge)/1.15+.5))*.92)*We,pe=(a.i*.17+i*.35)%1,O=n?0:Math.exp(-Math.pow((pe-.5)*7,2))*(a.i%5===0?.55:0),we=N*Math.max(0,1-Math.abs(f)*.4),Me=1+O+we,A=g*Me,S=ve*6;x[S]=m[M],x[S+1]=m[M+1],x[S+2]=m[M+2],x[S+3]=m[v],x[S+4]=m[v+1],x[S+5]=m[v+2];for(let I=0;I<6;I+=3)F[S+I]=Math.min(1,ee.r*A+O*.35),F[S+I+1]=Math.min(1,ee.g*A+O*.3),F[S+I+2]=Math.min(1,ee.b*A);ve++}E.setDrawRange(0,ve*2),E.attributes.position.needsUpdate=!0,E.attributes.color.needsUpdate=!0,L.rotation.y=-G*.45+i*(n?0:.03),L.rotation.x=Y*.3,L.scale.setScalar(.96+b*.06),H.uTime.value=n?0:i,!n&&i>xe&&(N=1,xe=i+8+Math.random()*7),N=Math.max(0,N-t*.55),me+=((n?.35:.35+le*.55)-me)*Math.min(1,t*1.4),ue+=((n?.45:.45-ce*.4)-ue)*Math.min(1,t*1.4),k.uLight.value.set(me,ue,1),k.uPulse.value=N,k.uTime.value=n?.4:i;for(let a=0;a<ie;a++){const M=n?0:i*.08,v=Math.cos(M),f=Math.sin(M),p=re[a*3],g=re[a*3+2];K[a*3]=p*v-g*f,K[a*3+1]=re[a*3+1]+(n?0:Math.sin(i*.4+a)*.02),K[a*3+2]=p*f+g*v}Q.attributes.position.needsUpdate=!0,ne.opacity=(z==="dark"?.5:.32)*j*(.75+N*.4),W.uTime.value=n?0:i;const Ne=n?0:Math.sin(i*1.15)*.012;Z.scale.setScalar((.92+b*.1)*(1+Ne)),R.rotation.y=i*(n?0:.07),R.rotation.x=-i*(n?0:.035),R.scale.setScalar(1+(n?0:Math.sin(i*.7+.5)*.03)),V.scale.setScalar(1+Ne),_.rotation.y=G*.25,oe.opacity=.95*j,ae.opacity=(z==="dark"?.85:.7)*j,L.material.opacity=j,R.material.opacity=j,V.material.opacity=(z==="dark"?.035:.02)*b*j,_.material.opacity=(z==="dark"?.05:.035)*j,B.render(w,J),n&&Math.abs(b-X)<.01&&Math.abs($-Ee)<.01&&(cancelAnimationFrame(P),P=0)};P=requestAnimationFrame(de);const q=()=>{P||(P=requestAnimationFrame(de))};return{setMode:t=>{U=t,t!=="assemble"&&(X=1),q()},setAssemble:t=>{X=t,q()},setTheme:t=>{z=t,ke(),q()},setReduced:t=>{n=t,H.uAmp.value=t?0:o.mobile?.02:.045,W.uAmp.value=t?0:o.mobile?.012:.028,k.uAmp.value=t?0:o.mobile?.004:.008,q()},setActive:t=>{se=t,t&&q()},resize:Pe,dispose:()=>{se=!1,P&&cancelAnimationFrame(P),document.removeEventListener("visibilitychange",Fe),window.removeEventListener("pointermove",Te),T.dispose(),E.dispose(),oe.dispose(),ae.dispose(),Q.dispose(),ne.dispose(),L.geometry.dispose(),L.material.dispose(),Z.geometry.dispose(),Z.material.dispose(),R.geometry.dispose(),R.material.dispose(),V.geometry.dispose(),V.material.dispose(),_.geometry.dispose(),_.material.dispose(),B.dispose()}}}export{et as createOrb};
