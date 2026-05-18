// Confetti me canvas - i thjeshte, asnje library.
// Genjeshtra: piksela me ngjyra qe bien me gravitet + rrotullim.

import { useEffect, useRef } from 'react';

const COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#dc2626', '#0ea5e9', '#a855f7', '#ec4899'];

export default function Confetti({ active, count = 150, durationMs = 4000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    }));

    let raf;
    const start = Date.now();

    function frame() {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.rot += p.vrot;

        if (p.y > h + 30) {
          // riciklo lart kur del nga ekrani per nje shfaqje me te gjate
          if (elapsed < durationMs - 1500) {
            p.y = -10;
            p.x = Math.random() * w;
            p.vy = 2 + Math.random() * 3;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < durationMs) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [active, count, durationMs]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
}
