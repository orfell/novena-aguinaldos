// js/app.js
(function () {
  "use strict";

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  async function initDayPage() {
    const tipo = getQueryParam("tipo"); // "oraciones" o "dias"
    if (!tipo) return;

    try {
      if (tipo === "oraciones") {
        setText("pageTitle", "Oraciones");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const first = items[0];

        setText("itemTitle", first?.Titulo || "Oración");
        setText("itemMeta", "Sección · Oraciones");
        setText("itemText", first?.Texto || "Sin contenido todavía.");
      } else if (tipo === "dias") {
        setText("pageTitle", "Días 1–9");
        document.title = "Días · Novena";

        const items = await loadJSON("data/dias.json");
        const first = items[0];

        setText("itemTitle", first?.Titulo || `Día ${first?.Dia || ""}`);
        setText("itemMeta", `Sección · Días · ${first?.Fecha || ""}`);
        setText("itemText", first?.Reflexion || "Sin contenido todavía.");
      }
    } catch (e) {
      setText("itemTitle", "Error cargando datos");
      setText("itemText", String(e));
    }
  }

  function init() {
    // Si existe el elemento pageTitle, asumimos que estamos en day.html
    if (document.getElementById("pageTitle")) {
      initDayPage();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
