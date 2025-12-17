// js/accessibility.js
(function () {
  "use strict";

  function forceDarkTheme() {
    document.documentElement.classList.add("dark");
    document.body?.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }

  function initAccessibility() {
    forceDarkTheme();

    const btnMinus = document.getElementById("btnTextSmaller");
    const btnPlus  = document.getElementById("btnTextBigger");

    // Si por alguna razón no existen botones, no rompas la app
    if (!btnMinus || !btnPlus) return;

    const MIN = 0.85;
    const MAX = 1.80;
    const STEP = 0.10;

    // Guarda la escala
    let scale = Number(localStorage.getItem("readingScale")) || 1.0;

    function applyScale() {
      scale = Math.max(MIN, Math.min(MAX, scale));
      // La escala vive en el body, pero SOLO afecta elementos que usen --reading-scale
      document.body.style.setProperty("--reading-scale", String(scale));
      localStorage.setItem("readingScale", String(scale));
    }

    btnMinus.addEventListener("click", () => { scale -= STEP; applyScale(); });
    btnPlus .addEventListener("click", () => { scale += STEP; applyScale(); });

    applyScale();
  }

  window.initAccessibility = initAccessibility;
})();
