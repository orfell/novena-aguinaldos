// js/accessibility.js
(function () {
  "use strict";

  function forceDarkTheme() {
    // Fuerza oscuro en <html> y <body> para compatibilidad con tu CSS/HTML
    document.documentElement.classList.add("dark");
    document.body?.classList.add("dark");

    // Si quieres mantener consistencia en localStorage (opcional)
    localStorage.setItem("theme", "dark");
  }

  function initAccessibility() {
    const textEl = document.getElementById("itemText");
    const btnMinus = document.getElementById("btnTextSmaller");
    const btnPlus  = document.getElementById("btnTextBigger");

    // 1) Modo oscuro fijo (sin botón de contraste)
    forceDarkTheme();

    // Si no hay texto principal, no hacemos nada más
    if (!textEl) return;

    const MIN = 0.95;
    const MAX = 1.80;
    const STEP = 0.10;

    let size = Number(localStorage.getItem("readingFontSize")) || 1.10;

    function applySize() {
      size = Math.max(MIN, Math.min(MAX, size));
      // Solo el texto principal (NO menús, NO títulos)
      const scope = document.querySelector(".reading-scope");
      scope?.style.setProperty("--scale", size);
      localStorage.setItem("readingFontSize", String(size));
    }

    btnMinus?.addEventListener("click", () => { size -= STEP; applySize(); });
    btnPlus?.addEventListener("click",  () => { size += STEP; applySize(); });

    applySize();
  }

  window.initAccessibility = initAccessibility;
})();
