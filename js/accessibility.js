// js/accessibility.js
(function () {
  "use strict";

  function initAccessibility() {
    const textEl = document.getElementById("itemText");
    const btnMinus = document.getElementById("btnTextSmaller");
    const btnPlus  = document.getElementById("btnTextBigger");
    const btnTheme = document.getElementById("btnToggleTheme");

    if (!textEl) return;

    const MIN = 0.95;
    const MAX = 1.80;
    const STEP = 0.10;

    let size = Number(localStorage.getItem("readingFontSize")) || 1.10;

    function applySize() {
      size = Math.max(MIN, Math.min(MAX, size));
      // Solo el texto principal
      textEl.style.setProperty("--reading-font-size", `${size}rem`);
      localStorage.setItem("readingFontSize", String(size));
    }

    btnMinus?.addEventListener("click", () => { size -= STEP; applySize(); });
    btnPlus?.addEventListener("click",  () => { size += STEP; applySize(); });

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

  window.initAccessibility = initAccessibility;
})();
