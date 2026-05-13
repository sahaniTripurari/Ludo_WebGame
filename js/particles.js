// ===== PARTICLE BACKGROUND =====
const Particles = (() => {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return { init() { }, resize() { } };
  const c = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5, a: Math.random() * 0.3 + 0.05
    };
  }

  function draw() {
    c.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fillStyle = `rgba(255,255,255,${p.a})`; c.fill();
    }
    // Draw lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = dx * dx + dy * dy;
        if (d < 12000) {
          c.beginPath(); c.moveTo(particles[i].x, particles[i].y);
          c.lineTo(particles[j].x, particles[j].y);
          c.strokeStyle = `rgba(255,255,255,${0.03 * (1 - d / 12000)})`;
          c.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  return {
    init() {
      resize();
      const count = Math.min(60, Math.floor((W * H) / 15000));
      particles = Array.from({ length: count }, createParticle);
      draw();
      window.addEventListener('resize', () => { resize(); });
    }
  };
})();
