import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PublicAiAssistantChat() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 28,
          background: 'rgba(52, 211, 153, 0.3)',
          filter: 'blur(20px)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          pointerEvents: 'none',
        }} 
        aria-hidden="true" 
      />
      <Link
        to="/assistant"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 22,
          border: '1px solid rgba(110, 231, 183, 0.3)',
          background: 'rgba(2, 6, 23, 0.9)',
          padding: '12px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'white',
          textDecoration: 'none',
          boxShadow: '0 22px 60px rgba(2, 6, 23, 0.45)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          transition: 'all 0.2s ease-out',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'rgba(167, 243, 208, 0.45)';
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.95)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(110, 231, 183, 0.3)';
          e.currentTarget.style.background = 'rgba(2, 6, 23, 0.9)';
        }}
      >
        <span 
          style={{
            display: 'flex',
            height: 40,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            background: '#34d399',
            color: '#020617',
            boxShadow: '0 12px 30px rgba(52, 211, 153, 0.35)',
          }}
        >
          <Bot size={18} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(167, 243, 208, 0.7)' }}>
            AI Assistant
          </span>
          <span style={{ color: '#fff' }}>Ask Aura</span>
        </span>
        <Sparkles size={16} color="rgba(167, 243, 208, 0.8)" />
      </Link>
    </motion.div>
  );
}

export default PublicAiAssistantChat;
