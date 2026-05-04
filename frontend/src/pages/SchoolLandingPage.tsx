import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, GraduationCap, Users, Calendar, 
  Mail, Award, 
  ArrowRight, ShieldCheck, 
  Sparkles, Lock, Hash, AlertCircle, Loader,
  Target, Palmtree, Trophy, BookOpen, Music
} from 'lucide-react';
import { MotionBackdrop } from '../components/MotionBackdrop';
import { ParallaxLayer } from '../components/public/ParallaxLayer';
import { PublicField } from '../components/public/PublicField';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { ScrollReveal } from '../components/public/ScrollReveal';
import { FallbackImage } from '../components/ui/FallbackImage';
import { getSchoolContext } from '../lib/subdomain';
import { schoolOpsApi, authApi, PublicSchoolProfileResponse } from '../lib/api';
import { buildDefaultPublicEventCards, mapAnnouncementToPublicEventCard, type PublicEventCard } from '../lib/publicMedia';
import { useStore } from '../store/useStore';

const BG = 'var(--public-page-bg)';
const PANEL = 'var(--public-panel-bg)';
const PANEL_STRONG = 'var(--public-panel-strong-bg)';
const BORDER = 'var(--public-border)';
const AMBER = '#ffb663'; const CYAN = '#22d3ee'; const VIOLET = '#a78bfa';
const TEXT = 'var(--public-text-main)'; const DIM = 'var(--public-text-muted)';

// Mapping icons by name
const IconMap: Record<string, React.ElementType> = {
  Sparkles, Palmtree, GraduationCap, ShieldCheck, Trophy, BookOpen, Music, Target, Users, Calendar, Award
};

const HouseCard = ({ name, color, motto, icon }: { name: string; color: string; motto: string; icon: string }) => {
  const Icon = IconMap[icon] || ShieldCheck;
  return (
    <motion.div whileHover={{ y: -8 }} style={{ background: PANEL, border: `1px solid ${color}40`, borderRadius: 24, padding: 24, textAlign: 'center', boxShadow: 'var(--public-shadow)' }}>
      <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: color }}>
        <Icon size={24} />
      </div>
      <h4 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 4 }}>{name}</h4>
      <p style={{ fontSize: '0.75rem', color: DIM, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{motto}</p>
    </motion.div>
  );
};

export default function SchoolLandingPage() {
  const navigate = useNavigate();
  const { schoolCode } = getSchoolContext();
  const { setSession } = useStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicSchoolProfileResponse | null>(null);
  const [events, setEvents] = useState<PublicEventCard[]>([]);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!schoolCode) return;
      try {
        setLoading(true);
        // Fetch REAL public profile from backend
        const data = await schoolOpsApi.getPublicProfile(schoolCode);
        setProfile(data);
        
        // Fetch events if we have a school ID
        if (data.schoolId) {
           try {
             const eventData = await schoolOpsApi.getPublicEvents(data.schoolId);
             setEvents((eventData || []).map(mapAnnouncementToPublicEventCard));
           } catch (err) {
             console.warn('Failed to fetch events, using defaults', err);
             setEvents(buildDefaultPublicEventCards(data.schoolName));
           }
        } else {
          setEvents(buildDefaultPublicEventCards(data.schoolName));
        }
      } catch (e) {
        console.error('Failed to load school landing data', e);
        setError('Institution details could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [schoolCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please enter credentials.'); return; }
    setAuthLoading(true); setError('');
    try {
      const res = await authApi.schoolLogin({ schoolCode: schoolCode || '', email, password });
      setSession({
        userId: res.userId,
        role: res.role,
        email: res.email,
        fullName: res.fullName,
        schoolId: res.schoolId,
        schoolCode: res.schoolCode,
        schoolName: res.schoolName,
        tenantId: res.tenantId,
        token: res.token,
      });
      navigate('/dashboard');
    } catch (err: any) { setError(err.message || 'Login failed.'); }
    finally { setAuthLoading(false); }
  };

  if (loading) return (
    <div style={{ height: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AMBER }}>
       <MotionBackdrop mode="hero" density={1.15} showOrbs />
       <Loader size={40} className="animate-spin" />
    </div>
  );

  if (!profile && !loading) {
    return (
      <div style={{ height: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TEXT, gap: 20 }}>
         <MotionBackdrop mode="ambient" density={1.05} showOrbs />
         <AlertCircle size={48} color="#ef4444" />
         <h2 style={{ fontWeight: 900 }}>Institution Not Found</h2>
         <button onClick={() => navigate('/')} style={{ color: AMBER, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Return to Platform</button>
      </div>
    );
  }

  return (
    <PublicPageShell mode="hero" density={1.15} showOrbs>
      <div style={{ minHeight: '100vh', color: TEXT, fontFamily: "'Manrope','Inter',sans-serif" }}>

      {/* ── Navigation ── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', height: 74, zIndex: 100, background: 'color-mix(in srgb, var(--public-panel-bg) 90%, transparent)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} color="#040b14" /></div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>{profile?.schoolName}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{profile?.city}, {profile?.state}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'none', border: 'none', color: DIM, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Vision</button>
          <button onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'var(--public-panel-soft)', border: `1px solid ${BORDER}`, color: TEXT, padding: '8px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Portal Access</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Hero ── */}
        <section style={{ height: '80vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 6%' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
            <ParallaxLayer offset={54}>
              <FallbackImage src="/school_facade.png" fallbackSrc="/hero.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} alt="Campus" />
            </ParallaxLayer>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${BG} 0%, transparent 40%, transparent 60%, ${BG} 100%)` }} />
          </div>
          
          <ScrollReveal y={22} duration={0.82}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: `${AMBER}15`, border: `1px solid ${AMBER}30`, color: AMBER, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 24 }}>
              <Award size={14} /> National Standard Excellence
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 24px' }}>Welcome to <br/><span style={{ color: AMBER }}>{profile?.schoolName}</span></h1>
            <p style={{ fontSize: '1.2rem', color: DIM, maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6 }}>{profile?.vision}</p>
            <motion.button whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '16px 36px', borderRadius: 16, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, border: 'none', color: '#040b14', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: `0 10px 30px ${AMBER}25` }}>Explore Institution</motion.button>
          </ScrollReveal>
          <motion.div className="public-soft-card parallax-float" style={{ position: 'absolute', right: '7%', bottom: '12%', padding: '16px 18px', textAlign: 'left', minWidth: 220, zIndex: 1 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.84, delay: 0.2 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: AMBER, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>School Code</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>{profile?.schoolCode}</div>
            <div style={{ color: DIM, fontSize: '0.86rem', lineHeight: 1.5 }}>Campus updates, public notices, and portal access stay aligned with this school context.</div>
          </motion.div>
        </section>

        {/* ── Vision/Mission ── */}
        <section id="about" style={{ padding: '100px 6%', maxWidth: 1200, margin: '0 auto' }}>
          <div className="public-grid-2">
           <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 32, padding: 40, boxShadow: 'var(--public-shadow)' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}><Sparkles color={AMBER} /> Our Vision</h3>
              <p style={{ color: DIM, lineHeight: 1.7, fontSize: '1.05rem' }}>{profile?.vision}</p>
           </div>
           <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 32, padding: 40, boxShadow: 'var(--public-shadow)' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}><Target color={CYAN} /> Our Mission</h3>
              <p style={{ color: DIM, lineHeight: 1.7, fontSize: '1.05rem' }}>{profile?.mission}</p>
           </div>
          </div>
        </section>

        {/* ── Achievements (Dynamic) ── */}
        <section style={{ padding: '60px 6%', maxWidth: 1200, margin: '0 auto' }}>
           <div style={{ textAlign: 'center', marginBottom: 50 }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12 }}>Institutional Achievements</h2>
             <p style={{ color: DIM }}>Milestones that define our legacy of excellence.</p>
           </div>
           <div className="public-grid-3">
             {profile?.achievements.map((item, idx) => (
               <div key={idx} style={{ padding: 24, borderRadius: 20, background: PANEL, border: `1px solid ${BORDER}`, display: 'flex', gap: 16, boxShadow: 'var(--public-shadow)' }}>
                 <Trophy color={AMBER} style={{ flexShrink: 0 }} />
                 <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item}</span>
               </div>
             ))}
           </div>
        </section>

        {/* ── Houses (Dynamic) ── */}
        <section style={{ padding: '60px 6% 100px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12 }}>House System</h2>
            <p style={{ color: DIM }}>Fostering teamwork, competition, and leadership through four pillars.</p>
          </div>
          <div className="public-grid-4">
            {profile?.houses?.map((house: any) => <HouseCard key={house.name} {...house} />)}
          </div>
        </section>

        {/* ── Events Directory ── */}
        <section style={{ padding: '100px 6%', background: 'color-mix(in srgb, var(--public-panel-soft) 82%, transparent)', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
           <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 50 }}>
                <div>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8 }}>Recent Updates</h2>
                  <p style={{ color: DIM }}>Snapshot of upcoming activities and school announcements.</p>
                </div>
              </div>
              
              <div className="public-grid-3">
                {events.length > 0 ? events.map((e, i) => (
                  <motion.div key={e.id || i} whileHover={{ scale: 1.02 }} style={{ borderRadius: 28, overflow: 'hidden', background: PANEL_STRONG, border: `1px solid ${BORDER}`, boxShadow: 'var(--public-shadow)' }}>
                    <FallbackImage src={e.imageSrc} fallbackSrc={e.fallbackSrc} alt={e.title} className="public-event-media" />
                    <div style={{ padding: 24 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{e.type}</div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{e.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: DIM, lineHeight: 1.6, marginBottom: 12 }}>{e.summary}</p>
                      <p style={{ fontSize: '0.85rem', color: DIM, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> {e.dateLabel}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, background: 'color-mix(in srgb, var(--public-panel-soft) 82%, transparent)', border: `1px dashed ${BORDER}`, borderRadius: 20 }}>
                     <p style={{ color: DIM }}>No upcoming events scheduled at this time.</p>
                  </div>
                )}
              </div>
           </div>
        </section>

        {/* ── Login Portal Section ── */}
        <section id="login-portal" style={{ padding: '120px 6%', maxWidth: 1200, margin: '0 auto' }}>
          <div className="public-grid-2" style={{ alignItems: 'center', gap: '5rem' }}>
          <div>
            <h2 style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>Institutional <br/><span style={{ color: AMBER }}>Workspace</span></h2>
            <p style={{ fontSize: '1.1rem', color: DIM, lineHeight: 1.6, marginBottom: 40 }}>Log in with your academic credentials to access your personalized dashboard, timetables, and resource hub.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
               <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                 <div style={{ width: 44, height: 44, borderRadius: 12, background: `${CYAN}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CYAN }}><ShieldCheck /></div>
                 <div style={{ fontWeight: 800 }}>End-to-End Encryption</div>
               </div>
               <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                 <div style={{ width: 44, height: 44, borderRadius: 12, background: `${VIOLET}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: VIOLET }}><Users /></div>
                 <div style={{ fontWeight: 800 }}>Seamless Collaboration</div>
               </div>
            </div>
          </div>

          <div style={{ background: PANEL_STRONG, border: `1px solid ${BORDER}`, borderRadius: 36, padding: 48, backdropFilter: 'blur(20px)', boxShadow: 'var(--public-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
               <div style={{ width: 44, height: 44, background: AMBER, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={20} color="#040b14" /></div>
               <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Portal Login</h3>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PublicField label="School Context" icon={Hash} readOnly value={schoolCode ?? ''} accent={AMBER} />

              <PublicField label="Academic Email" icon={Mail} type="email" placeholder="name@school.com" value={email} onChange={e => setEmail(e.target.value)} accent={CYAN} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: DIM }}>Security Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                  <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 44px', background: 'var(--public-input-bg)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', fontSize: '0.82rem' }}><AlertCircle size={14} />{error}</div>}

              <button type="submit" disabled={authLoading} style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 14, background: authLoading ? '#1e293b' : AMBER, border: 'none', color: '#040b14', fontWeight: 900, fontSize: '1.1rem', cursor: authLoading ? 'not-allowed' : 'pointer' }}>
                {authLoading ? <Loader size={20} className="animate-spin" /> : <>Access Dashboard <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ padding: '80px 6% 40px', background: 'color-mix(in srgb, var(--public-panel-bg) 84%, transparent)', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
               <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 12 }}>{profile?.schoolName}</h3>
                  <div style={{ color: DIM, fontSize: '0.9rem', maxWidth: 400, lineHeight: 1.6 }}>&copy; 2026 Institutional Rights Reserved. Powered by the ElevateSmart Educational Framework.</div>
               </div>
               <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: AMBER, textTransform: 'uppercase', marginBottom: 20 }}>Quick Links</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: DIM, fontSize: '0.9rem' }}>
                      <span>Academics</span>
                      <span>Admissions</span>
                      <span>Public Records</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: CYAN, textTransform: 'uppercase', marginBottom: 20 }}>Support</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: DIM, fontSize: '0.9rem' }}>
                      <span>Help Desk</span>
                      <span>Privacy Policy</span>
                      <span>Contact Us</span>
                    </div>
                  </div>
               </div>
            </div>
        </footer>
      </main>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
      </div>
    </PublicPageShell>
  );
}
