// js/accessibility.js
(function () {
  "use strict";

  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.4;
  const STEP = 0.1;

  function applySettings() {
    const scale = localStorage.getItem("fontScale");
    const theme = localStorage.getItem("theme");

    if (scale) {
      document.documentElement.style.setProperty("--font-scale", scale);
    }

    if (theme === "dark") {
      document.body.classList.add("dark");
    }
  }

  function initAccessibility() {
    const minus = document.getElementById("fontMinus");
    const plus = document.getElementById("fontPlus");
    const toggle = document.getElementById("toggleTheme");

    let currentScale = parseFloat(localStorage.getItem("fontScale")) || 1;

    minus?.addEventListener("click", () => {
      currentScale = Math.max(MIN_SCALE, currentScale - STEP);
      document.documentElement.style.setProperty("--font-scale", currentScale);
      localStorage.setItem("fontScale", currentScale);
    });

    plus?.addEventListener("click", () => {
      currentScale = Math.min(MAX_SCALE, currentScale + STEP);
      document.documentElement.style.setProperty("--font-scale", currentScale);
      localStorage.setItem("fontScale", currentScale);
    });

    toggle?.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
    });

    applySettings();
  }

  window.initAccessibility = initAccessibility;
})();
