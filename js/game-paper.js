(function () {
  'use strict';
  window.APP = window.APP || {};

  var BASE_INCREMENT = 15;
  var MOVE_INCREMENT_DIVISOR = 10;
  var MOVE_INCREMENT_CAP = 6;
  var SOUND_THROTTLE_MS = 60;
  var RESET_DELAY_MS = 500;
  var CREASE_COUNT = 5;
  var BLOB_KEYS = [
    '--b1x', '--b1y', '--b2x', '--b2y', '--b3x', '--b3y', '--b4x', '--b4y', '--b5x', '--b5y',
    '--h1x', '--h1y', '--h2x', '--h2y', '--h3x', '--h3y'
  ];
  var CORNER_KEYS = ['--r-tl', '--r-tr', '--r-br', '--r-bl'];

  var stageEl, paperEl, controller, sharedCtx;
  var crumpleLevel, isDragging, lastX, lastY, lastSoundTime, resetTimerId, creaseEls;

  function applyCrumpleStyle() {
    paperEl.style.setProperty('--crumple', crumpleLevel / 100);
  }

  // Randomizes the shadow/highlight blob positions, corner radius bias,
  // and fold-line placement so every new sheet crumples into a
  // differently-shaped, non-uniform wad instead of a perfect circle.
  function randomizeTexture() {
    BLOB_KEYS.forEach(function (key) {
      paperEl.style.setProperty(key, (10 + Math.random() * 80).toFixed(1) + '%');
    });
    CORNER_KEYS.forEach(function (key) {
      paperEl.style.setProperty(key, (0.6 + Math.random() * 0.7).toFixed(2));
    });

    creaseEls.forEach(function (el) { el.remove(); });
    creaseEls = [];
    for (var i = 0; i < CREASE_COUNT; i++) {
      var crease = document.createElement('div');
      crease.className = 'crease';
      crease.style.left = (15 + Math.random() * 70).toFixed(1) + '%';
      crease.style.top = (15 + Math.random() * 70).toFixed(1) + '%';
      crease.style.setProperty('--angle', (Math.random() * 360).toFixed(1) + 'deg');
      crease.style.setProperty('--len', (0.6 + Math.random() * 0.6).toFixed(2));
      paperEl.appendChild(crease);
      creaseEls.push(crease);
    }
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
    randomizeTexture();
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
    creaseEls = [];

    paperEl = document.createElement('div');
    paperEl.className = 'paper';
    stageEl.appendChild(paperEl);
    applyCrumpleStyle();
    randomizeTexture();

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
