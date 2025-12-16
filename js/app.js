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

  function setNavVisibility(visible) {
    const navCard = document.getElementById("navCard");
    if (navCard) navCard.style.display = visible ? "block" : "none";
  }

  function initDayButtons(currentId, total) {
    const box = document.getElementById("dayButtons");
    const hint = document.getElementById("navHint");
    if (!box) return;

    box.innerHTML = "";

    for (let i = 1; i <= total; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(i);

      if (i === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=dias&id=${i}`;
      });

      box.appendChild(btn);
    }

    if (hint) hint.textContent = `Día actual: ${currentId} de ${total}`;
  }

  function pickAudioUrl(item, tipo) {
    if (!item) return "";

    if (tipo === "oraciones") {
      return item.Audio_Oracion || item.audio_oracion || item.AudioOracion || item.audioOracion || item.Audio || item.audio || "";
    }

    if (tipo === "dias") {
      return item.Audio_Reflexion || item.audio_reflexion || item.AudioReflexion || item.audioReflexion || item.Audio || item.audio || "";
    }

    return "";
  }

  function applyAudio(item, tipo) {
    const url = pickAudioUrl(item, tipo);
    if (window.loadAudio) window.loadAudio(url || "");
  }

  async function initDayPage() {
    const tipo = getQueryParam("tipo"); // "oraciones" | "dias"
    if (!tipo) return;

    const currentId = normalizeId(getQueryParam("id"));

    try {
      if (tipo === "oraciones") {
        setNavVisibility(false);
        setText("pageTitle", "Oraciones");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const total = items.length;

        const safeId = Math.min(Math.max(currentId, 1), total || 1);

        let item = items.find((o) => Number(o.Orden) === safeId);
        if (!item) item = items[safeId - 1];

        setText("itemTitle", item?.Titulo || "Oración");
        setText("itemMeta", `Sección · Oraciones · ${safeId}${total ? " de " + total : ""}`);
        setText("itemText", item?.Texto || "Sin contenido todavía.");

        applyAudio(item, tipo);
        return;
      }

      if (tipo === "dias") {
        setNavVisibility(true);
        setText("pageTitle", "Días 1–9");
        document.title = "Días · Novena";

        const items = await loadJSON("data/dias.json");
        const total = items.length;

        const safeId = Math.min(Math.max(currentId, 1), total || 1);

        let item = items.find((d) => Number(d.Dia) === safeId);
        if (!item) item = items[safeId - 1];

        setText("itemTitle", item?.Titulo || `Día ${safeId}`);
        setText(
          "itemMeta",
          `Sección · Días · ${safeId}${total ? " de " + total : ""}${item?.Fecha ? " · " + item.Fecha : ""}`
        );
        setText("itemText", item?.Reflexion || "Sin contenido todavía.");

        initDayButtons(safeId, total || 1);
        applyAudio(item, tipo);
        return;
      }
    } catch (err) {
      setNavVisibility(false);
      setText("itemTitle", "Error cargando datos");
      setText("itemText", String(err));
      if (window.loadAudio) window.loadAudio("");
    }
  }

  function init() {
    if (document.getElementById("pageTitle")) {
      if (window.initAccessibility) window.initAccessibility();
      if (window.initAudioUI) window.initAudioUI();
      initDayPage();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
