import React, { useEffect, useRef } from 'react';

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5,
        speed: Math.random() * 0.05,
        opacity: Math.random(),
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw dark background
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y -= star.speed;
        if (star.y < 0) star.y = height;
        star.opacity = Math.sin(Date.now() * 0.001 * star.speed * 100) * 0.5 + 0.5;
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Nebula Accents */}
      <div className="nebula-particle bg-blue-500/10 w-[600px] h-[600px] -top-20 -left-20" />
      <div className="nebula-particle bg-purple-500/10 w-[500px] h-[500px] bottom-20 right-20" style={{ animationDelay: '-5s' }} />
      <div className="nebula-particle bg-indigo-500/5 w-[800px] h-[800px] top-1/3 left-1/3" style={{ animationDelay: '-10s' }} />
    </div>
  );
}
