/* ========================================
   Zetrix AI Academy — Interactive Effects
   ======================================== */

// ===== 1. NEURAL NETWORK PARTICLE SYSTEM (Hero Canvas) =====
(function() {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: null, y: null };

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = Math.min(80, Math.floor(W * H / 15000));
  const CONNECTION_DIST = 120;
  const MOUSE_DIST = 200;

  class Particle {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.size = Math.random() * 2 + 1;
      this.baseAlpha = Math.random() * 0.4 + 0.2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
      // Mouse interaction
      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < MOUSE_DIST) {
          const force = (MOUSE_DIST - dist) / MOUSE_DIST;
          this.vx += (dx / dist) * force * 0.02;
          this.vy += (dy / dist) * force * 0.02;
        }
      }
      // Damping
      this.vx *= 0.99;
      this.vy *= 0.99;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(165,180,252,${this.baseAlpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(165,180,252,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== 2. ANIMATED COUNTERS =====
(function() {
  const counters = document.querySelectorAll('.hero-stat-number[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();
        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(ease * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target + suffix;
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

// ===== 3. TYPING EFFECT =====
(function() {
  const el = document.getElementById('typingText');
  if (!el) return;
  const texts = el.dataset.texts ? JSON.parse(el.dataset.texts) : ['Master AI Across Every Domain'];
  let textIndex = 0, charIndex = 0, isDeleting = false;

  function type() {
    const current = texts[textIndex];
    if (isDeleting) {
      el.textContent = current.substring(0, charIndex--);
    } else {
      el.textContent = current.substring(0, charIndex++);
    }

    let speed = isDeleting ? 40 : 80;
    if (!isDeleting && charIndex === current.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      speed = 500;
    }
    setTimeout(type, speed);
  }
  type();
})();

// ===== 4. 3D TILT CARDS =====
(function() {
  const cards = document.querySelectorAll('.tilt-3d');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2, cy = rect.height / 2;
      const rx = (y - cy) / cy * -12;
      const ry = (x - cx) / cx * 12;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    });
  });
})();

// ===== 5. MAGNETIC BUTTONS =====
(function() {
  const btns = document.querySelectorAll('.magnetic');
  btns.forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0,0)';
    });
  });
})();

// ===== 6. CONFETTI BURST =====
function confettiBurst(x, y) {
  const colors = ['#6366f1','#8b5cf6','#a5b4fc','#fcd34d','#34d399','#f472b6'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;
      width:${Math.random()*8+4}px;height:${Math.random()*8+4}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'50%':'2px'};
      pointer-events:none;z-index:9999;
    `;
    document.body.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 200 + 100;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 200;
    const lifetime = Math.random() * 800 + 600;
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${vx}px, ${vy + 400}px) scale(0)`, opacity: 0 }
    ], { duration: lifetime, easing: 'cubic-bezier(0.25,1,0.5,1)' });
    setTimeout(() => el.remove(), lifetime);
  }
}

// Attach confetti to buttons
(function() {
  document.querySelectorAll('.confetti-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      confettiBurst(rect.left + rect.width/2, rect.top + rect.height/2);
    });
  });
})();

// ===== 7. MOUSE GLOW ORBS =====
(function() {
  const orb = document.getElementById('mouseGlow');
  if (!orb) return;
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function follow() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    orb.style.transform = `translate(${cx - 150}px, ${cy - 150}px)`;
    requestAnimationFrame(follow);
  }
  follow();
})();

// ===== 8. SCROLL VELOCITY TILT =====
(function() {
  let lastY = 0, lastTime = performance.now();
  const sections = document.querySelectorAll('.velocity-tilt');
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const dt = now - lastTime;
    const dy = window.scrollY - lastY;
    const velocity = dy / dt * 10;
    const clamped = Math.max(-5, Math.min(5, velocity));
    sections.forEach(s => {
      s.style.transform = `skewY(${clamped}deg)`;
    });
    lastY = window.scrollY;
    lastTime = now;
  }, { passive: true });
})();

// ===== 9. RIPPLE ON CLICK =====
(function() {
  document.querySelectorAll('.ripple').forEach(el => {
    el.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);
        width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;pointer-events:none;
        animation:rippleAnim 0.6s ease-out forwards;
      `;
      this.style.position = 'relative'; this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
})();

// Inject ripple keyframe
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleAnim {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(2.5); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

// ===== 10. FLOATING EMOJI BACKGROUND (Cert Section) =====
(function() {
  const container = document.getElementById('floatingEmojis');
  if (!container) return;
  const emojis = ['🏆','⭐','🎓','💡','🚀','⚡','🎯','🔥'];
  for (let i = 0; i < 15; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = `
      position:absolute;font-size:${Math.random()*2+1.5}rem;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      opacity:0.08;pointer-events:none;
      animation: floatEmoji ${Math.random()*6+6}s ease-in-out infinite;
      animation-delay: ${Math.random()*5}s;
    `;
    container.appendChild(el);
  }
})();

// Inject float emoji keyframe
const floatStyle = document.createElement('style');
floatStyle.textContent = `
  @keyframes floatEmoji {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
  }
`;
document.head.appendChild(floatStyle);
