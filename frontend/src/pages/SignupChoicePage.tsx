import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { MotionBackdrop } from '../components/MotionBackdrop';

const BG = 'var(--public-page-bg)'; const TEXT = 'var(--public-text-main)'; const DIM = 'var(--public-text-muted)';

export default function SignupChoicePage() {
  const navigate = useNavigate();
  const choices = [
    {
      icon: Building2, title: 'Create a New School', desc: 'Onboard your institution onto the platform. Set up classes, staff, and get approved by the platform admin.',
      path: '/onboarding', accent: '#22d3ee', glow: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.2)',
      bg: 'linear-gradient(135deg, #083344, #0e7490)',
    },
    {
      icon: Users, title: 'Join an Existing School', desc: "Enter your school's invite code to join as a student, teacher, or staff member.",
      path: '/join', accent: '#a78bfa', glow: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.2)',
      bg: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <MotionBackdrop mode="ambient" density={1.02} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 680, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DIM, cursor: 'pointer', marginBottom: 40, fontFamily: 'inherit', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>Get Started</h1>
          <p style={{ color: DIM, fontSize: '1rem' }}>How would you like to use ElevateSmart?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {choices.map((c) => (
            <motion.div
              key={c.path}
              whileHover={{ y: -6, borderColor: c.accent + '55' }}
              onClick={() => navigate(c.path)}
              style={{
                padding: 32, borderRadius: 24, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${c.border}`,
                backdropFilter: 'blur(16px)',
                boxShadow: `0 0 60px ${c.glow}`,
                display: 'flex', flexDirection: 'column', gap: 20,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.icon size={26} color={c.accent} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: TEXT, marginBottom: 10 }}>{c.title}</h3>
                <p style={{ color: DIM, fontSize: '0.85rem', lineHeight: 1.6 }}>{c.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.accent, fontWeight: 700, fontSize: '0.85rem', marginTop: 'auto' }}>
                Get started <ArrowRight size={15} />
              </div>
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: '0.83rem', color: DIM }}>
          Already have an account?{' '}
          <span style={{ color: '#ffb663', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in →</span>
        </p>
      </motion.div>
    </div>
  );
}
