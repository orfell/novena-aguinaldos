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

  function showNavMode(mode) {
    // mode: "dias" | "oraciones"
    const dayBox = document.getElementById("dayButtons");
    const prayerBox = document.getElementById("prayerButtons");

    if (dayBox) dayBox.style.display = mode === "dias" ? "grid" : "none";
    if (prayerBox) prayerBox.style.display = mode === "oraciones" ? "grid" : "none";
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

  function initPrayerButtons(currentId, items) {
    const box = document.getElementById("prayerButtons");
    const hint = document.getElementById("navHint");
    const navTitle = document.getElementById("navTitle");
    if (!box) return;

    if (navTitle) navTitle.textContent = "Ir a la oración";
    box.innerHTML = "";

    // Orden fijo y nombres EXACTOS como los pediste
    const desired = [
      { key: "todos", label: "Oración para todos los días" },
      { key: "virgen", label: "Oración a la Virgen" },
      { key: "sanjose", label: "Oración a San José" },
      { key: "gozos", label: "Gozos" },
      { key: "nino", label: "Oración al Niño Jesús" }
    ];

    function findItemByLabel(label) {
      const low = (label || "").toLowerCase();
      // buscamos por coincidencia flexible en el Titulo del JSON
      return items.find(it => (it.Titulo || "").toLowerCase().includes(low.replace("oración ", ""))) ||
             items.find(it => (it.Titulo || "").toLowerCase().includes(low));
    }

    // Construye 5 botones en el orden deseado
    const resolved = desired.map(d => {
      // Intento 1: match por palabras clave
      let item =
        items.find(it => (it.Titulo || "").toLowerCase().includes(d.key)) ||
        findItemByLabel(d.label);

      return { label: d.label, item };
    }).filter(x => x.item); // si alguno no existe en JSON, no lo dibuja

    // Si por alguna razón no resolvió, cae al listado natural por Orden
    const list = resolved.length ? resolved : [...items].sort((a, b) => (a.Orden || 0) - (b.Orden || 0))
      .map(it => ({ label: it.Titulo || "Oración", item: it }));

    list.forEach(({ label, item }) => {
      const id = Number(item.Orden) || 1;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;

      if (id === currentId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        window.location.href = `day.html?tipo=oraciones&id=${id}`;
      });

      box.appendChild(btn);
    });

    const total = items.length || 1;
    if (hint) hint.textContent = `Oración actual: ${currentId} de ${total}`;
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
        setNavVisibility(true);
        showNavMode("oraciones");

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

        initPrayerButtons(safeId, items);
        applyAudio(item, tipo);
        return;
      }

      if (tipo === "dias") {
        setNavVisibility(true);
        showNavMode("dias");

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
