// Novena - day.js (lectura + accesibilidad enfocada al texto central)
// Requiere: dias.json, oraciones.json en la misma carpeta.

function qs(id){ return document.getElementById(id); }

function getParams(){
  const url = new URL(window.location.href);
  return {
    dia: Number(url.searchParams.get("dia") || 1),
    orden: Number(url.searchParams.get("orden") || 1),
    vista: url.searchParams.get("vista") || "oracion" // "oracion" | "dia"
  };
}

function setParams(next){
  const url = new URL(window.location.href);
  Object.entries(next).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  window.location.href = url.toString();
}

async function loadJson(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return await res.json();
}

function safeText(x){
  return (x ?? "").toString();
}

function initReadingAccessibility() {
  const readingTextEl = qs("readingText");
  if (!readingTextEl) return;

  const btnSmaller = qs("btnTextSmaller");
  const btnBigger  = qs("btnTextBigger");
  const btnTheme   = qs("btnToggleTheme");

  const MIN = 0.95;   // rem
  const MAX = 1.70;   // rem
  const STEP = 0.10;

  let size = Number(localStorage.getItem("readingFontSize")) || 1.10;

  function applySize() {
    size = Math.max(MIN, Math.min(MAX, size));
    readingTextEl.style.setProperty("--reading-font-size", `${size}rem`);
    localStorage.setItem("readingFontSize", String(size));
  }

  btnSmaller?.addEventListener("click", () => { size -= STEP; applySize(); });
  btnBigger?.addEventListener("click",  () => { size += STEP; applySize(); });

  btnTheme?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  });

  // Tema guardado
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");

  applySize();
}

function renderOracionesNav(oraciones, currentOrden){
  const nav = qs("oracionesNav");
  nav.innerHTML = "";

  oraciones
    .slice()
    .sort((a,b)=> Number(a.Orden) - Number(b.Orden))
    .forEach(o => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = safeText(o.Titulo);
      if (Number(o.Orden) === currentOrden) {
        btn.style.outline = "3px solid rgba(80, 120, 255, 0.55)";
        btn.style.outlineOffset = "2px";
      }
      btn.addEventListener("click", () => setParams({ vista:"oracion", orden: Number(o.Orden) }));
      nav.appendChild(btn);
    });

  qs("oracionInfo").textContent = `Oración actual: ${currentOrden} de ${oraciones.length}`;
}

function renderDiasNav(dias, currentDia){
  const nav = qs("diasNav");
  nav.innerHTML = "";

  dias
    .slice()
    .sort((a,b)=> Number(a.Dia) - Number(b.Dia))
    .forEach(d => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = `Día ${Number(d.Dia)}`;
      if (Number(d.Dia) === currentDia) {
        btn.style.outline = "3px solid rgba(80, 120, 255, 0.55)";
        btn.style.outlineOffset = "2px";
      }
      btn.addEventListener("click", () => setParams({ vista:"dia", dia: Number(d.Dia) }));
      nav.appendChild(btn);
    });

  qs("diaInfo").textContent = `Día actual: ${currentDia} de ${dias.length}`;
}

function getDiaText(d){
  // Espera d.Reflexion (string). Si no existe, intentamos fallback para no dejarlo en blanco.
  // OJO: si el JSON está inválido (texto suelto) no llega aquí; hay que corregir el JSON.
  if (typeof d.Reflexion === "string") return d.Reflexion;

  // Fallback suave: toma la primera propiedad string que no sea Titulo/Fecha/Audio/Dia
  const skip = new Set(["Dia","Fecha","Titulo","Audio_Reflexion","Reflexion"]);
  for (const [k,v] of Object.entries(d)) {
    if (skip.has(k)) continue;
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

function setReading(title, text, audioPath){
  qs("readingTitle").textContent = title;
  qs("readingText").innerText = text;

  const player = qs("audioPlayer");
  if (audioPath && audioPath.trim()){
    player.src = audioPath;
    player.load();
  } else {
    player.removeAttribute("src");
    player.load();
  }
}

async function main(){
  initReadingAccessibility();

  const params = getParams();

  let dias = [];
  let oraciones = [];

  try {
    dias = await loadJson("dias.json");
  } catch (e) {
    qs("pageTitle").textContent = "Error cargando dias.json";
    qs("readingTitle").textContent = "Revisa el archivo dias.json";
    qs("readingText").innerText = String(e);
    return;
  }

  try {
    oraciones = await loadJson("oraciones.json");
  } catch (e) {
    qs("pageTitle").textContent = "Error cargando oraciones.json";
    qs("readingTitle").textContent = "Revisa el archivo oraciones.json";
    qs("readingText").innerText = String(e);
    return;
  }

  const maxDia = dias.length || 9;
  const maxOrden = oraciones.length || 5;

  const currentDia = Math.max(1, Math.min(maxDia, params.dia || 1));
  const currentOrden = Math.max(1, Math.min(maxOrden, params.orden || 1));
  const vista = (params.vista === "dia") ? "dia" : "oracion";

  renderOracionesNav(oraciones, currentOrden);
  renderDiasNav(dias, currentDia);

  // Cabecera informativa
  const diaObj = dias.find(x => Number(x.Dia) === currentDia) || dias[0];
  const diaTitulo = diaObj ? safeText(diaObj.Titulo || `Día ${currentDia}`) : `Día ${currentDia}`;
  const diaFecha = diaObj ? safeText(diaObj.Fecha || "") : "";
  qs("pageTitle").textContent = diaTitulo;
  qs("pageMeta").textContent = diaFecha ? `Fecha: ${diaFecha}` : "";

  if (vista === "dia"){
    const texto = getDiaText(diaObj);
    const audio = diaObj ? safeText(diaObj.Audio_Reflexion || "") : "";
    setReading(diaTitulo, texto, audio);
  } else {
    const o = oraciones.find(x => Number(x.Orden) === currentOrden) || oraciones[0];
    const titulo = safeText(o?.Titulo || `Oración ${currentOrden}`);
    const texto = safeText(o?.Texto || "");
    const audio = safeText(o?.Audio_Oracion || o?.Audio || "");
    setReading(titulo, texto, audio);
  }
}

document.addEventListener("DOMContentLoaded", main);
