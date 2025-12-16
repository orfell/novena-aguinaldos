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

  function normalizeId(idParam) {
    let n = idParam ? parseInt(idParam, 10) : 1;
    if (Number.isNaN(n) || n < 1) n = 1;
    return n;
  }

  /* =========================
     Navegación
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
     Audio (blindado)
  ========================= */

  function pickAudioUrl(item, tipo) {
    if (!item) return "";

    if (tipo === "oraciones") {
      return (
        item.Audio_Oracion ||
        item.audio_oracion ||
        item.AudioOracion ||
        item.audioOracion ||
        item.Audio ||
        item.audio ||
        ""
      );
    }

    if (tipo === "dias") {
      return (
        item.Audio_Reflexion ||
        item.audio_reflexion ||
        item.AudioReflexion ||
        item.audioReflexion ||
        item.Audio ||
        item.audio ||
        ""
      );
    }

    return "";
  }

  function applyAudio(item, tipo) {
    const url = pickAudioUrl(item, tipo);
    if (window.loadAudio) window.loadAudio(url || "");
  }

  /* =========================
     Lógica principal (day.html)
  ========================= */

  async function initDayPage() {
    const tipo = getQueryParam("tipo"); // "oraciones" | "dias"
    if (!tipo) return;

    const currentId = normalizeId(getQueryParam("id"));

    try {
      if (tipo === "oraciones") {
        setText("pageTitle", "Oraciones");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const total = items.length;

        // Buscar por Orden o por índice
        let item = items.find((o) => Number(o.Orden) === currentId);
        if (!item) item = items[currentId - 1];

        setText("itemTitle", item?.Titulo || "Oración");
        setText("itemMeta", `Sección · Oraciones · ${currentId}${total ? " de " + total : ""}`);
        setText("itemText", item?.Texto || "Sin contenido todavía.");

        updateNav(tipo, currentId, total);
        applyAudio(item, tipo);
        return;
      }

      if (tipo === "dias") {
        setText("pageTitle", "Días 1–9");
        document.title = "Días · Novena";

        const items = await loadJSON("data/dias.json");
        const total = items.length;

        // Buscar por Dia o por índice
        let item = items.find((d) => Number(d.Dia) === currentId);
        if (!item) item = items[currentId - 1];

        setText("itemTitle", item?.Titulo || `Día ${currentId}`);
        setText(
          "itemMeta",
          `Sección · Días · ${currentId}${total ? " de " + total : ""}${item?.Fecha ? " · " + item.Fecha : ""}`
        );
        setText("itemText", item?.Reflexion || "Sin contenido todavía.");

        updateNav(tipo, currentId, total);
        applyAudio(item, tipo);
        return;
      }
    } catch (err) {
      setText("itemTitle", "Error cargando datos");
      setText("itemText", String(err));
      if (window.loadAudio) window.loadAudio("");
    }
  }

  /* =========================
     Inicialización
  ========================= */

  function init() {
    // Solo si estamos en day.html
    if (document.getElementById("pageTitle")) {
      // Inicializa UI extra si existen
      if (window.initAccessibility) window.initAccessibility();
      if (window.initAudioUI) window.initAudioUI();

      initDayPage();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
