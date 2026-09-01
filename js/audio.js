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

  function synthPaperCrumple() {
    if (!audioCtx || !masterGain) return;
    var t = audioCtx.currentTime;
    var pulses = 2 + Math.floor(Math.random() * 2);
    for (var p = 0; p < pulses; p++) {
      var dur = 0.02 + Math.random() * 0.03;
      var bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      var noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      var filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500 + Math.random() * 2500;
      filter.Q.value = 0.8;
      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(t);
      noise.stop(t + dur);
      t += dur + Math.random() * 0.015;
    }
  }

  var DRUM_TONE_FREQ = { low: 65, mid: 110, high: 170 };

  function synthDrumHit(tone) {
    if (!audioCtx || !masterGain) return;
    var now = audioCtx.currentTime;
    var baseFreq = DRUM_TONE_FREQ[tone] || DRUM_TONE_FREQ.mid;

    var osc = audioCtx.createOscillator();
    var oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 2.2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.18);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(1.0, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.3);

    var bufferSize = Math.floor(audioCtx.sampleRate * 0.015);
    var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    var hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    var noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    noise.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
    noise.stop(now + 0.02);
  }

  function playSound(type, param) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    switch (type) {
      case 'balloonPop':
        synthBalloonPop();
        break;
      case 'paperCrumple':
        synthPaperCrumple();
        break;
      case 'drumHit':
        synthDrumHit(param);
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
