// js/app.js
(function () {
  "use strict";

  /* =========================
     Utilidades
  ========================= */

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }

  /* =========================
     Lógica principal day.html
  ========================= */

  async function initDayPage() {
    const tipo = getQueryParam("tipo"); // "oraciones" | "dias"
    if (!tipo) return;

    // id = 1..N (si no viene, asumimos 1)
    const idParam = getQueryParam("id");
    let currentId = idParam ? parseInt(idParam, 10) : 1;
    if (Number.isNaN(currentId) || currentId < 1) currentId = 1;

    try {
      if (tipo === "oraciones") {
        setText("pageTitle", "Oraciones");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const total = items.length;

        // Buscar por Orden o por índice
        let item = items.find(o => Number(o.Orden) === currentId);
        if (!item) item = items[currentId - 1];

        setText("itemTitle", item?.Titulo || "Oración");
        setText(
          "itemMeta",
          `Sección · Oraciones · ${currentId}${total ? " de " + total : ""}`
        );
        setText("itemText", item?.Texto || "Sin contenido todavía.");

        updateNav(tipo, currentId, total);
      }

      if (tipo === "dias") {
        setText("pageTitle", "Días 1–9");
        document.title = "Días · Novena";

        const items = await loadJSON("data/dias.json");
        const total = items.length;

        // Buscar por Dia o por índice
        let item = items.find(d => Number(d.Dia) === currentId);
        if (!item) item = items[currentId - 1];

        setText("itemTitle", item?.Titulo || `Día ${currentId}`);
        setText(
          "itemMeta",
          `Sección · Días · ${currentId}${total ? " de " + total : ""}${
            item?.Fecha ? " · " + item.Fecha : ""
          }`
        );
        setText("itemText", item?.Reflexion || "Sin contenido todavía.");

        updateNav(tipo, currentId, total);
      }
    } catch (err) {
      setText("itemTitle", "Error cargando datos");
      setText("itemText", String(err));
    }
  }

  /* =========================
     Navegación Anterior / Siguiente
  ========================= */

  function updateNav(tipo, currentId, total) {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const navHint = document.getElementById("navHint");

    if (!prevBtn || !nextBtn) return;

    const hasPrev = currentId > 1;
    const hasNext = total ? currentId < total : true;

    if (hasPrev) {
      prevBtn.href = `day.html?tipo=${encodeURIComponent(tipo)}&id=${currentId - 1}`;
      prevBtn.style.opacity = "1";
      prevBtn.style.pointerEvents = "auto";
    } else {
      prevBtn.href = "#";
      prevBtn.style.opacity = "0.5";
      prevBtn.style.pointerEvents = "none";
    }

    if (hasNext) {
      nextBtn.href = `day.html?tipo=${encodeURIComponent(tipo)}&id=${currentId + 1}`;
      nextBtn.style.opacity = "1";
      nextBtn.style.pointerEvents = "auto";
    } else {
      nextBtn.href = "#";
      nextBtn.style.opacity = "0.5";
      nextBtn.style.pointerEvents = "none";
    }

    if (navHint) {
      navHint.textContent = `Navegación: ${currentId}${total ? " / " + total : ""}`;
    }
  }

  /* =========================
     Inicialización
  ========================= */

  function init() {
  if (document.getElementById("pageTitle")) {
    if (window.initAudioUI) window.initAudioUI();
    initDayPage();
  }
}


  document.addEventListener("DOMContentLoaded", init);
})();
