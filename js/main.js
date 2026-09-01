(function () {
  'use strict';
  window.APP = window.APP || {};

  var GAME_LIST = [
    { id: 'balloon', label: '風船割り', icon: '🎈' },
    { id: 'paper', label: '紙くしゃくしゃ', icon: '📄' },
    { id: 'drum', label: '太鼓叩き', icon: '🥁' }
  ];

  APP.state = {
    currentGame: 'balloon',
    soundEnabled: false
  };

  var sharedCtx = {
    playSound: function (type, param) {
      APP.audio.playSound(type, param);
    },
    isSoundEnabled: function () {
      return APP.audio.isSoundEnabled();
    }
  };

  var stageEl, switcherEl;

  function updateTabUI(activeId) {
    var buttons = switcherEl.querySelectorAll('.switch-btn');
    buttons.forEach(function (btn) {
      var isActive = btn.dataset.game === activeId;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.classList.toggle('active', isActive);
    });
  }

  function switchGame(id) {
    if (id === APP.state.currentGame || !APP.games[id]) return;
    APP.games[APP.state.currentGame].unmount();
    stageEl.replaceChildren();
    APP.state.currentGame = id;
    updateTabUI(id);
    APP.games[id].mount(stageEl, sharedCtx);
  }

  function buildSwitcher() {
    switcherEl = document.createElement('nav');
    switcherEl.id = 'game-switcher';
    switcherEl.setAttribute('role', 'tablist');
    switcherEl.setAttribute('aria-label', '発散方法の切り替え');

    GAME_LIST.forEach(function (g) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'switch-btn';
      btn.dataset.game = g.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', g.id === APP.state.currentGame ? 'true' : 'false');
      btn.textContent = g.icon + ' ' + g.label;
      switcherEl.appendChild(btn);
    });

    switcherEl.addEventListener('click', function (event) {
      var btn = event.target.closest('.switch-btn');
      if (!btn) return;
      switchGame(btn.dataset.game);
    });

    document.body.appendChild(switcherEl);
  }

  function start() {
    stageEl = document.getElementById('stage');
    buildSwitcher();
    updateTabUI(APP.state.currentGame);
    APP.games[APP.state.currentGame].mount(stageEl, sharedCtx);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
