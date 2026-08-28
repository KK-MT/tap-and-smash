(function () {
  'use strict';
  window.APP = window.APP || {};

  var audioCtx = null;
  var masterGain = null;
  var soundEnabled = false;

  function initAudioOnce() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Web Audio API is not supported');
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(audioCtx.destination);
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }
      soundEnabled = true;
    } catch (e) {
      audioCtx = null;
      masterGain = null;
      soundEnabled = false;
      console.warn('[audio] initialization failed, continuing without sound', e);
    }
  }

  function synthBalloonPop() {
    if (!audioCtx || !masterGain) return;
    var now = audioCtx.currentTime;

    // Tonal "pop" component: quick downward pitch sweep
    var osc = audioCtx.createOscillator();
    var oscGain = audioCtx.createGain();
    var startFreq = 900 + Math.random() * 300;
    osc.type = 'square';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.9, now + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.14);

    // Noise burst component for a "burst" texture
    var bufferSize = Math.floor(audioCtx.sampleRate * 0.08);
    var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    var bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1800 + Math.random() * 600;
    bandpass.Q.value = 1.2;
    var noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    switch (type) {
      case 'balloonPop':
        synthBalloonPop();
        break;
      default:
        break;
    }
  }

  window.addEventListener('pointerdown', initAudioOnce, { once: true, capture: true });

  APP.audio = {
    playSound: playSound,
    isSoundEnabled: function () {
      return soundEnabled;
    }
  };
})();
