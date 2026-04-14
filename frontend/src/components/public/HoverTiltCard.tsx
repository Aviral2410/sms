import React, { useMemo, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HoverTiltCardProps {
  readonly children: React.ReactNode;
  readonly accentColor?: string;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly maxTilt?: number;
  readonly as?: 'div' | 'article' | 'section';
}

export function HoverTiltCard({
  children,
  accentColor = '#22d3ee',
  className,
  style,
  maxTilt = 10,
  as = 'div',
}: HoverTiltCardProps) {
  const [hovered, setHovered] = useState(false);
  const rotateXBase = useMotionValue(0);
  const rotateYBase = useMotionValue(0);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);

  const rotateX = useSpring(rotateXBase, { stiffness: 180, damping: 18, mass: 0.4 });
  const rotateY = useSpring(rotateYBase, { stiffness: 180, damping: 18, mass: 0.4 });
  const shadowLift = useTransform(rotateX, [-maxTilt, 0, maxTilt], [0.96, 1, 1.05]);
  const spotlight = useMotionTemplate`radial-gradient(circle at ${pointerX}% ${pointerY}%, ${accentColor}33 0%, transparent 54%)`;
  const Component = useMemo(() => {
    if (as === 'article') return motion.article;
    if (as === 'section') return motion.section;
    return motion.div;
  }, [as]);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    pointerX.set(x);
    pointerY.set(y);

    const tiltY = ((x - 50) / 50) * maxTilt;
    const tiltX = -((y - 50) / 50) * maxTilt;
    rotateXBase.set(tiltX);
    rotateYBase.set(tiltY);
  };

  const reset = () => {
    rotateXBase.set(0);
    rotateYBase.set(0);
    pointerX.set(50);
    pointerY.set(50);
    setHovered(false);
  };

  return (
    <Component
      className={className}
      style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
        scale: shadowLift,
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={reset}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: spotlight,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 180ms ease',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', transform: 'translateZ(24px)' }}>{children}</div>
    </Component>
  );
}
