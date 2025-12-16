function qs(id){ return document.getElementById(id); }

function getParams(){
  const url = new URL(window.location.href);
  const tipoOld = url.searchParams.get("tipo");
  const idOld = url.searchParams.get("id");

  let vista = url.searchParams.get("vista") || "oracion";
  if (!url.searchParams.get("vista") && tipoOld){
    vista = (tipoOld === "dias") ? "dia" : "oracion";
  }

  let dia = Number(url.searchParams.get("dia") || 1);
  let orden = Number(url.searchParams.get("orden") || 1);

  if (idOld && !url.searchParams.get("dia") && !url.searchParams.get("orden")){
    if (vista === "dia") dia = Number(idOld);
    else orden = Number(idOld);
  }

  return { dia, orden, vista };
}

function setParams(next){
  const url = new URL(window.location.href);
  Object.entries(next).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  url.searchParams.delete("tipo");
  url.searchParams.delete("id");
  window.location.href = url.toString();
}

async function loadJsonTry(paths){
  let lastErr = null;
  for (const p of paths){
    try{
      const res = await fetch(p, { cache: "no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status} en ${p}`);
      return await res.json();
    }catch(e){ lastErr = e; }
  }
  throw lastErr || new Error("No se pudo cargar JSON");
}

function initReadingAccessibility(){
  const readingTextEl = qs("readingText");
  if (!readingTextEl) return;

  const btnSmaller = qs("btnTextSmaller");
  const btnBigger  = qs("btnTextBigger");
  const btnTheme   = qs("btnToggleTheme");

  const MIN=0.95, MAX=1.70, STEP=0.10;
  let size = Number(localStorage.getItem("readingFontSize")) || 1.10;

  function applySize(){
    size = Math.max(MIN, Math.min(MAX, size));
    readingTextEl.style.setProperty("--reading-font-size", `${size}rem`);
    localStorage.setItem("readingFontSize", String(size));
  }

  btnSmaller?.addEventListener("click", ()=>{ size-=STEP; applySize(); });
  btnBigger?.addEventListener("click",  ()=>{ size+=STEP; applySize(); });

  btnTheme?.addEventListener("click", ()=>{
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  });

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");

  applySize();
}

function renderOracionesNav(oraciones, currentOrden){
  const nav = qs("oracionesNav");
  nav.innerHTML = "";
  oraciones.slice().sort((a,b)=>a.Orden-b.Orden).forEach(o=>{
    const b = document.createElement("button");
    b.className="btn"; b.type="button"; b.textContent=o.Titulo;
    if (Number(o.Orden)===currentOrden){
      b.style.outline="3px solid rgba(80,120,255,.55)";
      b.style.outlineOffset="2px";
    }
    b.onclick=()=>setParams({vista:"oracion", orden:o.Orden});
    nav.appendChild(b);
  });
  qs("oracionInfo").textContent = `Oración actual: ${currentOrden} de ${oraciones.length}`;
}

function renderDiasNav(dias, currentDia){
  const nav = qs("diasNav");
  nav.innerHTML = "";
  dias.slice().sort((a,b)=>a.Dia-b.Dia).forEach(d=>{
    const b = document.createElement("button");
    b.className="btn"; b.type="button"; b.textContent=`Día ${d.Dia}`;
    if (Number(d.Dia)===currentDia){
      b.style.outline="3px solid rgba(80,120,255,.55)";
      b.style.outlineOffset="2px";
    }
    b.onclick=()=>setParams({vista:"dia", dia:d.Dia});
    nav.appendChild(b);
  });
  qs("diaInfo").textContent = `Día actual: ${currentDia} de ${dias.length}`;
}

function setReading(title, text, audioPath){
  qs("readingTitle").textContent = title;
  qs("readingText").innerText = text;
  const player = qs("audioPlayer");
  if (audioPath){ player.src=audioPath; player.load(); }
  else { player.removeAttribute("src"); player.load(); }
}

async function main(){
  initReadingAccessibility();
  const {dia, orden, vista} = getParams();

  // 👇 Mantiene estructura: prueba rutas típicas (ajustaremos a la real cuando nos la confirmes)
  const diasPaths = ["dias.json","data/dias.json","json/dias.json","assets/data/dias.json"];
  const oraPaths  = ["oraciones.json","data/oraciones.json","json/oraciones.json","assets/data/oraciones.json"];

  const oraciones = await loadJsonTry(oraPaths);
  let dias = [];
  try { dias = await loadJsonTry(diasPaths); } catch(e){ /* no revienta la UI */ }

  const currentOrden = Math.max(1, Math.min(oraciones.length, orden||1));
  renderOracionesNav(oraciones, currentOrden);

  if (dias.length){
    const currentDia = Math.max(1, Math.min(dias.length, dia||1));
    renderDiasNav(dias, currentDia);
  } else {
    qs("diaInfo").textContent = "Aviso: no se encontró dias.json en las rutas configuradas.";
  }

  if (vista === "dia" && dias.length){
    const currentDia = Math.max(1, Math.min(dias.length, dia||1));
    const d = dias.find(x=>Number(x.Dia)===currentDia) || dias[0];
    setReading(d.Titulo || `Día ${currentDia}`, d.Reflexion || "", d.Audio_Reflexion || "");
  } else {
    const o = oraciones.find(x=>Number(x.Orden)===currentOrden) || oraciones[0];
    setReading(o.Titulo || `Oración ${currentOrden}`, o.Texto || "", o.Audio_Oracion || "");
  }

  qs("pageTitle").textContent = "Novena de Aguinaldos";
}

document.addEventListener("DOMContentLoaded", main);
