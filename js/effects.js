(function () {
  'use strict';
  window.APP = window.APP || {};

  function createParticleSystem() {
    var particles = [];

    function spawnBurst(x, y, options) {
      options = options || {};
      var count = options.count || 10;
      var color = options.color || '#ffffff';
      var speedRange = options.speedRange || [80, 220];
      var life = options.life || 350;

      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        var speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random() * 3,
          color: color,
          age: 0,
          life: life
        });
      }
    }

    function update(dtMs) {
      var dt = dtMs / 1000;
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.age += dtMs;
        if (p.age >= p.life) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt; // slight gravity for a natural fall-off
      }
    }

    function draw(ctx) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var t = p.age / p.life;
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    return { spawnBurst: spawnBurst, update: update, draw: draw };
  }

  APP.effects = {
    createParticleSystem: createParticleSystem
  };
})();
