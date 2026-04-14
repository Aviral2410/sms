import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, GraduationCap, Layers3, MessageSquareText, Route, Wallet } from 'lucide-react';
import type { PublicSiteFeatureCard } from '../../lib/publicSiteApi';

const ICONS = [Layers3, GraduationCap, Wallet, MessageSquareText, Route, Cpu];

interface FeatureConstellationProps {
  readonly features: PublicSiteFeatureCard[];
}

export function FeatureConstellation({ features }: FeatureConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  const nodes = useMemo(() => {
    const safeFeatures = features.slice(0, 6);
    return safeFeatures.map((feature, index) => {
      const angle = ((Math.PI * 2) / Math.max(safeFeatures.length, 1)) * index - Math.PI / 2;
      const radius = index % 2 === 0 ? 0.32 : 0.42;
      return {
        feature,
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
        icon: ICONS[index % ICONS.length],
      };
    });
  }, [features]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let frame = 0;
    let animationFrame = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const { width, height } = rect;
      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(
        width * pointer.x,
        height * pointer.y,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.65,
      );
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
      gradient.addColorStop(0.45, 'rgba(167, 139, 250, 0.1)');
      gradient.addColorStop(1, 'rgba(4, 9, 18, 0.2)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const pulse = Math.sin(frame / 36) * 6;

      context.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      context.lineWidth = 1;

      nodes.forEach((node, index) => {
        const nodeX = node.x * width;
        const nodeY = node.y * height;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(nodeX, nodeY);
        context.stroke();

        const next = nodes[(index + 1) % nodes.length];
        context.beginPath();
        context.moveTo(nodeX, nodeY);
        context.lineTo(next.x * width, next.y * height);
        context.stroke();
      });

      context.beginPath();
      context.fillStyle = 'rgba(255, 182, 99, 0.16)';
      context.arc(centerX, centerY, 26 + pulse * 0.15, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.strokeStyle = 'rgba(255, 182, 99, 0.6)';
      context.lineWidth = 1.5;
      context.arc(centerX, centerY, 42 + pulse * 0.35, 0, Math.PI * 2);
      context.stroke();

      nodes.forEach((node, index) => {
        const nodeX = node.x * width;
        const nodeY = node.y * height;
        const active = index === hoveredIndex;
        context.beginPath();
        context.fillStyle = active ? node.feature.accentColor : 'rgba(226, 232, 240, 0.72)';
        context.arc(nodeX, nodeY, active ? 11 : 8, 0, Math.PI * 2);
        context.fill();

        if (active) {
          context.beginPath();
          context.strokeStyle = `${node.feature.accentColor}66`;
          context.lineWidth = 10;
          context.arc(nodeX, nodeY, 20 + pulse * 0.2, 0, Math.PI * 2);
          context.stroke();
        }
      });

      frame += 1;
      animationFrame = window.requestAnimationFrame(draw);
    };

    draw();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [hoveredIndex, nodes, pointer]);

  if (!nodes.length) return null;
  const activeNode = nodes[hoveredIndex] ?? nodes[0];
  const ActiveIcon = activeNode.icon;

  return (
    <div className="public-constellation">
      <div
        className="public-constellation__canvas-wrap"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPointer({
            x: (event.clientX - rect.left) / rect.width,
            y: (event.clientY - rect.top) / rect.height,
          });
        }}
      >
        <canvas ref={canvasRef} className="public-constellation__canvas" />
        <div className="public-constellation__center-card">
          <div className="public-status-chip">Feature constellation</div>
          <h3>Connected capabilities, not isolated modules</h3>
          <p>Hover each lane to see how product surfaces reinforce each other instead of creating admin drift.</p>
        </div>
        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <motion.button
              key={node.feature.title}
              type="button"
              className={`public-constellation__node${index === hoveredIndex ? ' is-active' : ''}`}
              style={{
                left: `${node.x * 100}%`,
                top: `${node.y * 100}%`,
                ['--feature-accent' as any]: node.feature.accentColor,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              whileHover={{ scale: 1.06, y: -4 }}
            >
              <Icon size={18} />
              <span>{node.feature.category}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        key={activeNode.feature.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="public-constellation__detail"
      >
        <div className="public-status-chip" style={{ borderColor: `${activeNode.feature.accentColor}55`, color: activeNode.feature.accentColor }}>
          {activeNode.feature.category}
        </div>
        <div className="public-constellation__detail-header">
          <ActiveIcon size={24} color={activeNode.feature.accentColor} />
          <h3>{activeNode.feature.title}</h3>
        </div>
        <p>{activeNode.feature.description}</p>
        <ul>
          {activeNode.feature.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
