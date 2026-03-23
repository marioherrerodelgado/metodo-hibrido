
import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import{getFirestore,collection,query,where,getDocs}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app=initializeApp({apiKey:"AIzaSyA9M9oB4pfovY0Lj-HdfrQxxkp5pzbEd4Q",authDomain:"elmetodohibrido.firebaseapp.com",projectId:"elmetodohibrido",storageBucket:"elmetodohibrido.firebasestorage.app",messagingSenderId:"283253527108",appId:"1:283253527108:web:8a64bbf9b72fb40756e211"});
const auth=getAuth(app),db=getFirestore(app);
const MN=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MS=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DF=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const td=new Date();let Y=td.getFullYear(),M=td.getMonth(),fl="all",ws=[],cn="hoy",cf="all",monthLoaded=false,compsLive=[];

const COMPS=[
{date:"2026-03-22",name:"Media Maraton de Madrid",dist:"5/21 km",lugar:"Madrid",cat:"running"},
{date:"2026-03-28",name:"MetLife Madrid 15K",dist:"15 km",lugar:"Madrid",cat:"running"},
{date:"2026-04-26",name:"Zurich Rock'n'Roll (MAPOMA)",dist:"10/21/42 km",lugar:"Madrid",cat:"running"},
{date:"2026-05-10",name:"Carrera de la Mujer",dist:"6 km",lugar:"Madrid",cat:"running"},
{date:"2026-06-14",name:"Maraton Guadarrama",dist:"44 km trail",lugar:"Cercedilla",cat:"running"},
{date:"2026-10-04",name:"Carrera Popular Vicalvaro",dist:"5/10 km",lugar:"Vicalvaro",cat:"running"},
{date:"2026-04-16",name:"HYROX Malaga",dist:"8km+8WO",lugar:"FYCMA",cat:"hyrox",note:"16-19 abr"},
{date:"2026-05-14",name:"HYROX Barcelona",dist:"8km+8WO",lugar:"Fira Barcelona",cat:"hyrox",note:"14-17 may"},
{date:"2026-05-22",name:"HYROX Madrid",dist:"8km+8WO",lugar:"IFEMA",cat:"hyrox",note:"22-24 may"},
{date:"2026-03-21",name:"DEKA MILE Guadarrama",dist:"MILE",lugar:"Box Siete Picos",cat:"deka"},
{date:"2026-04-11",name:"DEKA MILE Arganda",dist:"MILE",lugar:"Heaven CrossFit",cat:"deka"},
{date:"2026-04-18",name:"DEKA Valencia",dist:"FIT/MILE/Teams",lugar:"La Marina",cat:"deka"},
{date:"2026-07-18",name:"DEKA Madrid",dist:"FIT/MILE/STRONG",lugar:"Madrid Arena",cat:"deka",note:"18-19 jul"},
{date:"2026-05-29",name:"MAD Fitness Festival",dist:"Individual/Teams",lugar:"Ciudad Real",cat:"crossfit",note:"Semifinal Games"},
{date:"2026-05-09",name:"Tomelloso Throwdown",dist:"Parejas/Equipos",lugar:"Tomelloso",cat:"crossfit"},
{date:"2026-05-22",name:"Batalla de Guisando",dist:"Ind./Parejas",lugar:"El Tiemblo",cat:"crossfit",note:"22-24 may"},
];

// AUTH
onAuthStateChanged(auth,u=>{if(u){document.getElementById("ls").classList.add("h");document.getElementById("app").classList.add("on");setUI(u);iA();}else{document.getElementById("ls").classList.remove("h");document.getElementById("app").classList.remove("on");}});

window.doLogin=async function(){
  const e=document.getElementById("login-email").value.trim(),p=document.getElementById("login-pass").value;
  const err=document.getElementById("le"),ld=document.getElementById("ll"),btn=document.getElementById("login-btn");
  err.classList.remove("show");err.textContent="";
  if(!e||!p){err.textContent="Introduce email y contraseña.";err.classList.add("show");return;}
  btn.disabled=true;ld.classList.add("show");
  try{await signInWithEmailAndPassword(auth,e,p);}catch(x){
    let m="Error al iniciar sesión.";
    if(x.code==="auth/user-not-found"||x.code==="auth/invalid-credential")m="Email o contraseña incorrectos.";
    else if(x.code==="auth/too-many-requests")m="Demasiados intentos. Espera unos minutos.";
    else if(x.code==="auth/invalid-email")m="Email no válido.";
    err.textContent=m;err.classList.add("show");
  }btn.disabled=false;ld.classList.remove("show");
};
window.doLogout=async()=>{await signOut(auth);document.getElementById("umenu").classList.remove("open");};
window.openWodbusterBooking=function(){
  const fallback="https://www.wodbuster.com";
  const ua=navigator.userAgent||"";
  const isAndroid=/android/i.test(ua);
  const isiOS=/iPad|iPhone|iPod/i.test(ua);
  if(isAndroid){
    const intent="intent://#Intent;scheme=wodbuster;S.browser_fallback_url="+encodeURIComponent(fallback)+";end";
    window.location.href=intent;
    return;
  }
  if(isiOS){
    const t0=Date.now();
    window.location.href="wodbuster://";
    setTimeout(()=>{if(Date.now()-t0<1800)window.location.href=fallback;},1200);
    return;
  }
  window.open(fallback,"_blank","noopener");
};
function setUI(u){const e=u.email||"",i=e.charAt(0).toUpperCase();document.getElementById("uav").textContent=i;document.getElementById("ueml").textContent=e;document.getElementById("box-email").textContent=e;}
window.toggleUM=()=>document.getElementById("umenu").classList.toggle("open");
document.addEventListener("click",e=>{if(!e.target.closest("#uav")&&!e.target.closest("#umenu"))document.getElementById("umenu").classList.remove("open");});

function iA(){const now=new Date(),h=now.getHours();document.getElementById("gt").textContent=h<13?"Buenos días":h<20?"Buenas tardes":"Buenas noches";goToday();lC();}

async function lC(){
  try{
    const sn=await getDocs(collection(db,"competiciones"));
    const tmp=[];
    sn.forEach(d=>{
      const c=d.data()||{};
      if(!c.date||!c.name)return;
      tmp.push({
        date:String(c.date),
        name:String(c.name),
        dist:String(c.dist||""),
        lugar:String(c.lugar||""),
        cat:String(c.cat||"running").toLowerCase(),
        note:String(c.note||"")
      });
    });
    tmp.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    compsLive=tmp;
    if(cn==="comp")bCP();
  }catch(e){compsLive=[];}
}

async function lM(){
  document.getElementById("msc").innerHTML='<div class="lw">Cargando<div class="lb"><div class="lf"></div></div></div>';
  document.getElementById("mpt").textContent=MS[M]+" "+Y;bS();bMM();
  try{const ms=Y+"-"+String(M+1).padStart(2,"0");const sn=await getDocs(query(collection(db,"wods"),where("month","==",ms)));ws=[];sn.forEach(d=>ws.push({id:d.id,...d.data()}));}catch(e){ws=[];}
  monthLoaded=true;rM();
}
function gD(w){return w.fecha||w.date||"";}
function gSC(w){const s=(w.sport||"running").toLowerCase();if(s==="hyrox")return"h";if(s==="deka")return"h";if(s==="crossfit")return"x";if((w.type||"").toLowerCase().includes("compet"))return"c";return"r";}
function gSL(w){const s=(w.sport||"").toLowerCase();if(s==="hyrox")return"Hyrox";if(s==="deka")return"DEKA";if(s==="crossfit")return"CrossFit";return w.sede||"Running";}
function rM(){
  const dim=new Date(Y,M+1,0).getDate(),isCur=Y===td.getFullYear()&&M===td.getMonth();
  let fws=fl==="all"?ws:ws.filter(w=>(w.sport||"running").toLowerCase()===fl);
  const wm={};fws.forEach(w=>{const d=parseInt(gD(w).split("-")[2]);if(!wm[d])wm[d]=[];wm[d].push(w);});
  uD(wm,dim);let h="";
  for(let d=1;d<=dim;d++){const wl=wm[d]||[];if(!wl.length&&fl!=="all")continue;const iT=isCur&&d===td.getDate(),dt=new Date(Y,M,d);
    h+='<div class="dl"'+(iT?' id="ts"':'')+'>'+DF[dt.getDay()]+", "+d+" "+MN[M]+(iT?" — Hoy":"")+'</div>';
    if(!wl.length){h+='<div class="rc"><div class="ri"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#ccc" stroke-width="1.5" fill="none"/></svg></div><div style="font-size:13px;font-weight:500;color:var(--t2)">Descanso</div></div>';}
    else{wl.forEach(w=>{const sc=gSC(w),isC=(w.type||"").toLowerCase().includes("compet"),iCl="i"+({baja:"b",media:"m",alta:"a",maxima:"x"}[w.intensity||"media"]),iLb={baja:"Suave",media:"Moderado",alta:"Exigente",maxima:"Máxima"}[w.intensity||"media"]||"Moderado",tt=w.titulo||"Entrenamiento",du=w.duration||"",ty=w.type||"",pr=(w.main||"").split("\n").filter(l=>l.trim()).slice(0,3),wd=JSON.stringify(w).replace(/'/g,"&#39;");
      h+='<div class="wc" onclick=\'oD('+wd+')\'><div class="wcb '+sc+'"></div><div class="wci"><div class="wct"><div class="wcs"><div class="wcd '+sc+'"></div><span class="wsn '+sc+'">'+(isC?"Competición":gSL(w))+'</span></div><span class="wi '+iCl+'">'+iLb+'</span></div><div class="wtt">'+tt+'</div><div class="wch">'+(du?'<div class="ch">'+du+'</div>':'')+(ty&&!isC?'<div class="ch">'+ty+'</div>':'')+'</div>'+(pr.length?'<div class="wp">'+pr.map(l=>'<div class="wpi"><div class="wpd"></div>'+l.trim()+'</div>').join("")+'</div>':'')+'<button class="wb">Ver entrenamiento completo</button></div></div>';});}}
  if(!h)h='<div style="text-align:center;padding:48px 20px;color:var(--t3);font-size:14px">Sin entrenamientos este mes</div>';
  document.getElementById("msc").innerHTML='<div class="ca">'+h+'</div>';if(isCur){setTimeout(gT,120);requestAnimationFrame(()=>requestAnimationFrame(gT));}
}
function bS(){const dim=new Date(Y,M+1,0).getDate(),isCur=Y===td.getFullYear()&&M===td.getMonth(),dns=["D","L","M","X","J","V","S"];document.getElementById("wst").innerHTML=Array.from({length:dim},(_,i)=>{const d=i+1,dw=new Date(Y,M,d).getDay(),iT=isCur&&d===td.getDate();return'<div class="wd'+(iT?" tod":"")+'" id="w'+d+'" onclick="jD('+d+')"><span class="wd-n">'+dns[dw]+'</span><span class="wd-d">'+d+'</span><div class="wdd" id="wd'+d+'"></div></div>';}).join("");}
function uD(wm,dim){for(let d=1;d<=dim;d++){const x=document.getElementById("wd"+d);if(!x)continue;x.className="wdd";if(wm[d]?.length)x.classList.add(gSC(wm[d][0]));}}
function gT(){
  const e=document.getElementById("ts");
  if(e){
    const y=Math.max(0,window.scrollY+e.getBoundingClientRect().top-120);
    window.scrollTo({top:y,behavior:"smooth"});
  }
  const strip=document.getElementById("wst"),t=document.querySelector(".wd.tod");
  if(t){
    t.classList.add("sel");
    if(strip){
      const target=t.offsetLeft-(strip.clientWidth/2)+(t.clientWidth/2);
      strip.scrollTo({left:Math.max(0,target),behavior:"smooth"});
    }else{
      t.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});
    }
  }
}
window.jD=function(d){document.querySelectorAll(".wd").forEach(e=>e.classList.remove("sel"));const x=document.getElementById("w"+d);if(x){x.classList.add("sel");x.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});}document.querySelectorAll(".dl").forEach(s=>{if(s.textContent.match(new RegExp(",\\s*"+d+"\\s")))s.scrollIntoView({behavior:"smooth",block:"start"});});};
window.sF=function(s,b){fl=s;document.querySelectorAll(".fp").forEach(p=>p.classList.remove("on"));b.classList.add("on");rM();};
function setFilterAll(){if(fl==="all")return false;fl="all";document.querySelectorAll(".fp").forEach(p=>p.classList.remove("on"));const ab=document.querySelector('.fp[data-s="all"]');if(ab)ab.classList.add("on");return true;}
function goToday(){const now=new Date(),cy=now.getFullYear(),cm=now.getMonth(),monthChanged=Y!==cy||M!==cm,filterChanged=setFilterAll();Y=cy;M=cm;if(monthChanged||!monthLoaded){lM();return;}if(filterChanged){rM();setTimeout(gT,80);return;}gT();}
function bMM(){document.getElementById("my").textContent=Y;document.getElementById("mg").innerHTML=MS.map((m,i)=>'<div class="mm'+(i===M?" on":"")+'" onclick="sM('+i+')">'+m+"</div>").join("");}
window.oMM=()=>document.getElementById("mo").classList.add("open");
window.cMM=()=>document.getElementById("mo").classList.remove("open");
window.sM=m=>{M=m;cMM();lM();};
window.nT=function(t){
  cn=t;
  const mo=document.getElementById("mo");
  const monthWasOpen=mo.classList.contains("open");
  cMM();
  ["hoy","mes","comp","box"].forEach(x=>{const b=document.getElementById("b"+x[0]);if(b){b.classList.remove("on");b.querySelector(".bil").style.color="";}});
  const ab=document.getElementById("b"+t[0]);if(ab){ab.classList.add("on");ab.querySelector(".bil").style.color="var(--bl)";}
  ["dp","cp","bxp"].forEach(id=>document.getElementById(id).classList.remove("open"));
  document.body.style.overflow="";
  if(t==="hoy"){goToday();return;}
  if(t==="mes"){if(!monthWasOpen)oMM();return;}
  if(t==="comp"){bCP();document.getElementById("cp").classList.add("open");return;}
  if(t==="box"){document.getElementById("bxp").classList.add("open");}
};
window.cP=function(w){const ids={d:"dp",c:"cp",b:"bxp"};if(ids[w])document.getElementById(ids[w]).classList.remove("open");document.body.style.overflow="";["hoy","mes","comp","box"].forEach(x=>{const b=document.getElementById("b"+x[0]);if(b){b.classList.remove("on");b.querySelector(".bil").style.color="";}});document.getElementById("bh").classList.add("on");document.getElementById("bh").querySelector(".bil").style.color="var(--bl)";cn="hoy";};
window.oD=function(w){const ds=gD(w),pts=ds.split("-"),d=parseInt(pts[2]),mo=parseInt(pts[1])-1,dt=new Date(parseInt(pts[0]),mo,d),sc=gSC(w),isC=(w.type||"").toLowerCase().includes("compet");
  document.getElementById("dpi").textContent=isC?"Competición":gSL(w);document.getElementById("dpi").className="dp "+sc;
  document.getElementById("ddt").textContent=DF[dt.getDay()]+", "+d+" de "+MN[mo];document.getElementById("dtt").textContent=w.titulo||"Entrenamiento";
  const iLb={baja:"Suave",media:"Moderado",alta:"Exigente",maxima:"Máxima"}[w.intensity||"media"]||"Moderado",iCl={baja:"var(--gr)",media:"var(--bl)",alta:"var(--or)",maxima:"var(--or)"}[w.intensity||"media"]||"var(--bl)";
  document.getElementById("dst").innerHTML='<div class="dsi"><div class="dsl">Duración</div><div class="dsv">'+(w.duration||"—")+'</div></div><div class="dsi"><div class="dsl">Volumen</div><div class="dsv" style="font-size:13px">'+(w.volume||"—")+'</div></div><div class="dsi"><div class="dsl">Nivel</div><div class="dsv" style="font-size:13px;color:'+iCl+'">'+iLb+'</div></div>';
  let bd="";if(w.notes)bd+='<div class="nb"><div class="nl">Nota del entrenador</div><div class="nt">'+w.notes+'</div></div>';
  [[w.warmup,"Calentamiento"],[w.main,"Parte principal"],[w.metcon,"MetCon"],[w.cooldown,"Vuelta a la calma"]].forEach(([v,l])=>{if(!v)return;const ls=v.split("\n").filter(x=>x.trim());bd+='<div class="bb"><div class="bbl">'+l+'</div>'+ls.map((x,i)=>'<div class="bbi"><div class="bbn">'+(i+1)+'</div>'+x.trim()+'</div>').join("")+'</div>';});
  document.getElementById("dbd").innerHTML=bd||'<div style="padding:20px;color:var(--t3)">Sin detalle</div>';document.getElementById("dp").classList.add("open");document.body.style.overflow="hidden";};
window.filterComps=function(f,el){cf=f;document.querySelectorAll("#comp-filters .cpill").forEach(p=>p.classList.remove("on"));el.classList.add("on");bCP();};
function bCP(){const now=new Date();now.setHours(0,0,0,0);const source=compsLive.length?compsLive:COMPS;const filtered=cf==="all"?source:source.filter(c=>c.cat===cf);let up="",pa="";
  filtered.forEach(c=>{const dt=new Date(c.date+"T00:00:00"),d=parseInt(c.date.split("-")[2]),mo=parseInt(c.date.split("-")[1])-1,ip=dt<now,cat=c.cat;
    const card='<div class="cc'+(ip?" past":"")+'"><div class="ccb '+cat+'"></div><div class="cci"><div class="cd"><span class="cdd">'+d+'</span><span class="cdm">'+MS[mo]+'</span></div><div class="cn"><div class="cnn">'+c.name+'</div><div class="cnm">'+c.lugar+(c.note?" — "+c.note:"")+'</div></div><span class="cdd2 '+cat+'">'+c.dist+'</span></div></div>';
    if(ip)pa+=card;else up+=card;});
  document.getElementById("cbd").innerHTML=(up?'<div class="sh">Próximas</div>'+up:'')+(pa?'<div class="sh">Pasadas</div>'+pa:'')+(!up&&!pa?'<div style="text-align:center;padding:40px;color:var(--t3)">Sin competiciones</div>':'');}

