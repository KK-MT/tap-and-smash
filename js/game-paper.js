(function () {
  'use strict';
  window.APP = window.APP || {};

  var BASE_INCREMENT = 15;
  var MOVE_INCREMENT_DIVISOR = 10;
  var MOVE_INCREMENT_CAP = 6;
  var SOUND_THROTTLE_MS = 60;
  var RESET_DELAY_MS = 500;

  var stageEl, paperEl, controller, sharedCtx;
  var crumpleLevel, isDragging, lastX, lastY, lastSoundTime, resetTimerId;

  function applyCrumpleStyle() {
    paperEl.style.setProperty('--crumple', crumpleLevel / 100);
  }

  function jitter() {
    paperEl.classList.remove('jitter');
    void paperEl.offsetWidth; // force reflow so the animation restarts on rapid retrigger
    paperEl.classList.add('jitter');
  }

  function maybePlaySound() {
    var now = performance.now();
    if (now - lastSoundTime > SOUND_THROTTLE_MS) {
      lastSoundTime = now;
      sharedCtx.playSound('paperCrumple');
    }
  }

  function addCrumple(amount) {
    if (crumpleLevel >= 100) return;
    crumpleLevel = Math.min(100, crumpleLevel + amount);
    applyCrumpleStyle();
    jitter();
    maybePlaySound();
    if (crumpleLevel >= 100) {
      onFullyCrumpled();
    }
  }

  function onFullyCrumpled() {
    paperEl.classList.add('crumpled');
    resetTimerId = setTimeout(resetPaper, RESET_DELAY_MS);
  }

  function resetPaper() {
    crumpleLevel = 0;
    isDragging = false;
    paperEl.classList.remove('crumpled');
    applyCrumpleStyle();
  }

  function onPointerDown(event) {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    addCrumple(BASE_INCREMENT);
    if (paperEl.setPointerCapture) {
      try { paperEl.setPointerCapture(event.pointerId); } catch (e) {}
    }
  }

  function onPointerMove(event) {
    if (!isDragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 4) {
      addCrumple(Math.min(MOVE_INCREMENT_CAP, dist / MOVE_INCREMENT_DIVISOR));
      lastX = event.clientX;
      lastY = event.clientY;
    }
  }

  function onPointerUp() {
    isDragging = false;
  }

  function mount(stage, ctxApi) {
    stageEl = stage;
    sharedCtx = ctxApi;
    controller = new AbortController();
    crumpleLevel = 0;
    isDragging = false;
    lastSoundTime = 0;

    paperEl = document.createElement('div');
    paperEl.className = 'paper';
    stageEl.appendChild(paperEl);
    applyCrumpleStyle();

    paperEl.addEventListener('pointerdown', onPointerDown, { signal: controller.signal });
    paperEl.addEventListener('pointermove', onPointerMove, { signal: controller.signal });
    paperEl.addEventListener('pointerup', onPointerUp, { signal: controller.signal });
    paperEl.addEventListener('pointercancel', onPointerUp, { signal: controller.signal });
  }

  function unmount() {
    controller.abort();
    clearTimeout(resetTimerId);
    if (paperEl) {
      paperEl.remove();
      paperEl = null;
    }
  }

  APP.games = APP.games || {};
  APP.games.paper = {
    id: 'paper',
    mount: mount,
    unmount: unmount
  };
})();
