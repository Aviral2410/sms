import React, { useEffect, useState } from 'react';
import { platformConfigApi, PlatformConfigResponse, platformSettingsApi, PlatformSettingsResponse } from '../../lib/api';
import { PublicSiteStudio } from '../../components/admin/PublicSiteStudio';
import { useStore } from '../../store/useStore';
import { Palette, Shield, Clock, Globe, Save, Loader, CheckCircle, AlertCircle, Server, Zap } from 'lucide-react';

const THEMES = [
  { id: 'indigo-flow', name: 'Indigo Flow', accent: '#6366f1', glass: 0.4, radius: '24px' },
  { id: 'emerald-pulse', name: 'Emerald Pulse', accent: '#10b981', glass: 0.6, radius: '32px' },
  { id: 'rose-ember', name: 'Rose Ember', accent: '#f43f5e', glass: 0.3, radius: '16px' },
  { id: 'amber-glow', name: 'Amber Glow', accent: '#f59e0b', glass: 0.5, radius: '40px' },
  { id: 'cyan-neon', name: 'Cyan Neon', accent: '#06b6d4', glass: 0.8, radius: '12px' },
];

const SERVICE_CATALOG = [
  { serviceName: 'RAZORPAY', label: 'Razorpay', helper: 'Primary online payment gateway', accent: '#38bdf8' },
  { serviceName: 'STRIPE', label: 'Stripe', helper: 'Fallback payment processor', accent: '#a78bfa' },
  { serviceName: 'TWILIO_UNIFIED', label: 'Twilio', helper: 'SMS and WhatsApp delivery', accent: '#22c55e' },
  { serviceName: 'SENDGRID_EMAIL', label: 'SendGrid', helper: 'Transactional email delivery', accent: '#f97316' },
  { serviceName: 'GEMINI_LLM', label: 'Gemini', helper: 'Premium AI learning flows', accent: '#14b8a6' },
  { serviceName: 'OPENAI', label: 'OpenAI', helper: 'Alternative AI provider', accent: '#f43f5e' },
  { serviceName: 'OPENROUTER', label: 'OpenRouter', helper: 'Multi-model AI routing', accent: '#f59e0b' },
  { serviceName: 'ANTHROPIC', label: 'Anthropic', helper: 'Claude-based AI fallback', accent: '#06b6d4' },
] as const;

type ConfigDraft = PlatformConfigResponse & {
  secretValue: string;
  metadataText: string;
};

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
    contactEmail: 'support@elevatesmart.ai',
    glassIntensity,
    borderRadius,
    authServiceUrl: 'http://localhost:8082',
    communicationServiceUrl: 'http://localhost:8089',
    updatedAt: new Date().toISOString(),
  };
}

function createDraft(config?: Partial<PlatformConfigResponse> & { serviceName: string }): ConfigDraft {
  return {
    configId: config?.configId || config?.serviceName || 'local',
    serviceName: config?.serviceName || 'UNKNOWN',
    maskedSecret: config?.maskedSecret || '',
    secretConfigured: Boolean(config?.secretConfigured),
    apiBaseUrl: config?.apiBaseUrl || '',
    enabled: Boolean(config?.enabled),
    refreshRequired: Boolean(config?.refreshRequired),
    metadata: config?.metadata || {},
    updatedAt: config?.updatedAt || null,
    secretValue: '',
    metadataText: JSON.stringify(config?.metadata || {}, null, 2),
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
  const [savingConfig, setSavingConfig] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);
  const [configDrafts, setConfigDrafts] = useState<Record<string, ConfigDraft>>({});

  const updateCSSVars = (accent: string, glass: number, radius: string) => {
    document.documentElement.style.setProperty('--brand-accent', accent);
    document.documentElement.style.setProperty('--glass-intensity', glass.toString());
    document.documentElement.style.setProperty('--radius-main', radius);
  };

  useEffect(() => {
    Promise.allSettled([
      platformSettingsApi.getSettings(),
      platformConfigApi.listConfigs(),
    ])
      .then(([settingsResult, configsResult]) => {
        if (settingsResult.status === 'fulfilled') {
          const data = settingsResult.value;
          setSettings(data);
          if (data.accentColor) setAccentColor(data.accentColor);
          if (data.glassIntensity !== undefined && data.glassIntensity !== null) setGlassIntensity(data.glassIntensity);
          if (data.borderRadius) setBorderRadius(data.borderRadius);
          if (data.themeName) setActiveTheme(data.themeName);
          updateCSSVars(data.accentColor, data.glassIntensity, data.borderRadius);
        } else {
          setSettings(createFallbackSettings(activeTheme || 'indigo-flow', accentColor || '#6366f1', glassIntensity ?? 0.4, borderRadius ?? '24px'));
        }

        const configs = configsResult.status === 'fulfilled' ? configsResult.value : [];
        const nextDrafts: Record<string, ConfigDraft> = {};
        SERVICE_CATALOG.forEach((entry) => {
          const existing = configs.find((item) => item.serviceName === entry.serviceName);
          nextDrafts[entry.serviceName] = createDraft(existing || { serviceName: entry.serviceName, enabled: false, refreshRequired: true, metadata: {} });
        });
        setConfigDrafts(nextDrafts);
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
      });
      setSettings(updated);
      setAccentColor(updated.accentColor);
      setGlassIntensity(updated.glassIntensity);
      setBorderRadius(updated.borderRadius);
      if (updated.themeName) setActiveTheme(updated.themeName);
      updateCSSVars(updated.accentColor, updated.glassIntensity, updated.borderRadius);
      setMessage({ type: 'success', text: 'Global platform settings synchronized and active.' });
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    } catch (e) {
      // Save to local store even if backend fails
      setAccentColor(settings.accentColor);
      setGlassIntensity(settings.glassIntensity);
      setBorderRadius(settings.borderRadius);
      if (settings.themeName) setActiveTheme(settings.themeName);
      updateCSSVars(settings.accentColor, settings.glassIntensity, settings.borderRadius);
      setMessage({ type: 'info', text: 'Visual configuration applied locally. (Cloud sync pending)' });
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformSettingsResponse, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    if (field === 'accentColor' || field === 'glassIntensity' || field === 'borderRadius') {
       updateCSSVars(
         field === 'accentColor' ? value : newSettings.accentColor,
         field === 'glassIntensity' ? value : newSettings.glassIntensity,
         field === 'borderRadius' ? value : newSettings.borderRadius
       );
    }

    if (field === 'accentColor') setAccentColor(value);
    if (field === 'glassIntensity') setGlassIntensity(value);
    if (field === 'borderRadius') setBorderRadius(value);
    if (field === 'themeName') setActiveTheme(value);
  };

  const updateConfigDraft = (serviceName: string, patch: Partial<ConfigDraft>) => {
    setConfigDrafts((current) => ({
      ...current,
      [serviceName]: {
        ...(current[serviceName] ?? createDraft({ serviceName, enabled: false, refreshRequired: true, metadata: {} })),
        ...patch,
      },
    }));
  };

  const saveConfig = async (serviceName: string) => {
    const draft = configDrafts[serviceName];
    if (!draft) return;

    let metadata: Record<string, unknown>;
    try {
      metadata = draft.metadataText.trim() ? JSON.parse(draft.metadataText) : {};
    } catch {
      setMessage({ type: 'error', text: `Metadata JSON is invalid for ${serviceName}.` });
      return;
    }

    setSavingConfig(serviceName);
    setMessage(null);
    try {
      const updated = await platformConfigApi.updateConfig(serviceName, {
        serviceName,
        secretValue: draft.secretValue || undefined,
        apiBaseUrl: draft.apiBaseUrl || '',
        enabled: draft.enabled,
        refreshRequired: draft.refreshRequired,
        metadata,
      });
      setConfigDrafts((current) => ({
        ...current,
        [serviceName]: createDraft(updated),
      }));
      setMessage({ type: 'success', text: `${serviceName} configuration saved and encrypted.` });
    } catch {
      setMessage({ type: 'error', text: `Unable to save ${serviceName} configuration right now.` });
    } finally {
      setSavingConfig(null);
    }
  };

  const sectionStyle: React.CSSProperties = {
    padding: 28,
    borderRadius: 24,
    background: 'linear-gradient(160deg, rgba(15,23,42,0.78), rgba(2,6,23,0.86))',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  };

  const labelTitleStyle: React.CSSProperties = {
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.11em',
    fontWeight: 800,
    color: '#64748b',
    marginBottom: 8,
    display: 'block',
  };

  const fieldInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '12px 14px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin text-slate-500" /></div>;

  return (
    <div className="flex flex-col gap-8 animate-in" style={{ maxWidth: 1220 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Engine</h1>
          <p className="text-slate-500 mt-1">Configure global appearance, trial policies, and system-wide state.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${settings?.accentColor || '#22d3ee'}, rgba(255,255,255,0.7))`,
            border: 'none',
            color: '#020617',
            fontWeight: 800,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: `0 0 24px ${settings?.accentColor || '#22d3ee'}40`,
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
          message.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
          'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle size={18} /> : 
             message.type === 'info' ? <Zap size={18} className="animate-pulse" /> : 
             <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
          {message.type === 'info' && (
            <div className="text-[10px] bg-blue-500/20 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Optimistic Update</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appearance Section */}
        <section style={sectionStyle}>
          <div className="flex items-center gap-2 text-brand-accent mb-2">
            <Palette size={20} />
            <h3 className="text-lg font-bold text-white">Visual Identity</h3>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Global Theme Preset</span>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      updateField('themeName', t.id);
                      updateField('accentColor', t.accent);
                      updateField('glassIntensity', t.glass);
                      updateField('borderRadius', t.radius);
                    }}
                    style={{
                      padding: '10px 11px',
                      borderRadius: 12,
                      border: settings?.themeName === t.id ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                      background: settings?.themeName === t.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.01)',
                      color: settings?.themeName === t.id ? '#fff' : '#94a3b8',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: t.accent, boxShadow: `0 0 16px ${t.accent}66` }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Glass Intensity</span>
                <input 
                  type="range" 
                  min="0.1" max="0.9" step="0.05"
                  value={settings?.glassIntensity || 0.4} 
                  onChange={(e) => updateField('glassIntensity', parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
                  <span>MIST</span>
                  <span>FROST</span>
                </div>
              </label>

              <label className="block">
                <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Corner Radius</span>
                <input 
                  type="range" 
                  min="4" max="48" step="4"
                  value={parseInt(settings?.borderRadius || '24')} 
                  onChange={(e) => updateField('borderRadius', `${e.target.value}px`)}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
                  <span>SHARP</span>
                  <span>ROUND</span>
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Custom Accent Hex</span>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={settings?.accentColor || '#6366f1'} 
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                />
                <input 
                  type="text" 
                  value={settings?.accentColor || ''} 
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  style={{ ...fieldInputStyle, fontFamily: 'monospace', flex: 1 }}
                  placeholder="#000000"
                />
              </div>
            </label>
          </div>
        </section>

        {/* Global Configuration */}
        <section style={sectionStyle}>
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Globe size={20} />
            <h3 className="text-lg font-bold text-white">Platform Metadata</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span style={labelTitleStyle}>Platform Name</span>
              <input 
                type="text" 
                value={settings?.platformName || ''} 
                onChange={(e) => updateField('platformName', e.target.value)}
                style={fieldInputStyle}
              />
            </label>
            <label>
              <span style={labelTitleStyle}>Support Contact</span>
              <input 
                type="email" 
                value={settings?.contactEmail || ''} 
                onChange={(e) => updateField('contactEmail', e.target.value)}
                style={fieldInputStyle}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 text-amber-400 mt-4 mb-2">
            <Clock size={20} />
            <h3 className="text-lg font-bold text-white">Policies</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span style={labelTitleStyle}>Default Trial Duration (Days)</span>
              <input 
                type="number" 
                value={settings?.defaultTrialDays || 14} 
                onChange={(e) => updateField('defaultTrialDays', parseInt(e.target.value))}
                style={fieldInputStyle}
              />
            </label>
            <label>
              <span style={labelTitleStyle}>System Maintenance Mode</span>
              <div 
                onClick={() => updateField('maintenanceMode', !settings?.maintenanceMode)}
                className={`h-12 rounded-xl px-4 flex items-center justify-between cursor-pointer border transition-all ${settings?.maintenanceMode ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                  <Shield size={14} /> {settings?.maintenanceMode ? 'OFFLINE' : 'ONLINE'}
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all ${settings?.maintenanceMode ? 'bg-rose-500' : 'bg-slate-700'}`}>
                   <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings?.maintenanceMode ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </label>
          </div>
        </section>
      </div>

      <section style={sectionStyle}>
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <Server size={20} />
          <h3 className="text-lg font-bold text-white">Third-Party Runtime Config</h3>
        </div>
        <p className="text-sm text-slate-400">
          Platform admins can rotate keys, base URLs, and metadata here. Secrets are masked in the UI and consumed by backend services through encrypted runtime config.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {SERVICE_CATALOG.map((entry) => {
            const draft = configDrafts[entry.serviceName] || createDraft({ serviceName: entry.serviceName, enabled: false, refreshRequired: true, metadata: {} });
            return (
              <div
                key={entry.serviceName}
                style={{
                  padding: 22,
                  borderRadius: 20,
                  border: `1px solid ${entry.accent}33`,
                  background: `linear-gradient(160deg, ${entry.accent}12, rgba(15,23,42,0.7))`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black tracking-[0.18em] uppercase" style={{ color: entry.accent }}>{entry.serviceName}</div>
                    <div className="text-white text-lg font-bold">{entry.label}</div>
                    <div className="text-sm text-slate-400">{entry.helper}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-[0.16em] uppercase ${draft.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/70 text-slate-400'}`}>
                    {draft.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <label>
                  <span style={labelTitleStyle}>Base URL</span>
                  <input
                    type="text"
                    value={draft.apiBaseUrl || ''}
                    onChange={(e) => updateConfigDraft(entry.serviceName, { apiBaseUrl: e.target.value })}
                    style={fieldInputStyle}
                    placeholder="https://api.example.com"
                  />
                </label>

                <label>
                  <span style={labelTitleStyle}>Secret</span>
                  <input
                    type="password"
                    value={draft.secretValue}
                    onChange={(e) => updateConfigDraft(entry.serviceName, { secretValue: e.target.value })}
                    style={{ ...fieldInputStyle, fontFamily: 'monospace' }}
                    placeholder={draft.maskedSecret || 'Enter a new secret value'}
                  />
                  <div className="text-[11px] text-slate-500 mt-2">
                    {draft.secretConfigured ? `Stored secret: ${draft.maskedSecret}` : 'No secret stored yet.'}
                  </div>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    <span style={labelTitleStyle}>Runtime State</span>
                    <div
                      onClick={() => updateConfigDraft(entry.serviceName, { enabled: !draft.enabled })}
                      className={`h-12 rounded-xl px-4 flex items-center justify-between cursor-pointer border transition-all ${draft.enabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/80 border-white/10 text-slate-400'}`}
                    >
                      <span className="font-bold text-xs uppercase tracking-widest">{draft.enabled ? 'Active' : 'Paused'}</span>
                      <div className={`w-10 h-5 rounded-full relative transition-all ${draft.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${draft.enabled ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                  </label>

                  <label>
                    <span style={labelTitleStyle}>Refresh Required</span>
                    <div
                      onClick={() => updateConfigDraft(entry.serviceName, { refreshRequired: !draft.refreshRequired })}
                      className={`h-12 rounded-xl px-4 flex items-center justify-between cursor-pointer border transition-all ${draft.refreshRequired ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' : 'bg-slate-800/80 border-white/10 text-slate-400'}`}
                    >
                      <span className="font-bold text-xs uppercase tracking-widest">{draft.refreshRequired ? 'Refresh Clients' : 'Hot Reload Safe'}</span>
                      <Zap size={16} />
                    </div>
                  </label>
                </div>

                <label>
                  <span style={labelTitleStyle}>Metadata (JSON)</span>
                  <textarea
                    value={draft.metadataText}
                    onChange={(e) => updateConfigDraft(entry.serviceName, { metadataText: e.target.value })}
                    rows={5}
                    style={{ ...fieldInputStyle, fontFamily: 'monospace', resize: 'vertical' }}
                  />
                </label>

                <button
                  onClick={() => saveConfig(entry.serviceName)}
                  disabled={savingConfig === entry.serviceName}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${entry.accent}, rgba(255,255,255,0.72))`,
                    border: 'none',
                    color: '#020617',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: savingConfig === entry.serviceName ? 'not-allowed' : 'pointer',
                    opacity: savingConfig === entry.serviceName ? 0.7 : 1,
                  }}
                >
                  {savingConfig === entry.serviceName ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  Save {entry.label}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <PublicSiteStudio />

      <style>{`
        .glass-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; backdrop-filter: blur(8px); }
        input { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 12px 16px; color: #fff; width: 100%; transition: all 0.2s; }
        textarea { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 12px 16px; color: #fff; width: 100%; transition: all 0.2s; }
        input:focus { outline: none; border-color: var(--brand-accent); background: rgba(255, 255, 255, 0.05); }
        textarea:focus { outline: none; border-color: var(--brand-accent); background: rgba(255, 255, 255, 0.05); }
        label span { font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin-bottom: 8px; display: block; }
        
        .pulse-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          border: 0px solid var(--brand-accent);
          transition: border-width 0.3s ease-out, opacity 0.6s ease-out;
          opacity: 0;
        }
        .pulse-active {
          border-width: 8px;
          opacity: 0.15;
          animation: pulse-ring 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.98); opacity: 0.5; border-width: 20px; }
          100% { transform: scale(1); opacity: 0; border-width: 0px; }
        }
      `}</style>
      <div className={`pulse-overlay ${pulse ? 'pulse-active' : ''}`} style={{ borderColor: settings?.accentColor }} />
    </div>
  );
}
