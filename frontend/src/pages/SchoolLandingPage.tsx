import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, GraduationCap, Users, Calendar, 
  Mail, Award, Camera, 
  ArrowRight, ShieldCheck, 
  Sparkles, Lock, Hash, AlertCircle, Loader,
  Target, Palmtree, Trophy, BookOpen, Music
} from 'lucide-react';
import { AntigravityBackground } from '../components/AntigravityBackground';
import { getSchoolContext } from '../lib/subdomain';
import { schoolOpsApi, authApi, PublicSchoolProfileResponse } from '../lib/api';
import { useStore } from '../store/useStore';

const BG = '#040b14';
const BORDER = 'rgba(255,255,255,0.08)';
const AMBER = '#ffb663'; const CYAN = '#22d3ee'; const VIOLET = '#a78bfa';
const TEXT = '#f5efdf'; const DIM = '#8b95a2';

// Mapping icons by name
const IconMap: Record<string, React.ElementType> = {
  Sparkles, Palmtree, GraduationCap, ShieldCheck, Trophy, BookOpen, Music, Target, Users, Calendar, Award
};

const HouseCard = ({ name, color, motto, icon }: { name: string; color: string; motto: string; icon: string }) => {
  const Icon = IconMap[icon] || ShieldCheck;
  return (
    <motion.div whileHover={{ y: -8 }} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}30`, borderRadius: 24, padding: 24, textAlign: 'center' }}>
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
  const [events, setEvents] = useState<any[]>([]);
  
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
        if (data.onboardingId) {
           try {
             const eventData = await schoolOpsApi.getPublicEvents(data.onboardingId);
             setEvents(eventData || []);
           } catch (err) {
             console.warn('Failed to fetch events, using defaults');
             setEvents([
               { title: 'Academic Session 2026', date: 'Ongoing', type: 'ACADEMIC', img: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=400' }
             ]);
           }
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
      setSession({ userId: res.userId, role: res.role, email: res.email, fullName: res.fullName, schoolId: res.schoolId, tenantId: res.tenantId, token: res.token });
      navigate('/dashboard');
    } catch (err: any) { setError(err.message || 'Login failed.'); }
    finally { setAuthLoading(false); }
  };

  if (loading) return (
    <div style={{ height: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AMBER }}>
       <Loader size={40} className="animate-spin" />
    </div>
  );

  if (!profile && !loading) {
    return (
      <div style={{ height: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TEXT, gap: 20 }}>
         <AlertCircle size={48} color="#ef4444" />
         <h2 style={{ fontWeight: 900 }}>Institution Not Found</h2>
         <button onClick={() => navigate('/')} style={{ color: AMBER, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Return to Platform</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Manrope','Inter',sans-serif" }}>
      <AntigravityBackground particleCount={80} />

      {/* ── Navigation ── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', height: 74, zIndex: 100, background: 'rgba(4,11,20,0.7)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} color="#040b14" /></div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>{profile?.schoolName}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{profile?.city}, {profile?.state}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'none', border: 'none', color: DIM, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Vision</button>
          <button onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff', padding: '8px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Portal Access</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Hero ── */}
        <section style={{ height: '80vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 6%' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
            <img src="/school_facade.png" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} alt="Campus" />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${BG} 0%, transparent 40%, transparent 60%, ${BG} 100%)` }} />
          </div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: `${AMBER}15`, border: `1px solid ${AMBER}30`, color: AMBER, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 24 }}>
              <Award size={14} /> National Standard Excellence
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 24px' }}>Welcome to <br/><span style={{ color: AMBER }}>{profile?.schoolName}</span></h1>
            <p style={{ fontSize: '1.2rem', color: DIM, maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6 }}>{profile?.vision}</p>
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '16px 36px', borderRadius: 16, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, border: 'none', color: '#040b14', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: `0 10px 30px ${AMBER}25` }}>Explore Institution</button>
          </motion.div>
        </section>

        {/* ── Vision/Mission ── */}
        <section id="about" style={{ padding: '100px 6%', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40 }}>
           <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 32, padding: 40 }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}><Sparkles color={AMBER} /> Our Vision</h3>
              <p style={{ color: DIM, lineHeight: 1.7, fontSize: '1.05rem' }}>{profile?.vision}</p>
           </div>
           <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 32, padding: 40 }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}><Target color={CYAN} /> Our Mission</h3>
              <p style={{ color: DIM, lineHeight: 1.7, fontSize: '1.05rem' }}>{profile?.mission}</p>
           </div>
        </section>

        {/* ── Achievements (Dynamic) ── */}
        <section style={{ padding: '60px 6%', maxWidth: 1200, margin: '0 auto' }}>
           <div style={{ textAlign: 'center', marginBottom: 50 }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12 }}>Institutional Achievements</h2>
             <p style={{ color: DIM }}>Milestones that define our legacy of excellence.</p>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
             {profile?.achievements.map((item, idx) => (
               <div key={idx} style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, display: 'flex', gap: 16 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {profile?.houses?.map((house: any) => <HouseCard key={house.name} {...house} />)}
          </div>
        </section>

        {/* ── Events Directory ── */}
        <section style={{ padding: '100px 6%', background: 'rgba(255,182,99,0.02)', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
           <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 50 }}>
                <div>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 8 }}>Recent Updates</h2>
                  <p style={{ color: DIM }}>Snapshot of upcoming activities and school announcements.</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
                {events.length > 0 ? events.map((e, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} style={{ borderRadius: 28, overflow: 'hidden', background: 'rgba(10,14,20,0.6)', border: `1px solid ${BORDER}` }}>
                    <img src={e.img || '/classroom.png'} alt={e.title} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                    <div style={{ padding: 24 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{e.type}</div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{e.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: DIM, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> {e.date}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.01)', border: `1px dashed ${BORDER}`, borderRadius: 20 }}>
                     <p style={{ color: DIM }}>No upcoming events scheduled at this time.</p>
                  </div>
                )}
              </div>
           </div>
        </section>

        {/* ── Login Portal Section ── */}
        <section id="login-portal" style={{ padding: '120px 6%', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: 80, alignItems: 'center' }}>
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

          <div style={{ background: 'linear-gradient(180deg, rgba(16,22,30,0.95), rgba(10,14,19,0.9))', border: `1px solid ${BORDER}`, borderRadius: 36, padding: 48, backdropFilter: 'blur(20px)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
               <div style={{ width: 44, height: 44, background: AMBER, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={20} color="#040b14" /></div>
               <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Portal Login</h3>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: DIM }}>School Context</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                  <input readOnly value={schoolCode ?? ''} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: DIM }}>Academic Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                  <input type="email" placeholder="name@school.com" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: DIM }}>Security Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 44px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>

              {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', fontSize: '0.82rem' }}><AlertCircle size={14} />{error}</div>}

              <button type="submit" disabled={authLoading} style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', borderRadius: 14, background: authLoading ? '#1e293b' : AMBER, border: 'none', color: '#040b14', fontWeight: 900, fontSize: '1.1rem', cursor: authLoading ? 'not-allowed' : 'pointer' }}>
                {authLoading ? <Loader size={20} className="animate-spin" /> : <>Access Dashboard <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ padding: '80px 6% 40px', background: 'rgba(0,0,0,0.5)', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 12 }}>{profile?.schoolName}</h3>
                  <div style={{ color: DIM, fontSize: '0.9rem', maxWidth: 400, lineHeight: 1.6 }}>© 2026 Institutional Rights Reserved. Powered by the ElevateSmart Educational Framework.</div>
               </div>
               <div style={{ display: 'flex', gap: 60 }}>
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
  );
}
