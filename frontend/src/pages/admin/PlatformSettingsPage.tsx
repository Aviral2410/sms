import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { platformConfigApi, PlatformConfigResponse, platformSettingsApi, PlatformSettingsResponse } from '../../lib/api';
import { PublicSiteStudio } from '../../components/admin/PublicSiteStudio';
import { useStore } from '../../store/useStore';
import { 
  Palette, Shield, Clock, Globe, Save, Loader, CheckCircle, 
  AlertCircle, Server, Zap, Cpu, Layout, Settings2, 
  ChevronRight, RefreshCw, Layers
} from 'lucide-react';

const THEMES = [
  { id: 'indigo-flow', name: 'Indigo Flow', accent: '#6366f1', glass: 0.4, radius: '24px' },
  { id: 'emerald-pulse', name: 'Emerald Pulse', accent: '#10b981', glass: 0.6, radius: '32px' },
  { id: 'rose-ember', name: 'Rose Ember', accent: '#f43f5e', glass: 0.3, radius: '16px' },
  { id: 'amber-glow', name: 'Amber Glow', accent: '#f59e0b', glass: 0.5, radius: '40px' },
  { id: 'cyan-neon', name: 'Cyan Neon', accent: '#06b6d4', glass: 0.8, radius: '12px' },
];

const AVAILABLE_FEATURES = [
  { id: 'SCHOOL_OPS', label: 'School Operations', desc: 'Core student/staff management and dashboards' },
  { id: 'ATTENDANCE', label: 'Attendance Hub', desc: 'Real-time student & staff attendance tracking' },
  { id: 'TRANSPORT_BASE', label: 'Transport Hub', desc: 'Fleet management and route optimization' },
  { id: 'EXAMS', label: 'Examinations', icon: Shield, desc: 'Grading, results, and exam scheduling' },
  { id: 'FINANCE', label: 'Finance & Billing', desc: 'Fee collection, invoicing, and reporting' },
  { id: 'AI_ADVISOR', label: 'Aura AI Advisor', desc: 'Generative AI insights and assistant' },
  { id: 'LUMINA_STUDIO', label: 'LUMINA Studio', desc: 'Next-gen learning and content creation' },
  { id: 'COMMUNICATION', label: 'Communication', desc: 'Automated SMS, Email, and Push notifications' },
  { id: 'ANALYTICS_PREMIUM', label: 'Premium Analytics', desc: 'Advanced data visualization and trends' },
];

function createFallbackSettings(
  activeTheme: string,
  accentColor: string,
  glassIntensity: number,
  borderRadius: string,
): PlatformSettingsResponse {
  return {
    settingsId: 'local',
    themeName: activeTheme || 'indigo-flow',
    accentColor: accentColor || '#6366f1',
    defaultTrialDays: 14,
    maintenanceMode: false,
    platformName: 'ElevateSmart',
    contactEmail: 'support@elevatesmart.local',
    glassIntensity,
    borderRadius,
    authServiceUrl: 'http://localhost:8082',
    communicationServiceUrl: 'http://localhost:8089',
    releasedFeatureCodes: ['*'],
    updatedAt: new Date().toISOString(),
  };
}

export default function PlatformSettingsPage() {
  const { 
    accentColor, setAccentColor, 
    glassIntensity, setGlassIntensity, 
    borderRadius, setBorderRadius,
    activeTheme, setActiveTheme
  } = useStore();
  const [settings, setSettings] = useState<PlatformSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'visual' | 'metadata' | 'studio'>('visual');

  const updateCSSVars = (accent: string, glass: number, radius: string) => {
    const root = document.documentElement;
    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--glass-intensity', glass.toString());
    root.style.setProperty('--radius-main', radius);
  };

  useEffect(() => {
    platformSettingsApi.getSettings()
      .then((data) => {
        setSettings(data);
        if (data.accentColor) setAccentColor(data.accentColor);
        if (data.glassIntensity !== undefined) setGlassIntensity(data.glassIntensity);
        if (data.borderRadius) setBorderRadius(data.borderRadius);
        if (data.themeName) setActiveTheme(data.themeName);
        updateCSSVars(data.accentColor, data.glassIntensity, data.borderRadius);
      })
      .catch(() => {
        setSettings(createFallbackSettings(activeTheme, accentColor, glassIntensity, borderRadius));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await platformSettingsApi.updateSettings({
        themeName: settings.themeName,
        accentColor: settings.accentColor,
        defaultTrialDays: settings.defaultTrialDays,
        maintenanceMode: settings.maintenanceMode,
        platformName: settings.platformName,
        contactEmail: settings.contactEmail,
        glassIntensity: settings.glassIntensity,
        borderRadius: settings.borderRadius,
        authServiceUrl: settings.authServiceUrl,
        communicationServiceUrl: settings.communicationServiceUrl,
        releasedFeatureCodes: settings.releasedFeatureCodes,
      });
      setSettings(updated);
      setAccentColor(updated.accentColor);
      setGlassIntensity(updated.glassIntensity);
      setBorderRadius(updated.borderRadius);
      if (updated.themeName) setActiveTheme(updated.themeName);
      updateCSSVars(updated.accentColor, updated.glassIntensity, updated.borderRadius);
      setMessage({ type: 'success', text: 'Nerve Center configuration synchronized successfully.' });
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Cloud synchronization failed. Changes applied to local session only.' });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (patch: Partial<PlatformSettingsResponse>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    
    // Proactively update store and CSS for immediate feedback
    if (patch.accentColor) setAccentColor(patch.accentColor);
    if (patch.glassIntensity !== undefined) setGlassIntensity(patch.glassIntensity);
    if (patch.borderRadius) setBorderRadius(patch.borderRadius);
    if (patch.themeName) setActiveTheme(patch.themeName);

    updateCSSVars(
      next.accentColor,
      next.glassIntensity,
      next.borderRadius
    );
  };

  const handleThemeSelect = (t: typeof THEMES[0]) => {
    updateSettings({
      themeName: t.id,
      accentColor: t.accent,
      glassIntensity: t.glass,
      borderRadius: t.radius
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <Loader size={32} className="animate-spin text-slate-500" />
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Dynamic Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            <Cpu size={12} /> System Core v5.0-λ
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>Platform Engine</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.95rem' }}>Synchronize global visual identity, orchestration policies, and public storytelling nodes.</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '14px 28px',
            borderRadius: 16,
            background: `linear-gradient(135deg, ${settings?.accentColor || '#6366f1'}, #fff)`,
            color: '#020617',
            fontWeight: 900,
            fontSize: '0.88rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: `0 10px 30px ${settings?.accentColor}40`,
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          Push Deployment
        </motion.button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ padding: '16px 24px', borderRadius: 16, background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, color: message.type === 'success' ? '#34d399' : '#fb7185', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'visual', label: 'Visual Identity', icon: Palette, color: '#818cf8' },
            { id: 'metadata', label: 'Engine Config', icon: Settings2, color: '#22d3ee' },
            { id: 'studio', label: 'Public Studio', icon: Layout, color: '#f472b6' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 14,
                background: activeSection === tab.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: activeSection === tab.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                color: activeSection === tab.id ? '#fff' : 'var(--text-muted)',
                fontSize: '0.88rem', fontWeight: activeSection === tab.id ? 800 : 600,
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <tab.icon size={18} color={activeSection === tab.id ? tab.color : 'currentColor'} />
              {tab.label}
              {activeSection === tab.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ minHeight: 600 }}>
          {activeSection === 'visual' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ padding: 32, borderRadius: 28, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Palette size={20} color={settings?.accentColor} /> Design Language
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, display: 'block' }}>Branding Preset</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {THEMES.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => handleThemeSelect(t)}
                          style={{
                            padding: '16px', borderRadius: 20, background: settings?.themeName === t.id ? `${t.accent}15` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${settings?.themeName === t.id ? t.accent : 'rgba(255,255,255,0.08)'}`,
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: t.accent, boxShadow: `0 0 15px ${t.accent}40` }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: settings?.themeName === t.id ? '#fff' : 'var(--text-dim)' }}>{t.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.id === 'cyan-neon' ? 'Futuristic' : 'Modern'}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginBottom: 16, display: 'block' }}>Glassmorphism Intensity</label>
                      <input 
                        type="range" min="0.1" max="0.9" step="0.05"
                        value={settings?.glassIntensity || 0.4}
                        onChange={e => updateSettings({ glassIntensity: parseFloat(e.target.value) })}
                        style={{ width: '100%', accentColor: settings?.accentColor }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 8 }}>
                        <span>MINIMAL</span>
                        <span>IMMERSIVE</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginBottom: 16, display: 'block' }}>Geometric Radius</label>
                      <input 
                        type="range" min="4" max="48" step="4"
                        value={parseInt(settings?.borderRadius || '24')}
                        onChange={e => updateSettings({ borderRadius: `${e.target.value}px` })}
                        style={{ width: '100%', accentColor: settings?.accentColor }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 8 }}>
                        <span>PRECISION</span>
                        <span>FLUID</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginBottom: 16, display: 'block' }}>Custom Hex Accent</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input 
                        type="color" value={settings?.accentColor}
                        onChange={e => updateSettings({ accentColor: e.target.value })}
                        style={{ width: 56, height: 56, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 12, overflow: 'hidden' }}
                      />
                      <input 
                        type="text" value={settings?.accentColor}
                        onChange={e => updateSettings({ accentColor: e.target.value })}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '0 20px', color: '#fff', fontSize: '1rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div style={{ padding: 32, borderRadius: 28, background: `linear-gradient(135deg, ${settings?.accentColor}10, transparent)`, border: '1px solid var(--glass-border)', display: 'flex', gap: 24, alignItems: 'center' }}>
                 <div style={{ width: 64, height: 64, borderRadius: settings?.borderRadius, background: settings?.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: `0 10px 40px ${settings?.accentColor}40` }}>
                    <Layers size={32} />
                 </div>
                 <div>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>Real-time Preview</h4>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>This component reflects your current session style before permanent deployment.</p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'metadata' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ padding: 32, borderRadius: 28, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Settings2 size={20} color="#22d3ee" /> Orchestration Config
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'block' }}>Platform Identity</label>
                    <input 
                      type="text" value={settings?.platformName}
                      onChange={e => updateSettings({ platformName: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'block' }}>Global Support Portal</label>
                    <input 
                      type="email" value={settings?.contactEmail}
                      onChange={e => updateSettings({ contactEmail: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                   <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'block' }}>System State</label>
                   <div 
                    onClick={() => updateSettings({ maintenanceMode: !settings?.maintenanceMode })}
                    style={{ 
                      padding: '20px 24px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: settings?.maintenanceMode ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.05)',
                      border: `1px solid ${settings?.maintenanceMode ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.1)'}`,
                      transition: 'all 0.2s'
                    }}
                   >
                     <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: settings?.maintenanceMode ? '#f43f5e20' : '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings?.maintenanceMode ? '#f43f5e' : '#10b981' }}>
                           <Shield size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{settings?.maintenanceMode ? 'Maintenance Protocol Active' : 'All Systems Operational'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{settings?.maintenanceMode ? 'Platform is locked to all non-admin roles.' : 'Public and institutional traffic is flowing normally.'}</div>
                        </div>
                     </div>
                     <div style={{ width: 50, height: 26, borderRadius: 99, background: settings?.maintenanceMode ? '#f43f5e' : '#1e293b', position: 'relative', transition: 'all 0.3s' }}>
                        <div style={{ position: 'absolute', top: 4, left: settings?.maintenanceMode ? 28 : 4, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'all 0.3s' }} />
                     </div>
                   </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Released UI Feature Gates</label>
                    <button 
                      onClick={() => {
                        const isAll = settings?.releasedFeatureCodes?.includes('*');
                        updateSettings({ releasedFeatureCodes: isAll ? [] : ['*'] });
                      }}
                      style={{ padding: '6px 12px', borderRadius: 8, background: settings?.releasedFeatureCodes?.includes('*') ? `${settings?.accentColor}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${settings?.releasedFeatureCodes?.includes('*') ? settings?.accentColor : 'rgba(255,255,255,0.1)'}`, color: settings?.releasedFeatureCodes?.includes('*') ? settings?.accentColor : 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      MASTER TOGGLE (*)
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {AVAILABLE_FEATURES.map(f => {
                      const isActive = settings?.releasedFeatureCodes?.includes('*') || settings?.releasedFeatureCodes?.includes(f.id);
                      const isMaster = settings?.releasedFeatureCodes?.includes('*');
                      
                      return (
                        <div 
                          key={f.id}
                          onClick={() => {
                            if (isMaster) return;
                            const current = settings?.releasedFeatureCodes || [];
                            const next = current.includes(f.id) 
                              ? current.filter(id => id !== f.id)
                              : [...current, f.id];
                            updateSettings({ releasedFeatureCodes: next });
                          }}
                          style={{
                            padding: '16px 20px', borderRadius: 18, background: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: isMaster ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            opacity: isMaster && f.id !== '*' ? 0.6 : 1
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isActive ? '#fff' : 'var(--text-dim)' }}>{f.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.desc}</div>
                          </div>
                          
                          <div style={{ width: 44, height: 22, borderRadius: 99, background: isActive ? (isMaster ? 'var(--text-muted)' : settings?.accentColor) : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s', flexShrink: 0, marginLeft: 12 }}>
                            <motion.div 
                              animate={{ x: isActive ? 24 : 4 }}
                              style={{ position: 'absolute', top: 4, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <p style={{ marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Zap size={14} color="#fbbf24" /> 
                    <span>Gating control allows rolling out features to specific subscription tiers or staging them before global release. When <b>God Mode (*)</b> is active, all feature gates are bypassed globally.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'studio' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <PublicSiteStudio />
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        input:focus, textarea:focus { border-color: var(--brand-accent) !important; outline: none; background: rgba(255,255,255,0.05) !important; }
        .pulse-active { animation: pulse-ring 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0px var(--brand-accent); opacity: 0.5; }
          100% { box-shadow: 0 0 0 50px var(--brand-accent); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
