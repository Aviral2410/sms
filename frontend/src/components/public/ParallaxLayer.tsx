import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

interface ParallaxLayerProps {
  children: React.ReactNode;
  offset?: number;
  reverse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ParallaxLayer({
  children,
  offset = 56,
  reverse = false,
  className,
  style,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const travel = reverse ? [offset, -offset] : [-offset, offset];
  const yBase = useTransform(scrollYProgress, [0, 1], travel);
  const y = useSpring(yBase, { stiffness: 70, damping: 22, mass: 0.2 });

  return (
    <motion.div ref={ref} className={className} style={{ ...(style || {}), y } as any}>
      {children}
    </motion.div>
  );
}
