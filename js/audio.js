// js/audio.js
(function () {
  "use strict";

  function setMsg(text) {
    const el = document.getElementById("audioMsg");
    if (el) el.textContent = text || "";
  }

  function getPlayer() {
    return document.getElementById("audioPlayer");
  }

  function setButtonsEnabled(enabled) {
    const play = document.getElementById("playBtn");
    const pause = document.getElementById("pauseBtn");
    const stop = document.getElementById("stopBtn");
    if (!play || !pause || !stop) return;

    play.disabled = !enabled;
    pause.disabled = !enabled;
    stop.disabled = !enabled;

    const opacity = enabled ? "1" : "0.5";
    play.style.opacity = opacity;
    pause.style.opacity = opacity;
    stop.style.opacity = opacity;
  }

  function initAudioUI() {
    const player = getPlayer();
    if (!player) return;

    // Estado inicial
    setButtonsEnabled(false);
    setMsg("Audio no disponible aún.");

    const play = document.getElementById("playBtn");
    const pause = document.getElementById("pauseBtn");
    const stop = document.getElementById("stopBtn");

    play?.addEventListener("click", async () => {
      try {
        await player.play();
      } catch (e) {
        setMsg("No se pudo reproducir el audio. Verifica el enlace.");
      }
    });

    pause?.addEventListener("click", () => {
      player.pause();
    });

    stop?.addEventListener("click", () => {
      player.pause();
      player.currentTime = 0;
    });

    player.addEventListener("play", () => setMsg("Reproduciendo…"));
    player.addEventListener("pause", () => {
      if (player.currentTime > 0 && !player.ended) setMsg("Pausado.");
    });
    player.addEventListener("ended", () => setMsg("Finalizado."));
    player.addEventListener("error", () => setMsg("Error cargando el audio."));
  }

  // Carga un audio (URL) en el reproductor único
  function loadAudio(url) {
    const player = getPlayer();
    if (!player) return;

    if (!url) {
      player.removeAttribute("src");
      player.load();
      setButtonsEnabled(false);
      setMsg("Audio no disponible para este contenido.");
      return;
    }

    player.src = url;
    player.load();
    setButtonsEnabled(true);
    setMsg("Listo. Pulsa ▶ Escuchar.");
  }

  // Exponer global
  window.initAudioUI = initAudioUI;
  window.loadAudio = loadAudio;
})();
