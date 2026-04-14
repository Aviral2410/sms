import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { BrainCircuit, Building2, Orbit, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

const FLOATING_CARDS = [
  {
    title: 'Admissions Pulse',
    subtitle: 'Live enrollment intelligence',
    accent: '#22d3ee',
    icon: Building2,
    position: { top: '10%', left: '8%' },
    depth: 86,
    delay: 0,
  },
  {
    title: 'AI Operations',
    subtitle: 'Automation + insight loop',
    accent: '#a78bfa',
    icon: BrainCircuit,
    position: { top: '18%', right: '7%' },
    depth: 130,
    delay: 0.35,
  },
  {
    title: 'Guardian Layer',
    subtitle: 'Secure school routing',
    accent: '#34d399',
    icon: ShieldCheck,
    position: { bottom: '12%', left: '12%' },
    depth: 94,
    delay: 0.2,
  },
  {
    title: 'Unified Campus',
    subtitle: 'Faculty, students, finance',
    accent: '#ffb663',
    icon: Workflow,
    position: { bottom: '16%', right: '9%' },
    depth: 118,
    delay: 0.45,
  },
];

export function InteractiveHero3D() {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateYBase = useTransform(pointerX, [-0.5, 0.5], [-14, 14]);
  const rotateXBase = useTransform(pointerY, [-0.5, 0.5], [14, -14]);
  const rotateY = useSpring(rotateYBase, { stiffness: 160, damping: 22, mass: 0.5 });
  const rotateX = useSpring(rotateXBase, { stiffness: 160, damping: 22, mass: 0.5 });
  const translateX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 20 });
  const translateY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 20 });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = (event.clientX - rect.left) / rect.width - 0.5;
    const nextY = (event.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(nextX);
    pointerY.set(nextY);
  };

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div className="interactive-depth-stage">
      <motion.div
        className="interactive-depth-shell"
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY, x: translateX, y: translateY }}
      >
        <div className="interactive-depth-grid" />
        <div className="interactive-depth-ring interactive-depth-ring--outer" />
        <div className="interactive-depth-ring interactive-depth-ring--inner" />

        <motion.div
          className="interactive-depth-core"
          style={{ transform: 'translateZ(120px)' }}
          animate={{ y: [0, -8, 0], rotateZ: [0, 1.4, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="interactive-depth-core__icon">
            <Orbit size={22} />
          </div>
          <div className="interactive-depth-core__eyebrow">Operational Intelligence</div>
          <div className="interactive-depth-core__title">Digital Campus Engine</div>
          <div className="interactive-depth-core__meta">
            <span><Sparkles size={14} /> Motion-aware UI</span>
            <span><BrainCircuit size={14} /> AI-ready workflows</span>
          </div>
        </motion.div>

        {FLOATING_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              className="interactive-depth-card"
              style={{
                ...card.position,
                ['--depth' as any]: `${card.depth}px`,
                ['--accent' as any]: card.accent,
              }}
              animate={{ y: [0, -12, 0], rotateZ: [0, 0.8, 0] }}
              transition={{ duration: 7 + card.delay * 3, delay: card.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="interactive-depth-card__icon">
                <Icon size={18} />
              </div>
              <div className="interactive-depth-card__title">{card.title}</div>
              <div className="interactive-depth-card__subtitle">{card.subtitle}</div>
            </motion.div>
          );
        })}

        <motion.div
          className="interactive-depth-beacon"
          style={{ transform: 'translateZ(72px)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
