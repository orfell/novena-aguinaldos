// js/app.js
(function () {
  "use strict";

  // -------------------------
  // Helpers
  // -------------------------
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function toInt(value, fallback = 1) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? "";
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
    return await res.json();
  }

  function show(el, visible) {
    if (!el) return;
    el.style.display = visible ? "" : "none";
  }

  function setAudio(src) {
    const audio = document.getElementById("audioPlayer");
    if (!audio) return;
    audio.src = src || "";
    audio.load();
  }

  // -------------------------
  // Navegación
  // -------------------------
  function setNavVisibility(visible) {
    const navCard = document.getElementById("navCard");
    show(navCard, visible);
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
      btn.classList.add("btn-christmas");
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
      btn.classList.add("btn-christmas");
      if (id === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=oraciones&id=${id}`;
      });

      box.appendChild(btn);
    });

    if (hint) hint.textContent = `Oración actual: ${currentId} de ${labels.length}`;
  }

  // -------------------------
  // Imagen dinámica
  // -------------------------
  function setImageForDias({ safeId, item }) {
    const img = document.getElementById("itemImage");
    if (!img) return;

    img.removeAttribute("src");
    img.alt = "";

    const dayPadded = String(safeId).padStart(2, "0");
    const primarySrc = `assets/img/Dias/Dia_${dayPadded}.jpg`; // D mayúscula
    const fallbackSrc = `assets/img/Dias/Dia_${safeId}.jpg`;

    img.onerror = () => {
      img.onerror = null;
      img.src = fallbackSrc;
    };

    img.src = primarySrc;
    img.alt = item?.Titulo
      ? `Imagen del Día ${safeId}: ${item.Titulo}`
      : `Imagen del Día ${safeId}`;
  }

  function setImageForOraciones({ safeId, item }) {
    const img = document.getElementById("itemImage");
    if (!img) return;

    img.removeAttribute("src");
    img.alt = "";

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
  }

  // -------------------------
  // Selección robusta de oración (evita cruce Gozos ↔ Jesús)
  // -------------------------
  function pickOracionByMenuId(items, safeId) {
    // Mapa de “intención” del botón (menú) -> claves a buscar
    const keys = {
      1: ["todos"],
      2: ["virgen"],
      3: ["sanjose", "san josé", "jose"],
      4: ["jesus", "jesús", "niño", "nino"],
      5: ["gozos", "gozo"],
    };

    const wanted = keys[safeId] || [];
    const norm = (s) => (s || "").toString().toLowerCase();

    // 1) Buscar por Titulo
    let item = items.find((o) => {
      const t = norm(o.Titulo);
      return wanted.some((k) => t.includes(k));
    });

    // 2) Buscar por Audio_Oracion (si el título no ayuda)
    if (!item) {
      item = items.find((o) => {
        const a = norm(o.Audio_Oracion);
        return wanted.some((k) => a.includes(k));
      });
    }

    // 3) Buscar por Texto (último recurso)
    if (!item) {
      item = items.find((o) => {
        const tx = norm(o.Texto);
        return wanted.some((k) => tx.includes(k));
      });
    }

    // 4) Fallback seguro: por Orden (si coincide)
    if (!item) {
      item = items.find((o) => Number(o.Orden) === safeId);
    }

    // 5) Fallback final: por índice
    if (!item) {
      item = items[safeId - 1];
    }

    return item || null;
  }

  // -------------------------
  // Main init
  // -------------------------
  async function init() {
    const pageTitle = document.getElementById("pageTitle");
    if (!pageTitle) return;

    const tipo = (getQueryParam("tipo") || "dias").toLowerCase();
    const currentId = toInt(getQueryParam("id"), 1);

    try {
      setNavVisibility(true);

      if (tipo === "oraciones") {
        showNavMode("oraciones");

        setText("pageTitle", "Oraciones:");
        document.title = "Oraciones · Novena";

        const items = await loadJSON("data/oraciones.json");
        const total = Array.isArray(items) ? items.length : 0;

        // El menú SIEMPRE es 1..5
        const safeId = clamp(currentId, 1, 5);

        const item = pickOracionByMenuId(items, safeId);

        initPrayerButtons(safeId);

        setText("itemTitle", ((item?.Titulo || `Oración ${safeId}`) + ":"));
        setText("itemMeta", `Sección · Oraciones · ${safeId} de 5`);
        setText("itemText", item?.Texto || "Sin contenido todavía.");

        setAudio(item?.Audio_Oracion || item?.Audio || "");

        // Imagen dinámica oraciones
        setImageForOraciones({ safeId, item });
      } else {
        showNavMode("dias");

        setText("pageTitle", "Consideración del Día:");
        document.title = "Días 1–9 · Novena";

        const items = await loadJSON("data/dias.json");
        const total = Array.isArray(items) ? items.length : 0;
        const safeId = clamp(currentId, 1, Math.max(total, 9));

        // Buscar por Dia (preferido) o por índice
        let item =
          (Array.isArray(items) && items.find((d) => Number(d.Dia) === safeId)) ||
          (Array.isArray(items) && items.find((d) => Number(d.id) === safeId)) ||
          (Array.isArray(items) ? items[safeId - 1] : null);

        initDayButtons(safeId, total || 9);

        const titulo = (item?.Titulo || "").trim();
        const fullTitle = titulo ? `Día ${safeId} - ${titulo}:` : `Día ${safeId}:`;

        setText("itemTitle", fullTitle);
        setText(
          "itemMeta",
          `Sección · Días · ${safeId}${total ? " de " + total : ""}${item?.Fecha ? " · " + item.Fecha : ""}`
        );
        setText("itemText", item?.Reflexion || item?.Texto || "Sin contenido todavía.");

        setAudio(item?.Audio_Reflexion || item?.Audio || "");

        // Imagen dinámica días
        setImageForDias({ safeId, item });
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
