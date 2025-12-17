// js/app.js
(function () {
  "use strict";

  // ---------- Helpers ----------
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function clampInt(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? "";
  }

  function setHTML(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = value ?? "";
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
    return await res.json();
  }

  function show(el, isVisible) {
    if (!el) return;
    el.style.display = isVisible ? "" : "none";
  }

  // ---------- UI: navegación ----------
  function initDayButtons(currentId, total) {
    const box = document.getElementById("dayButtons");
    const hint = document.getElementById("navHint");
    const navTitle = document.getElementById("navTitle");
    if (!box) return;

    if (navTitle) navTitle.textContent = "Ir al día";
    box.innerHTML = "";

    for (let i = 1; i <= total; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(i);
      btn.className = "btn-christmas";
      if (i === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=dias&id=${i}`;
      });

      box.appendChild(btn);
    }

    if (hint) hint.textContent = `Día actual: ${currentId} de ${total}`;
  }

  function initPrayerButtons(currentId) {
    const box = document.getElementById("prayerButtons");
    const hint = document.getElementById("navHint");
    const navTitle = document.getElementById("navTitle");
    if (!box) return;

    if (navTitle) navTitle.textContent = "Ir a la oración";
    box.innerHTML = "";

    const labels = [
      "Oración para todos los días",
      "Oración a la Virgen",
      "Oración a San José",
      "Oración al Niño Jesús",
      "Los Gozos",
    ];

    labels.forEach((label, idx) => {
      const id = idx + 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.className = "btn-christmas";
      if (id === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=oraciones&id=${id}`;
      });

      box.appendChild(btn);
    });

    if (hint) hint.textContent = `Oración actual: ${currentId} de ${labels.length}`;
  }

  function showNavMode(mode) {
    const dayButtons = document.getElementById("dayButtons");
    const prayerButtons = document.getElementById("prayerButtons");

    if (mode === "dias") {
      show(dayButtons, true);
      show(prayerButtons, false);
    } else {
      show(dayButtons, false);
      show(prayerButtons, true);
    }
  }

  // ---------- Media helpers ----------
  function setDynamicImage({ safeId, tipo, item }) {
    const media = document.getElementById("readingMedia");
    const img = document.getElementById("itemImage");
    if (!media || !img) return;

    // Limpieza previa
    img.removeAttribute("src");
    img.alt = "";

    if (tipo === "dias") {
      const dayPadded = String(safeId).padStart(2, "0");
      const primary = `assets/img/Dias/Dia_${dayPadded}.jpg`;   // D mayúscula
      const fallback = `assets/img/Dias/Dia_${safeId}.jpg`;

      img.onerror = () => {
        img.onerror = null;
        img.src = fallback;
      };

      img.src = primary;
      img.alt = item?.Titulo
        ? `Imagen del Día ${safeId}: ${item.Titulo}`
        : `Imagen del Día ${safeId}`;
      return;
    }

    if (tipo === "oraciones") {
      // Orden fijo 1..5 según tu menú / JSON
      const map = {
        1: "img_oracion_todos.jpg",
        2: "img_oracion_virgen.jpg",
        3: "img_oracion_sanjose.jpg",
        4: "img_oracion_jesus.jpg",
        5: "img_gozos.jpg",
      };

      const filename = map[safeId];
      if (!filename) return;

      img.src = `assets/img/Oracion/${filename}`; // O mayúscula
      img.alt = item?.Titulo ? `Imagen: ${item.Titulo}` : "Imagen de la oración";
      return;
    }
  }

  function setAudio(src) {
    const audio = document.getElementById("audioPlayer");
    if (!audio) return;
    audio.src = src || "";
    audio.load();
  }

  // ---------- Main ----------
  async function init() {
    // Si no existe el título de página, no hacemos nada
    const pageTitle = document.getElementById("pageTitle");
    if (!pageTitle) return;

    const tipo = (getQueryParam("tipo") || "dias").toLowerCase();
    const idParam = parseInt(getQueryParam("id") || "1", 10);
    const requestedId = Number.isFinite(idParam) ? idParam : 1;

    try {
      // Siempre mostramos nav card (tu app lo usa)
      const navCard = document.getElementById("navCard");
      show(navCard, true);

      if (tipo === "oraciones") {
        showNavMode("oraciones");

        setText("pageTitle", "Oraciones:");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const total = Array.isArray(items) ? items.length : 0;
        const safeId = clampInt(requestedId, 1, Math.max(total, 1));

        // Encontrar por Orden (preferido) o por índice
        let item = items.find((o) => Number(o.Orden) === safeId);
        if (!item) item = items[safeId - 1];

        initPrayerButtons(safeId);

        setText("itemTitle", (item?.Titulo || `Oración ${safeId}`) + ":");
        setText("itemMeta", `Sección · Oraciones · ${safeId}${total ? " de " + total : ""}`);
        setText("itemText", item?.Texto || "Sin contenido todavía.");

        // Audio de oraciones
        setAudio(item?.Audio_Oracion || item?.Audio || "");

        // Imagen dinámica de oraciones
        setDynamicImage({ safeId, tipo: "oraciones", item });
      } else {
        // DÍAS (por defecto)
        showNavMode("dias");

        setText("pageTitle", "Consideración del Día:");
        document.title = "Días 1–9 · Novena";

        const items = await loadJSON("data/dias.json");
        const total = Array.isArray(items) ? items.length : 0;
        const safeId = clampInt(requestedId, 1, Math.max(total, 1));

        // Encontrar por Dia (preferido) o por índice
        let item =
          items.find((d) => Number(d.Dia) === safeId) ||
          items.find((d) => Number(d.id) === safeId);
        if (!item) item = items[safeId - 1];

        initDayButtons(safeId, total || 9);

        setText("itemTitle", `Día ${safeId} - ${(item?.Titulo || "").trim()}`.trim() + ":");
        setText(
          "itemMeta",
          `Sección · Días · ${safeId}${total ? " de " + total : ""}${item?.Fecha ? " · " + item.Fecha : ""}`
        );

        setText("itemText", item?.Reflexion || item?.Texto || "Sin contenido todavía.");

        // Audio de días
        setAudio(item?.Audio_Reflexion || item?.Audio || "");

        // Imagen dinámica de días
        setDynamicImage({ safeId, tipo: "dias", item });
      }

      // Accesibilidad (si existe)
      if (typeof window.initAccessibility === "function") {
        window.initAccessibility();
      }
    } catch (err) {
      console.error(err);

      setText("pageTitle", "Error cargando datos");
      setText("itemTitle", "Error");
      setText("itemMeta", "");
      setText("itemText", err?.message || "Ocurrió un error.");

      // Limpieza de audio/imagen
      setAudio("");
      const img = document.getElementById("itemImage");
      if (img) {
        img.removeAttribute("src");
        img.alt = "";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
