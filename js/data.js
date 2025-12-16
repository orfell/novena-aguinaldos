// js/data.js
// Cargador simple y confiable de JSON para GitHub Pages (y web en general)

(function () {
  "use strict";

  async function loadJSON(path) {
    // path ejemplo: "data/dias.json"
    const res = await fetch(path, {
      cache: "no-store" // evita que el navegador muestre JSON viejo
    });

    if (!res.ok) {
      throw new Error(`No se pudo cargar ${path} (HTTP ${res.status})`);
    }

    // Validar content-type de forma suave (no todos los servidores lo ponen perfecto)
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
      // No bloqueamos: solo avisamos en consola por si algo raro pasa
      console.warn(`Aviso: ${path} no reporta content-type JSON (recibido: ${contentType})`);
    }

    const data = await res.json();

    // Validación mínima: esperamos un arreglo
    if (!Array.isArray(data)) {
      throw new Error(`El archivo ${path} debe contener un arreglo JSON (ej: [ {...}, {...} ])`);
    }

    return data;
  }

  // Hacemos loadJSON global para que app.js la pueda usar sin imports
  window.loadJSON = loadJSON;
})();
