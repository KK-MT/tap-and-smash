(function () {
  'use strict';
  window.APP = window.APP || {};

  var PADS = [
    { tone: 'low', label: '低音', color: '#ff5c7c' },
    { tone: 'mid', label: '中音', color: '#ffb703' },
    { tone: 'high', label: '高音', color: '#4cc9f0' }
  ];

  var stageEl, containerEl, controller, sharedCtx;

  function triggerPadHit(padEl, x, y) {
    padEl.classList.remove('hit');
    void padEl.offsetWidth; // force reflow so the animation restarts on rapid retrigger
    padEl.classList.add('hit');
    APP.effects.spawnRipple(padEl, x, y);
    APP.effects.triggerShake(stageEl, { duration: 80 });
    sharedCtx.playSound('drumHit', padEl.dataset.tone);
  }

  function onPointerDown(event) {
    var pad = event.target.closest('.pad');
    if (!pad) return;
    var rect = pad.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    triggerPadHit(pad, x, y);
  }

  function mount(stage, ctxApi) {
    stageEl = stage;
    sharedCtx = ctxApi;
    controller = new AbortController();

    containerEl = document.createElement('div');
    containerEl.className = 'drum-container';

    PADS.forEach(function (p) {
      var pad = document.createElement('div');
      pad.className = 'pad';
      pad.dataset.tone = p.tone;
      pad.style.setProperty('--pad-color', p.color);
      pad.textContent = p.label;
      containerEl.appendChild(pad);
    });

    stageEl.appendChild(containerEl);
    containerEl.addEventListener('pointerdown', onPointerDown, { signal: controller.signal });
  }

  function unmount() {
    controller.abort();
    if (containerEl) {
      containerEl.remove();
      containerEl = null;
    }
  }

  APP.games = APP.games || {};
  APP.games.drum = {
    id: 'drum',
    mount: mount,
    unmount: unmount
  };
})();
