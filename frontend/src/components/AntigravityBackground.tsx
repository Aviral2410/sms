import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

interface AntigravityBackgroundProps {
  particleCount?: number;
  showOrbs?: boolean;
  baseColor?: string;
  cursorFollow?: boolean;
}

export const AntigravityBackground: React.FC<AntigravityBackgroundProps> = ({ 
  particleCount = 160,
  showOrbs = false,
  baseColor,
  cursorFollow = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accentColor } = useStore();
  const effectiveColor = baseColor || accentColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const scientificGlyphs = [
      '∑', 'π', 'Δ', 'λ', 'μ', 'Ω', '∞', '∫', '√', '≈', '≠', '≤', '≥', '∂', '∇',
      'θ', 'σ', 'φ', 'α', 'β', 'γ', 'η', 'κ', 'ρ', 'τ',
      '×', '÷', '±', '⋅', '⋆', '→', '←', '↔', '∴', '∝', '∈', '∉', '∩', '∪',
    ];

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      dx: 0,
      dy: 0,
      active: false,
    };

    let lastPointerX = pointer.x;
    let lastPointerY = pointer.y;

    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      pointer.dx = x - lastPointerX;
      pointer.dy = y - lastPointerY;
      lastPointerX = x;
      lastPointerY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.dx *= 0.4;
      pointer.dy *= 0.4;
    };

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    if (cursorFollow) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('mouseleave', onPointerLeave, { passive: true } as AddEventListenerOptions);
      window.addEventListener('blur', onPointerLeave);
    }

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      color: string;
      glyph: string;
      fontSize: number;
      rot: number;
      vrot: number;
    };
    const colors = [
      `${effectiveColor}44`,
      'rgba(34,211,238,', 'rgba(99,102,241,', 'rgba(255,182,99,', 'rgba(167,139,250,', 'rgba(52,211,153,'
    ];
    
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      glyph: scientificGlyphs[Math.floor(Math.random() * scientificGlyphs.length)],
      fontSize: Math.random() * 8 + 10,
      rot: (Math.random() - 0.5) * 0.6,
      vrot: (Math.random() - 0.5) * 0.01,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Cursor "wind" + mild attraction (kept subtle so it doesn't feel distracting)
      const windX = cursorFollow && pointer.active ? pointer.dx * 0.006 : 0;
      const windY = cursorFollow && pointer.active ? pointer.dy * 0.006 : 0;
      if (cursorFollow && pointer.active) {
        pointer.dx *= 0.86;
        pointer.dy *= 0.86;
        if (Math.abs(pointer.dx) < 0.02) pointer.dx = 0;
        if (Math.abs(pointer.dy) < 0.02) pointer.dy = 0;
      }
      particles.forEach(p => {
        if (cursorFollow && pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          const attract = 0.00002 * Math.min(1, 22000 / Math.max(1, d2));
          p.vx += dx * attract + windX;
          p.vy += dy * attract + windY;
        }

        // Cap velocity for a calm feel
        const speed = Math.hypot(p.vx, p.vy);
        const maxSpeed = 1.15;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        if (p.x < -30) p.x = window.innerWidth + 30;
        if (p.x > window.innerWidth + 30) p.x = -30;
        if (p.y < -30) p.y = window.innerHeight + 30;
        if (p.y > window.innerHeight + 30) p.y = -30;

        const fill = p.color.startsWith('#') ? p.color : `${p.color}${p.alpha})`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = fill;
        ctx.font = `${p.fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1, Math.max(0, p.alpha + 0.15));
        ctx.fillText(p.glyph, 0, 0);
        ctx.globalAlpha = 1;
        ctx.restore();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `${effectiveColor}${Math.floor(0.1 * (1 - d / 110) * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (cursorFollow) {
        window.removeEventListener('pointermove', onPointerMove as any);
        window.removeEventListener('mouseleave', onPointerLeave as any);
        window.removeEventListener('blur', onPointerLeave);
      }
    };
  }, [cursorFollow, effectiveColor, particleCount]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, opacity: 0.7 }} />
      {showOrbs && (
        <>
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: '45vw', height: '45vw', background: `radial-gradient(circle, ${effectiveColor}20 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(70px)', animation: 'aurora-shift 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '40%', right: '0%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(90px)', animation: 'aurora-shift-2 22s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-5%', left: '20%', width: '35vw', height: '35vw', background: `radial-gradient(circle, ${effectiveColor}12 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(75px)', animation: 'aurora-shift-3 26s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '20%', right: '30%', width: '25vw', height: '25vw', background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', animation: 'aurora-shift 24s ease-in-out infinite reverse' }} />
        </>
      )}
    </div>
  );
};
