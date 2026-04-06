import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'base' | 'interactive' | 'accent' | 'error';
  animate?: boolean;
}

const GlassCard = ({ children, className = '', variant = 'base', animate = true }: GlassCardProps) => {
  const variantStyles = {
    base: '',
    interactive: 'cursor-pointer hover:border-accent-primary/40',
    accent: 'border-accent-primary/20 bg-accent-primary/5',
    error: 'border-accent-error/20 bg-accent-error/5',
  };

  return (
    <div 
      className={`glass-panel p-6 ${variantStyles[variant]} ${animate ? 'animate-in' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
