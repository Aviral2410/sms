import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

interface AntigravityBackgroundProps {
  particleCount?: number;
  showOrbs?: boolean;
  baseColor?: string;
}

export const AntigravityBackground: React.FC<AntigravityBackgroundProps> = ({ 
  particleCount = 100, 
  showOrbs = true,
  baseColor 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accentColor } = useStore();
  const effectiveColor = baseColor || accentColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string; };
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
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const fill = p.color.startsWith('#') ? p.color : `${p.color}${p.alpha})`;
        ctx.fillStyle = fill;
        ctx.fill();
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
    };
  }, [effectiveColor, particleCount]);

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
