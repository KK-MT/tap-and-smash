(function () {
  'use strict';
  window.APP = window.APP || {};

  APP.state = {
    currentGame: 'balloon',
    soundEnabled: false
  };

  var sharedCtx = {
    playSound: function (type) {
      APP.audio.playSound(type);
    },
    isSoundEnabled: function () {
      return APP.audio.isSoundEnabled();
    }
  };

  function start() {
    var stageEl = document.getElementById('stage');
    var game = APP.games[APP.state.currentGame];
    game.mount(stageEl, sharedCtx);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
