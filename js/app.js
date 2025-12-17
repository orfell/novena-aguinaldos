// js/app.js
(function () {
  "use strict";

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }

  function normalizeId(idParam) {
    let n = idParam ? parseInt(idParam, 10) : 1;
    if (Number.isNaN(n) || n < 1) n = 1;
    return n;
  }

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error("No se pudo cargar " + path);
    return await res.json();
  }

  function setNavVisibility(show) {
    const navCard = document.getElementById("navCard");
    if (navCard) navCard.style.display = show ? "" : "none";
  }

  function showNavMode(mode) {
    const dayButtons = document.getElementById("dayButtons");
    const prayerButtons = document.getElementById("prayerButtons");

    if (mode === "dias") {
      if (dayButtons) dayButtons.style.display = "";
      if (prayerButtons) prayerButtons.style.display = "none";
    } else {
      if (dayButtons) dayButtons.style.display = "none";
      if (prayerButtons) prayerButtons.style.display = "";
    }
  }

  function initDayButtons(currentId, total) {
    const box = document.getElementById("dayButtons");
    const hint = document.getElementById("navHint");
    const navTitle = document.getElementById("navTitle");
    if (!box) return;

    if (navTitle) navTitle.textContent = "Ir al día";
    box.innerHTML = "";

    for (let i = 1; i <= total; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(i);

      // ✅ estilo portada
      btn.classList.add("btn-christmas");
      if (i === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=dias&id=${i}`;
      });

      box.appendChild(btn);
    }

    if (hint) hint.textContent = `Día actual: ${currentId} de ${total}`;
  }

  function initPrayerButtons(currentId, items) {
    const box = document.getElementById("prayerButtons");
    const hint = document.getElementById("navHint");
    const navTitle = document.getElementById("navTitle");
    if (!box) return;

    if (navTitle) navTitle.textContent = "Ir a la oración";
    box.innerHTML = "";

    // Orden fijo y nombres EXACTOS como los pediste
    const desired = [
      { key: "todos", label: "Oración para todos los días" },
      { key: "virgen", label: "Oración a la Virgen" },
      { key: "sanjose", label: "Oración a San José" },
      { key: "nino_jesus", label: "Oración al Niño Jesús" },
      { key: "gozos", label: "Los Gozos" },
    ];

    // Intento: resolver por Titulo o por Audio_Oracion
    const resolved = desired.map((d) => {
      const item =
        items.find((o) => (o.Titulo || "").toLowerCase().includes(d.key.replace("_", " "))) ||
        items.find((o) => (o.Audio_Oracion || "").toLowerCase().includes(d.key));
      return { label: d.label, item };
    });

    // Si no resolvió bien, fallback: orden por Orden
    const finalList = resolved.every((x) => x.item)
      ? resolved
      : items
          .slice()
          .sort((a, b) => (a.Orden || 0) - (b.Orden || 0))
          .map((it) => ({ label: it.Titulo || "Oración", item: it }));

    finalList.forEach(({ label, item }) => {
      const id = Number(item?.Orden) || 1;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;

      // ✅ estilo portada
      btn.classList.add("btn-christmas");
      if (id === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=oraciones&id=${id}`;
      });

      box.appendChild(btn);
    });

    const total = items.length || 1;
    if (hint) hint.textContent = `Oración actual: ${currentId} de ${total}`;
  }

  async function init() {
    // OBLIGATORIO: si no existe, no inicializa
    const pageTitle = document.getElementById("pageTitle");
    if (!pageTitle) return;

    const tipo = (getQueryParam("tipo") || "dias").toLowerCase();
    const currentId = normalizeId(getQueryParam("id"));

    try {
      if (tipo === "oraciones") {
        setNavVisibility(true);
        showNavMode("oraciones");

        // ✅ dos puntos
        setText("pageTitle", "Oraciones:");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const total = items.length;

        const safeId = Math.min(Math.max(currentId, 1), total || 1);

        let item = items.find((o) => Number(o.Orden) === safeId);
        if (!item) item = items[safeId - 1];

        initPrayerButtons(safeId, items);

        setText("itemTitle", (item?.Titulo || `Oración ${safeId}`) + ":");
        setText("itemMeta", `Sección · Oraciones · ${safeId}${total ? " de " + total : ""}`);
        setText("itemText", item?.Texto || "Sin contenido todavía.");

        // Audio (✅ corregido: Audio_Oracion)
        const audio = document.getElementById("audioPlayer");
        if (audio) {
          audio.src = item?.Audio_Oracion || item?.Audio || "";
          audio.load();
        }
      } else {
        setNavVisibility(true);
        showNavMode("dias");

        // ✅ dos puntos
        setText("pageTitle", "Consideración del Día:");
        document.title = "Días 1–9 · Novena";

        const items = await loadJSON("data/dias.json");
        const total = items.length;

        const safeId = Math.min(Math.max(currentId, 1), total || 1);

        // ✅ corregido: el JSON trae Dia (no id)
        let item = items.find((d) => Number(d.Dia) === safeId || Number(d.id) === safeId);
        if (!item) item = items[safeId - 1];

        initDayButtons(safeId, total || 9);

        // ✅ dos puntos también en el título del contenido
        setText("itemTitle", (item?.Titulo || `Día ${safeId}`) + ":");
        setText(
          "itemMeta",
          `Sección · Días · ${safeId}${total ? " de " + total : ""}${item?.Fecha ? " · " + item.Fecha : ""}`
        );

        // ✅ corregido: el JSON trae Reflexion (no Texto)
        setText("itemText", item?.Reflexion || item?.Texto || "Sin contenido todavía.");

        // Audio (✅ corregido: Audio_Reflexion)
        const audio = document.getElementById("audioPlayer");
        if (audio) {
          audio.src = item?.Audio_Reflexion || item?.Audio || "";
          audio.load();
        }
      }

      // Accesibilidad (si existe)
      if (typeof window.initAccessibility === "function") {
        window.initAccessibility();
      }
    } catch (err) {
      console.error(err);
      setText("pageTitle", "Error cargando datos");
      setText("itemTitle", "Error cargando datos");
      setText("itemMeta", "");
      setText("itemText", err && err.message ? err.message : "Ocurrió un error.");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
// ===== Imagen del día (dinámica) =====
const media = document.getElementById("readingMedia");
const img = document.getElementById("itemImage");

if (media && img) {
  const dayPadded = String(safeId).padStart(2, "0");

  // Ruta CORRECTA (D mayúscula)
  let imgSrc = `assets/img/Dias/Dia_${dayPadded}.jpg`;

  img.onload = () => {
    media.style.display = "";
  };

  img.onerror = () => {
    // Fallback si alguna imagen está como Dia_9.jpg
    img.src = `assets/img/Dias/Dia_${safeId}.jpg`;
  };

  img.src = imgSrc;
  img.alt = item?.Titulo
    ? `Imagen del Día ${safeId}: ${item.Titulo}`
    : `Imagen del Día ${safeId}`;
}
