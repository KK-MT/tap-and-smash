(function () {
  'use strict';
  window.APP = window.APP || {};

  var MAX_BALLOONS = 8;
  var SPAWN_INTERVAL_MS = 800;
  var COLORS = ['#ff5c7c', '#ffb703', '#4cc9f0', '#7bdc6a', '#c77dff'];

  var canvas, ctx, controller, rafId, spawnTimerId;
  var balloons, rings, particleSystem;
  var lastTime;
  var cssWidth, cssHeight;
  var sharedCtx;

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBalloon(initial) {
    if (balloons.length >= MAX_BALLOONS) return;
    var radius = 30 + Math.random() * 20;
    var y = initial
      ? radius + Math.random() * Math.max(1, cssHeight - radius * 2)
      : cssHeight + radius;
    balloons.push({
      x: radius + Math.random() * Math.max(1, cssWidth - radius * 2),
      y: y,
      radius: radius,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vy: -(40 + Math.random() * 30),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 10 + Math.random() * 15,
      wobbleFreq: 1 + Math.random() * 1.5,
      time: 0
    });
  }

  function popBalloon(index, tapX, tapY) {
    var balloon = balloons[index];
    balloons.splice(index, 1);
    particleSystem.spawnBurst(tapX, tapY, {
      count: 12,
      color: balloon.color,
      speedRange: [100, 260],
      life: 380
    });
    rings.push({
      x: tapX,
      y: tapY,
      radius: balloon.radius * 0.4,
      maxRadius: balloon.radius * 1.6,
      age: 0,
      life: 220,
      color: balloon.color
    });
    sharedCtx.playSound('balloonPop');
  }

  function onPointerDown(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var tolerance = 8;
    for (var i = balloons.length - 1; i >= 0; i--) {
      var b = balloons[i];
      var dx = x - b.x;
      var dy = y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) <= b.radius + tolerance) {
        popBalloon(i, x, y);
        break;
      }
    }
  }

  function update(dtMs) {
    var dt = dtMs / 1000;
    for (var i = balloons.length - 1; i >= 0; i--) {
      var b = balloons[i];
      b.time += dt;
      b.y += b.vy * dt;
      b.x += Math.sin(b.time * b.wobbleFreq + b.wobblePhase) * b.wobbleAmp * dt;
      if (b.y < -b.radius) {
        balloons.splice(i, 1);
      }
    }
    for (var j = rings.length - 1; j >= 0; j--) {
      rings[j].age += dtMs;
      if (rings[j].age >= rings[j].life) rings.splice(j, 1);
    }
    particleSystem.update(dtMs);
  }

  function drawBalloon(b) {
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.radius * 0.85, b.radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(b.x - b.radius * 0.3, b.y - b.radius * 0.4, b.radius * 0.2, b.radius * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(b.x - 4, b.y + b.radius);
    ctx.lineTo(b.x + 4, b.y + b.radius);
    ctx.lineTo(b.x, b.y + b.radius + 8);
    ctx.closePath();
    ctx.fillStyle = b.color;
    ctx.fill();
  }

  function drawRing(r) {
    var t = r.age / r.life;
    var radius = r.radius + (r.maxRadius - r.radius) * t;
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.lineWidth = 3;
    ctx.strokeStyle = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    for (var i = 0; i < balloons.length; i++) drawBalloon(balloons[i]);
    for (var j = 0; j < rings.length; j++) drawRing(rings[j]);
    particleSystem.draw(ctx);
  }

  function loop(now) {
    if (lastTime === undefined) lastTime = now;
    var dtMs = now - lastTime;
    lastTime = now;
    update(dtMs);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function mount(stageEl, ctxApi) {
    sharedCtx = ctxApi;
    controller = new AbortController();
    balloons = [];
    rings = [];
    particleSystem = APP.effects.createParticleSystem();
    lastTime = undefined;

    canvas = document.createElement('canvas');
    canvas.className = 'balloon-canvas';
    stageEl.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resizeCanvas();

    canvas.addEventListener('pointerdown', onPointerDown, { signal: controller.signal });
    window.addEventListener('resize', resizeCanvas, { signal: controller.signal });
    window.addEventListener('orientationchange', resizeCanvas, { signal: controller.signal });

    for (var i = 0; i < 4; i++) {
      spawnBalloon(true);
    }
    spawnTimerId = setInterval(spawnBalloon, SPAWN_INTERVAL_MS);
    rafId = requestAnimationFrame(loop);
  }

  function unmount() {
    controller.abort();
    clearInterval(spawnTimerId);
    cancelAnimationFrame(rafId);
    balloons = [];
    rings = [];
    if (canvas) {
      canvas.remove();
      canvas = null;
    }
  }

  APP.games = APP.games || {};
  APP.games.balloon = {
    id: 'balloon',
    mount: mount,
    unmount: unmount
  };
})();
