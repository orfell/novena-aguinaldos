// js/audio.js
(function () {
  "use strict";

  let audio;

  function initAudioUI() {
    audio = document.getElementById("audioPlayer");
    const hint = document.getElementById("audioHint");

    if (!audio) return;

    audio.style.display = "none";

    if (hint) {
      hint.textContent = "Audio no disponible para este contenido.";
    }
  }

  function loadAudio(url) {
    const hint = document.getElementById("audioHint");
    if (!audio) return;

    if (!url) {
      audio.style.display = "none";
      audio.removeAttribute("src");

      if (hint) {
        hint.textContent = "Audio no disponible para este contenido.";
      }
      return;
    }

    audio.src = url;
    audio.load();
    audio.style.display = "block";

    if (hint) {
      hint.textContent = "Pulsa ▶ para escuchar el audio.";
    }
  }

  window.initAudioUI = initAudioUI;
  window.loadAudio = loadAudio;
})();
