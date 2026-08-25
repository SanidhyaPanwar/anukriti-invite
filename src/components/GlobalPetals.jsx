import { useEffect } from 'react';

export default function GlobalPetals() {
  useEffect(() => {
    const canvas = document.getElementById('global-petals-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COLORS = ['#8b5cf6', '#d946ef', '#D4AF37', '#7e57c2', '#ffffff'];
    const COUNT = window.innerWidth < 600 ? 18 : 30;
    const petals = [];

    class Petal {
      constructor() { this.reset(true); }
      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height * 2 - canvas.height : -20;
        this.r = 4 + Math.random() * 5;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = 0.5 + Math.random() * 1.0;
        this.rot = Math.random() * Math.PI * 2;
        this.drot = (Math.random() - 0.5) * 0.03;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = 0.4 + Math.random() * 0.3;
      }
      update() {
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.3;
        this.y += this.vy;
        this.rot += this.drot;
        if (this.y > canvas.height + 20) this.reset(false);
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      }
    }

    for (let i = 0; i < COUNT; i++) petals.push(new Petal());

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => { p.update(); p.draw(); });
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas 
      id="global-petals-canvas" 
      className="fixed inset-0 pointer-events-none z-0" 
    />
  );
}