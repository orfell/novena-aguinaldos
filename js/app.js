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

  function initDayPage() {
    const tipo = getQueryParam("tipo"); // "oraciones" o "dias"
    if (!tipo) return;

    if (tipo === "oraciones") {
      setText("pageTitle", "Oraciones");
      setText("itemTitle", "Oración (ejemplo)");
      setText("itemMeta", "Sección · Oraciones");
      setText(
        "itemText",
        "Aquí mostraremos una oración real desde data/oraciones.json. " +
        "En el siguiente paso conectamos el archivo JSON y listo."
      );
      document.title = "Oraciones · Novena";
    } else if (tipo === "dias") {
      setText("pageTitle", "Días 1–9");
      setText("itemTitle", "Día 1 (ejemplo)");
      setText("itemMeta", "Sección · Días");
      setText(
        "itemText",
        "Aquí mostraremos la reflexión real del día desde data/dias.json. " +
        "En el siguiente paso conectamos el archivo JSON y navegamos día a día."
      );
      document.title = "Días · Novena";
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
