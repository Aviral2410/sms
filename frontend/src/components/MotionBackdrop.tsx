import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export type MotionBackdropMode = 'hero' | 'ambient' | 'minimal';

interface MotionBackdropProps {
  mode?: MotionBackdropMode;
  baseColor?: string;
  cursorFollow?: boolean;
  showOrbs?: boolean;
  textStream?: boolean;
  flareTrail?: boolean;
  density?: number;
}

type StreamParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  anchorX: number;
  anchorY: number;
  anchorVx: number;
  anchorVy: number;
  text: string;
  size: number;
  alpha: number;
  rotation: number;
  angularVelocity: number;
  laneOffset: number;
};

type FlareParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  anchorX: number;
  anchorY: number;
  anchorVx: number;
  anchorVy: number;
  radius: number;
  alpha: number;
  tint: string;
};

type StarParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  anchorX: number;
  anchorY: number;
  anchorVx: number;
  anchorVy: number;
  radius: number;
  alpha: number;
  twinkleOffset: number;
  twinkleSpeed: number;
  tint: string;
};

type MotionPreset = {
  streamCount: number;
  flareCount: number;
  starCount: number;
  connectorDistance: number;
  streamSpeed: number;
  flareSpeed: number;
  starSpeed: number;
  windStrength: number;
  cursorAttraction: number;
  cursorRepulsion: number;
  textOpacity: number;
  lineOpacity: number;
};

const MOTION_PRESETS: Record<MotionBackdropMode, MotionPreset> = {
  hero: {
    streamCount: 38,
    flareCount: 30,
    starCount: 58,
    connectorDistance: 150,
    streamSpeed: 0.52,
    flareSpeed: 0.74,
    starSpeed: 0.18,
    windStrength: 0.014,
    cursorAttraction: 0.00004,
    cursorRepulsion: 0.0013,
    textOpacity: 0.9,
    lineOpacity: 0.18,
  },
  ambient: {
    streamCount: 26,
    flareCount: 20,
    starCount: 38,
    connectorDistance: 110,
    streamSpeed: 0.38,
    flareSpeed: 0.52,
    starSpeed: 0.14,
    windStrength: 0.009,
    cursorAttraction: 0.000025,
    cursorRepulsion: 0.00095,
    textOpacity: 0.72,
    lineOpacity: 0.1,
  },
  minimal: {
    streamCount: 16,
    flareCount: 12,
    starCount: 22,
    connectorDistance: 72,
    streamSpeed: 0.22,
    flareSpeed: 0.34,
    starSpeed: 0.1,
    windStrength: 0.004,
    cursorAttraction: 0.000012,
    cursorRepulsion: 0.0006,
    textOpacity: 0.42,
    lineOpacity: 0.04,
  },
};

const TEXT_STREAM_TOKENS = [
  'learn',
  'focus',
  'curiosity',
  'attendance',
  'future',
  'clarity',
  'campus',
  'insight',
  'mentor',
  'growth',
  'progress',
  'spark',
  'sync',
  'flow',
  '->',
  '=>',
  'delta',
  'lambda',
  'sigma',
  'pi',
  'f(x)',
  'sin x',
  'cos t',
  'E = mc^2',
  'a^2+b^2',
  'H2O',
  'CO2',
  'DNA',
  'RNA',
  'atom',
  'orbit',
  'vector',
  'matrix',
  'x^2',
  'y = mx+c',
  'pi',
  'Sigma',
  'Delta',
  'lambda',
  'mu',
  'theta',
  'Omega',
  'integral',
  'sqrt',
  'infinity',
  'sum',
  '∑',
  '∫',
  '∞',
  '∂',
  '∇',
  '∴',
  '≈',
  '≠',
  '≤',
  '≥',
  '→',
  '⇌',
  '⊕',
  '⊗',
  '⟂',
  'πr²',
  'dx/dt',
  'lim x→∞',
  '∫f(x)dx',
  'NaCl',
  'C6H12O6',
  'E=hf',
  'F=ma',
  'Δv',
  'θ',
  'φ',
  'ψ',
  'Ω',
  'μ',
  'α',
  'β',
  'γ',
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveThemeTone(theme: string): 'light' | 'dark' {
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function alphaHex(alpha: number) {
  return clamp(Math.round(alpha * 255), 0, 255).toString(16).padStart(2, '0');
}

function wrapCoordinate(value: number, max: number, padding: number) {
  if (value < -padding) return max + padding;
  if (value > max + padding) return -padding;
  return value;
}

function createColorPalette(accent: string, tone: 'light' | 'dark') {
  return tone === 'light'
    ? {
        accent,
        text: 'rgba(15, 23, 42, ',
        textSoft: 'rgba(51, 65, 85, ',
        flareA: `${accent}${alphaHex(0.22)}`,
        flareB: 'rgba(14, 165, 233, 0.16)',
        flareC: 'rgba(99, 102, 241, 0.12)',
        line: `${accent}${alphaHex(0.12)}`,
      }
    : {
        accent,
        text: 'rgba(241, 245, 249, ',
        textSoft: 'rgba(148, 163, 184, ',
        flareA: `${accent}${alphaHex(0.28)}`,
        flareB: 'rgba(34, 211, 238, 0.18)',
        flareC: 'rgba(167, 139, 250, 0.16)',
        line: `${accent}${alphaHex(0.18)}`,
      };
}

export const MotionBackdrop: React.FC<MotionBackdropProps> = ({
  mode = 'ambient',
  baseColor,
  cursorFollow = true,
  showOrbs = false,
  textStream = true,
  flareTrail = true,
  density = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { accentColor, theme } = useStore();
  const effectiveColor = baseColor || accentColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tone = resolveThemeTone(theme);
    const preset = MOTION_PRESETS[mode];
    const densityScale = clamp(density, 0.55, 2.2);
    const motionScale = reduceMotion ? 0.48 : 1;
    const palette = createColorPalette(effectiveColor, tone);

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      dx: 0,
      dy: 0,
      active: false,
    };

    let lastPointerX = pointer.x;
    let lastPointerY = pointer.y;

    const streamParticles: StreamParticle[] = Array.from(
      { length: textStream ? Math.max(4, Math.round(preset.streamCount * densityScale * motionScale)) : 0 },
      () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * preset.streamSpeed,
        vy: (Math.random() - 0.5) * preset.streamSpeed,
        anchorX: Math.random() * window.innerWidth,
        anchorY: Math.random() * window.innerHeight,
        anchorVx: (Math.random() - 0.5) * (preset.streamSpeed * 0.18 + 0.06),
        anchorVy: (Math.random() - 0.5) * (preset.streamSpeed * 0.18 + 0.06),
        text: TEXT_STREAM_TOKENS[Math.floor(Math.random() * TEXT_STREAM_TOKENS.length)],
        size: 11 + Math.random() * (mode === 'hero' ? 10 : 6),
        alpha: clamp(Math.random() * preset.textOpacity, 0.12, preset.textOpacity),
        rotation: (Math.random() - 0.5) * 0.5,
        angularVelocity: (Math.random() - 0.5) * 0.012,
        laneOffset: (Math.random() - 0.5) * 12,
      }),
    );

    const flareParticles: FlareParticle[] = Array.from(
      { length: flareTrail ? Math.max(3, Math.round(preset.flareCount * densityScale * motionScale)) : 0 },
      (_, index) => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * preset.flareSpeed,
        vy: (Math.random() - 0.5) * preset.flareSpeed,
        anchorX: Math.random() * window.innerWidth,
        anchorY: Math.random() * window.innerHeight,
        anchorVx: (Math.random() - 0.5) * (preset.flareSpeed * 0.14 + 0.05),
        anchorVy: (Math.random() - 0.5) * (preset.flareSpeed * 0.14 + 0.05),
        radius: (mode === 'hero' ? 24 : 14) + Math.random() * (mode === 'hero' ? 34 : 18),
        alpha: clamp(0.08 + Math.random() * 0.18, 0.06, 0.28),
        tint: index % 3 === 0 ? palette.flareA : index % 3 === 1 ? palette.flareB : palette.flareC,
      }),
    );

    const starParticles: StarParticle[] = Array.from(
      { length: Math.max(6, Math.round(preset.starCount * densityScale * motionScale)) },
      (_, index) => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * preset.starSpeed,
        vy: (Math.random() - 0.5) * preset.starSpeed,
        anchorX: Math.random() * window.innerWidth,
        anchorY: Math.random() * window.innerHeight,
        anchorVx: (Math.random() - 0.5) * (preset.starSpeed * 0.42 + 0.04),
        anchorVy: (Math.random() - 0.5) * (preset.starSpeed * 0.42 + 0.04),
        radius: 0.7 + Math.random() * (mode === 'hero' ? 1.9 : 1.3),
        alpha: clamp(0.25 + Math.random() * 0.55, 0.18, 0.92),
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 1.8,
        tint: index % 4 === 0 ? `${palette.accent}${alphaHex(0.84)}` : index % 3 === 0 ? '#f8fafc' : '#dbeafe',
      }),
    );

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.dx = event.clientX - lastPointerX;
      pointer.dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.dx *= 0.3;
      pointer.dy *= 0.3;
    };

    const wrapParticle = (particle: { x: number; y: number }, padding = 120) => {
      particle.x = wrapCoordinate(particle.x, window.innerWidth, padding);
      particle.y = wrapCoordinate(particle.y, window.innerHeight, padding);
    };

    const advanceAnchor = (
      particle: { anchorX: number; anchorY: number; anchorVx: number; anchorVy: number },
      padding: number,
    ) => {
      particle.anchorX = wrapCoordinate(particle.anchorX + particle.anchorVx, window.innerWidth, padding);
      particle.anchorY = wrapCoordinate(particle.anchorY + particle.anchorVy, window.innerHeight, padding);
    };

    const applyPointerInfluence = (vx: number, vy: number, x: number, y: number, multiplier: number) => {
      if (!cursorFollow || !pointer.active || reduceMotion) return { vx, vy };
      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const distance = Math.sqrt(Math.max(1, dx * dx + dy * dy));
      const distanceSquared = Math.max(1, dx * dx + dy * dy);
      const repulsionRadius = 72 + multiplier * 22;
      const repulsion = distance < repulsionRadius
        ? -preset.cursorRepulsion * Math.pow(1 - distance / repulsionRadius, 2) * multiplier
        : 0;
      const attract = distance > repulsionRadius * 0.72
        ? preset.cursorAttraction * Math.min(1, 22000 / distanceSquared) * multiplier
        : 0;
      return {
        vx: vx + dx * (attract + repulsion) + pointer.dx * preset.windStrength * multiplier,
        vy: vy + dy * (attract + repulsion) + pointer.dy * preset.windStrength * multiplier,
      };
    };

    const applyAmbientCirculation = (
      particle: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        anchorX: number;
        anchorY: number;
      },
      strength: number,
      swirl: number,
    ) => {
      const dx = particle.anchorX - particle.x;
      const dy = particle.anchorY - particle.y;
      return {
        vx: particle.vx + dx * strength - dy * swirl,
        vy: particle.vy + dy * strength + dx * swirl,
      };
    };

    const separateParticles = (
      particles: Array<{ x: number; y: number; vx: number; vy: number }>,
      minimumDistance: number,
      strength: number,
    ) => {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
          if (distance >= minimumDistance) continue;
          const push = (minimumDistance - distance) / minimumDistance * strength;
          const nx = dx / distance;
          const ny = dy / distance;
          particles[i].vx -= nx * push;
          particles[i].vy -= ny * push;
          particles[j].vx += nx * push;
          particles[j].vy += ny * push;
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (cursorFollow) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave, { passive: true });
      window.addEventListener('blur', onPointerLeave);
    }

    const draw = (timestamp: number = performance.now()) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (cursorFollow && pointer.active) {
        pointer.dx *= 0.88;
        pointer.dy *= 0.88;
        if (Math.abs(pointer.dx) < 0.03) pointer.dx = 0;
        if (Math.abs(pointer.dy) < 0.03) pointer.dy = 0;
      }

      separateParticles(streamParticles, mode === 'hero' ? 34 : 28, 0.038);
      separateParticles(flareParticles, mode === 'hero' ? 90 : 64, 0.01);
      separateParticles(starParticles, 16, 0.012);

      flareParticles.forEach((particle) => {
        advanceAnchor(particle, 180);
        const circulated = applyAmbientCirculation(particle, 0.00045, 0.00008);
        const next = applyPointerInfluence(circulated.vx, circulated.vy, particle.x, particle.y, 0.9);
        particle.vx = clamp(next.vx * 0.994, -1.8, 1.8);
        particle.vy = clamp(next.vy * 0.994, -1.8, 1.8);
        particle.x += particle.vx;
        particle.y += particle.vy;
        wrapParticle(particle, 180);

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius,
        );
        gradient.addColorStop(0, particle.tint);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      starParticles.forEach((particle) => {
        advanceAnchor(particle, 120);
        const circulated = applyAmbientCirculation(particle, 0.00085, 0.00014);
        const next = applyPointerInfluence(circulated.vx, circulated.vy, particle.x, particle.y, 0.62);
        particle.vx = clamp(next.vx * 0.996, -0.68, 0.68);
        particle.vy = clamp(next.vy * 0.996, -0.68, 0.68);
        particle.x += particle.vx;
        particle.y += particle.vy;
        wrapParticle(particle, 120);

        const twinkle = 0.55 + Math.sin((timestamp / 1000) * particle.twinkleSpeed + particle.twinkleOffset) * 0.35;
        const tailX = particle.x - particle.vx * 28;
        const tailY = particle.y - particle.vy * 28;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(226, 232, 240, ${clamp(twinkle * particle.alpha * 0.24, 0.08, 0.28)})`;
        ctx.lineWidth = particle.radius * 0.9;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = particle.tint;
        ctx.globalAlpha = clamp(twinkle * particle.alpha, 0.2, 1);
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      streamParticles.forEach((particle) => {
        advanceAnchor(particle, 160);
        const circulated = applyAmbientCirculation(particle, 0.0012, 0.00022);
        const next = applyPointerInfluence(circulated.vx, circulated.vy, particle.x, particle.y, 1.2);
        particle.vx = clamp(next.vx * 0.992, -1.35, 1.35);
        particle.vy = clamp(next.vy * 0.992, -1.35, 1.35);
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.angularVelocity;
        wrapParticle(particle, 160);

        const streamAngle = Math.atan2(particle.vy || 0.001, particle.vx || 0.001);
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(streamAngle + particle.rotation);
        ctx.font = `${particle.size}px "Space Grotesk", "Manrope", "Inter", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `${particle.text.length > 3 ? palette.text : palette.textSoft}${clamp(particle.alpha, 0.14, 0.98)})`;
        ctx.globalAlpha = clamp(particle.alpha + (mode === 'hero' ? 0.06 : 0), 0.16, 0.98);
        ctx.fillText(particle.text, particle.laneOffset, 0);
        ctx.restore();
      });
      ctx.globalAlpha = 1;

      if (!reduceMotion && preset.lineOpacity > 0) {
        for (let i = 0; i < streamParticles.length; i += 1) {
          for (let j = i + 1; j < streamParticles.length; j += 1) {
            const dx = streamParticles[i].x - streamParticles[j].x;
            const dy = streamParticles[i].y - streamParticles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance >= preset.connectorDistance) continue;
            const alpha = clamp((1 - distance / preset.connectorDistance) * preset.lineOpacity, 0, 0.2);
            ctx.beginPath();
            ctx.strokeStyle = `${palette.line.slice(0, 7)}${alphaHex(alpha)}`;
            ctx.lineWidth = mode === 'hero' ? 0.75 : 0.45;
            ctx.moveTo(streamParticles[i].x, streamParticles[i].y);
            ctx.lineTo(streamParticles[j].x, streamParticles[j].y);
            ctx.stroke();
          }
        }
      }

      animId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (cursorFollow) {
        window.removeEventListener('pointermove', onPointerMove as EventListener);
        window.removeEventListener('pointerleave', onPointerLeave as EventListener);
        window.removeEventListener('blur', onPointerLeave);
      }
    };
  }, [baseColor, cursorFollow, density, effectiveColor, flareTrail, mode, textStream, theme]);

  const orbOpacity = mode === 'hero' ? 1 : mode === 'ambient' ? 0.8 : 0.48;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, opacity: mode === 'minimal' ? 0.52 : 0.8 }} />
      {showOrbs && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '4%',
              left: '-2%',
              width: '42vw',
              height: '42vw',
              background: `radial-gradient(circle, ${effectiveColor}${alphaHex(0.16 * orbOpacity)} 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(80px)',
              animation: 'aurora-shift 18s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '38%',
              right: '-4%',
              width: '38vw',
              height: '38vw',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 72%)',
              borderRadius: '50%',
              filter: 'blur(92px)',
              animation: 'aurora-shift-2 22s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-6%',
              left: '18%',
              width: '32vw',
              height: '32vw',
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(84px)',
              animation: 'aurora-shift-3 26s ease-in-out infinite',
            }}
          />
        </>
      )}
    </div>
  );
};
