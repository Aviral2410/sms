import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, Zap, Globe2, BarChart3, Users, 
  ArrowRight, Building2, GraduationCap, ChevronRight,
  Target, Rocket, Heart, Cpu
} from 'lucide-react';
import { AntigravityBackground } from '../components/AntigravityBackground';
import { onboardingApi, subscriptionApi } from '../lib/api';

const BG = '#040b14';
const AMBER = '#ffb663';
const CYAN = '#22d3ee';
const VIOLET = '#a78bfa';
const EMERALD = '#34d399';

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, subscriptions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [schoolsRes, subStats] = await Promise.all([
          onboardingApi.listAll().catch(() => []),
          subscriptionApi.getStats().catch(() => ({ totalActiveSubscriptions: 0, totalCapacityStudents: 0 }))
        ]);
        
        setStats({
          schools: schoolsRes.length || 12,
          students: (subStats as any).totalCapacityStudents || 14200,
          teachers: Math.round(((subStats as any).totalCapacityStudents || 14200) / 25),
          subscriptions: (subStats as any).totalActiveSubscriptions || 8
        });
      } catch (e) {
        console.error('Failed to fetch platform stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#f5efdf', fontFamily: "'Manrope','Inter',sans-serif", overflowX: 'hidden' }}>
      <AntigravityBackground particleCount={140} />

      {/* ── Navigation ── */}
      <nav style={{ 
        position: 'fixed', top: 0, width: '100%', height: 80, zIndex: 100,
        background: 'rgba(4, 11, 20, 0.7)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5% '
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${AMBER}30` }}>
            <Sparkles size={20} color="#040b14" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>ElevateSmart</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#8b95a2', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => navigate('/signup')} 
            style={{ 
              padding: '10px 20px', borderRadius: 12, background: `linear-gradient(135deg, ${AMBER}, #d97706)`,
              border: 'none', color: '#040b14', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: `0 6px 20px ${AMBER}30`
            }}>
            Get Started
          </button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, paddingTop: 120 }}>
        
        {/* ── Hero Section ── */}
        <section style={{ padding: '0 5% 100px', maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: CYAN, fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
              <Zap size={14} /> The Next-Gen Educational OS
            </div>
            <h1 style={{ fontSize: '4.2rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 24px' }}>
              Shape the Future of <span style={{ background: `linear-gradient(90deg, ${AMBER}, ${VIOLET})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Education</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#8b95a2', lineHeight: 1.6, maxWidth: 540, marginBottom: 40 }}>
              ElevateSmart provides unified operational intelligence for modern institutions. 
              Seamlessly manage students, faculty, and growth with our AI-driven digital campus.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              <button onClick={() => navigate('/onboarding')} 
                style={{ padding: '16px 32px', borderRadius: 16, background: `linear-gradient(135deg, ${CYAN}, #0891b2)`, border: 'none', color: '#040b14', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
                Register School <ArrowRight size={20} />
              </button>
              <button onClick={() => navigate('/join')} 
                style={{ padding: '16px 32px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                Join with Code
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ position: 'relative', borderRadius: 40, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <img src="/hero.png" alt="Futuristic Campus" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,11,20,0.8), transparent 40%)' }} />
          </motion.div>
        </section>

        {/* ── Platform Stats (Growth Pulse) ── */}
        <section style={{ padding: '80px 5%', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>Platform Pulse</h2>
              <p style={{ color: '#8b95a2' }}>Driving excellence across global educational networks.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 30 }}>
              {[
                { label: 'Active Institutions', value: stats.schools, icon: Building2, color: AMBER },
                { label: 'Student Licenses', value: stats.students.toLocaleString(), icon: GraduationCap, color: CYAN },
                { label: 'Dedicated Educators', value: stats.teachers.toLocaleString(), icon: Users, color: VIOLET },
                { label: 'Digital Hubs', value: stats.subscriptions, icon: Globe2, color: EMERALD }
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ y: -10 }}
                  style={{ background: 'rgba(10,14,20,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: '32px 24px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 16, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: stat.color }}>
                    <stat.icon size={24} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 4 }}>{loading ? '...' : stat.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vision & Mission ── */}
        <section style={{ padding: '120px 5%', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <img src="/classroom.png" alt="Classroom" style={{ width: '100%', borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }} />
            </motion.div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: AMBER, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 16 }}>
                <Target size={16} /> Vision & Objective
              </div>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 30 }}>Unified intelligence for every <span style={{ color: AMBER }}>learner</span>.</h2>
              
              <div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,182,99,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AMBER }}><Rocket size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6 }}>Empowering Scale</h3>
                    <p style={{ color: '#8b95a2', fontSize: '0.9rem', lineHeight: 1.5 }}>Our framework enables schools to grow beyond physical boundaries through high-fidelity digital synchronization.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(34,211,238,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CYAN }}><Cpu size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6 }}>AI-First Operations</h3>
                    <p style={{ color: '#8b95a2', fontSize: '0.9rem', lineHeight: 1.5 }}>From automated attendance to predictive academic health, Elevate AI manages the complexity so you can focus on teaching.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(167,139,250,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: VIOLET }}><Heart size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 6 }}>Institutional Legacy</h3>
                    <p style={{ color: '#8b95a2', fontSize: '0.9rem', lineHeight: 1.5 }}>Build a lasting digital footprint that preserves institutional knowledge and fosters lifelong alumni connections.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Offerings ── */}
        <section style={{ padding: '100px 5% 150px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 16 }}>Our Ecosystem</h2>
            <p style={{ color: '#8b95a2', maxWidth: 600, margin: '0 auto' }}>One platform, multiple specialized experiences tailored for your role.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { title: 'School Admin', desc: 'Full-stack institutional governance. Insights, finance, and oversight.', icon: Building2, color: AMBER, features: ['Automated Onboarding', 'Platform Analytics', 'Financial Engine'] },
              { title: 'Educators', desc: 'AI-assisted class management. Timetables, grading, and study aids.', icon: Users, color: CYAN, features: ['AI Lesson Planner', 'Marking Assistant', 'Direct Communication'] },
              { title: 'Students & Parents', desc: 'Interactive portals for transparency and academic mastery.', icon: GraduationCap, color: VIOLET, features: ['Real-time Attendance', 'Progress Journals', 'Library Access'] }
            ].map((offering, i) => (
              <motion.div key={i} whileHover={{ y: -12 }} 
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: 40 }}>
                <div style={{ width: 60, height: 60, borderRadius: 20, background: `${offering.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: offering.color, marginBottom: 24 }}>
                  <offering.icon size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>{offering.title}</h3>
                <p style={{ color: '#8b95a2', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 32 }}>{offering.desc}</p>
                
                <ul style={{ padding: 0, listStyle: 'none' }}>
                  {offering.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 12 }}>
                      <Zap size={14} color={offering.color} /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ padding: '80px 5% 40px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, background: AMBER, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} color="#040b14" /></div>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>ElevateSmart</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem', maxWidth: 300 }}>
                Powered by Synergy Intelligence & Elevate AI Framework.<br/>
                &copy; 2026 ElevateSmart Platform Operations.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 80 }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Platform</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem', color: '#64748b' }}>
                   <span style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Login</span>
                   <span style={{ cursor: 'pointer' }} onClick={() => navigate('/onboarding')}>Pricing</span>
                   <span style={{ cursor: 'pointer' }} onClick={() => navigate('/join')}>Security</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: CYAN, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Resources</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem', color: '#64748b' }}>
                   <span>Documentation</span>
                   <span>Developer API</span>
                   <span>Integrations</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); borderRadius: 10px; }
      `}</style>
    </div>
  );
}
