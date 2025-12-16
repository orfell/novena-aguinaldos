// Novena - day.js (robusto + accesibilidad enfocada al texto central)
// Requiere: oraciones.json
// dias.json puede estar en la raíz o en /data/

function qs(id){ return document.getElementById(id); }

function getParams(){
  const url = new URL(window.location.href);

  // Compatibilidad NUEVA
  const vistaNew = url.searchParams.get("vista");      // "oracion" | "dia"
  const diaNew   = url.searchParams.get("dia");
  const ordenNew = url.searchParams.get("orden");

  // Compatibilidad VIEJA (tu enlace actual: ?tipo=oraciones&id=1)
  const tipoOld = url.searchParams.get("tipo");        // "oraciones" | "dias"
  const idOld   = url.searchParams.get("id");

  // Resolver vista
  let vista = "oracion";
  if (vistaNew) vista = vistaNew;
  else if (tipoOld === "dias") vista = "dia";
  else if (tipoOld === "oraciones") vista = "oracion";

  // Resolver índices
  let dia = Number(diaNew || 1);
  let orden = Number(ordenNew || 1);

  if (idOld && !ordenNew && !diaNew) {
    // Si viene esquema viejo, id representa la selección de la vista
    if (vista === "oracion") orden = Number(idOld);
    if (vista === "dia") dia = Number(idOld);
  }

  return { dia, orden, vista };
}

function setParams(next){
  const url = new URL(window.location.href);
  Object.entries(next).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  // Limpia parámetros viejos si existían
  url.searchParams.delete("tipo");
  url.searchParams.delete("id");
  window.location.href = url.toString();
}

async function loadJsonTry(paths){
  let lastErr = null;
  for (const p of paths){
    try{
      const res = await fetch(p, { cache: "no-store" });
      if(!res.ok) throw new Error(`No se pudo cargar ${p} (HTTP ${res.status})`);
      return await res.json();
    }catch(e){
      lastErr = e;
    }
  }
  throw lastErr || new Error("No se pudo cargar JSON");
}

function safeText(x){ return (x ?? "").toString(); }

function initReadingAccessibility() {
  const readingTextEl = qs("readingText");
  if (!readingTextEl) return;

  const btnSmaller = qs("btnTextSmaller");
  const btnBigger  = qs("btnTextBigger");
  const btnTheme   = qs("btnToggleTheme");

  const MIN = 0.95;
  const MAX = 1.70;
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

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");

  applySize();
}

function renderOracionesNav(oraciones, currentOrden){
  const nav = qs("oracionesNav");
  if (!nav) return;
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

  const info = qs("oracionInfo");
  if (info) info.textContent = `Oración actual: ${currentOrden} de ${oraciones.length}`;
}

function renderDiasNav(dias, currentDia){
  const nav = qs("diasNav");
  if (!nav) return;
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

  const info = qs("diaInfo");
  if (info) info.textContent = `Día actual: ${currentDia} de ${dias.length}`;
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

  // 1) Cargar oraciones (prioritario para que siempre haya UI)
  let oraciones = [];
  try {
    oraciones = await loadJsonTry(["oraciones.json", "data/oraciones.json"]);
  } catch (e) {
    qs("pageTitle").textContent = "Error cargando oraciones.json";
    setReading("Revisa el archivo oraciones.json", String(e), "");
    return;
  }

  // 2) Cargar días (si falla, no matamos la página)
  let dias = [];
  let diasError = null;
  try {
    dias = await loadJsonTry(["dias.json", "data/dias.json"]);
  } catch (e) {
    diasError = e;
    dias = []; // seguimos solo con oraciones
  }

  const maxOrden = oraciones.length || 5;
  const currentOrden = Math.max(1, Math.min(maxOrden, params.orden || 1));

  renderOracionesNav(oraciones, currentOrden);

  // Si no hay días, ocultamos nav de días y mostramos aviso (sin romper oraciones)
  if (!dias.length) {
    qs("diasNav").innerHTML = "";
    qs("diaInfo").textContent = diasError
      ? `Aviso: no se pudo cargar dias.json. ${String(diasError)}`
      : "Aviso: no hay días cargados.";
  } else {
    const maxDia = dias.length || 9;
    const currentDia = Math.max(1, Math.min(maxDia, params.dia || 1));
    renderDiasNav(dias, currentDia);
  }

  // Cabecera
  qs("pageTitle").textContent = "Novena de Aguinaldos";
  qs("pageMeta").textContent = "";

  // Vista
  const vista = (params.vista === "dia") ? "dia" : "oracion";

  if (vista === "dia" && dias.length) {
    const currentDia = Math.max(1, Math.min(dias.length, params.dia || 1));
    const diaObj = dias.find(x => Number(x.Dia) === currentDia) || dias[0];
    const titulo = safeText(diaObj?.Titulo || `Día ${currentDia}`);
    const texto = safeText(diaObj?.Reflexion || "");
    const audio = safeText(diaObj?.Audio_Reflexion || "");
    setReading(titulo, texto, audio);
  } else {
    const o = oraciones.find(x => Number(x.Orden) === currentOrden) || oraciones[0];
    const titulo = safeText(o?.Titulo || `Oración ${currentOrden}`);
    const texto  = safeText(o?.Texto || "");
    const audio  = safeText(o?.Audio_Oracion || "");
    setReading(titulo, texto, audio);
  }
}

document.addEventListener("DOMContentLoaded", main);
