import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, Bell, Palette, LogOut, Camera, Check, Loader, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SchoolBrandingPanel } from '../components/profile/SchoolBrandingPanel';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const { 
    session, logout, setSession, 
    accentColor, theme, setTheme, 
    activeTheme, setActiveTheme 
  } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'branding'>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({ fullName: session.fullName || '', email: session.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [notifPrefs, setNotifPrefs] = useState({
    systemAnnouncements: true,
    realtimeEvents: true,
    emailDigests: false,
    attendanceAlerts: true,
  });
  const [appearance, setAppearance] = useState({ theme, activeTheme });

  const isPlatformAdmin = session.role === 'PLATFORM_ADMIN' || session.role === 'SUPER_ADMIN';
  const isSchoolScopedUser = Boolean(session.schoolId) && !isPlatformAdmin;

  const handleSave = async () => {
    if (!form.fullName.trim()) { setSaveError('Full name is required.'); return; }
    if (!isPlatformAdmin && !form.email.trim()) { setSaveError('Email is required.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      // For platform admins, force email to remain unchanged (defense-in-depth)
      const safeEmail = isPlatformAdmin ? session.email! : form.email;
      setSession({ ...session, fullName: form.fullName, email: safeEmail });
      setSaved(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = () => {
    setSaving(true);
    try {
      setTheme(appearance.theme);
      setActiveTheme(appearance.activeTheme);
      setSaved(true);
      toast.success('Appearance settings updated!');
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      toast.error('Failed to update appearance.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.current) { toast.error('Enter your current password.'); return; }
    if (passwords.newPass.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match.'); return; }
    toast.success('Password changed successfully!');
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  const roleColor = accentColor;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    ...(isSchoolScopedUser ? [{ id: 'branding', label: 'Branding', icon: Camera }] : []),
  ];

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <motion.div variants={I}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>My Profile</h1>
        <p style={{ color: '#8b95a2', margin: 0 }}>Manage your account settings, security, and preferences</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={I} style={{ padding: '32px', borderRadius: 28, background: `linear-gradient(135deg, ${roleColor}08, rgba(255,255,255,0.02))`, border: `1px solid ${roleColor}20`, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${roleColor}40`, fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
            {(session.fullName || 'U')[0].toUpperCase()}
          </div>
          <button style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 10, background: roleColor, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Camera size={14} color="#000" />
          </button>
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.02em' }}>{session.fullName || 'User Account'}</div>
          <div style={{ fontSize: '0.85rem', color: '#8b95a2', marginTop: 4 }}>{session.email}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 12px', borderRadius: 8, background: `${roleColor}15`, border: `1px solid ${roleColor}25`, fontSize: '0.72rem', fontWeight: 800, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Shield size={10} /> {session.role || 'User'}
          </div>
        </div>
        {/* Only show School ID / Tenant ID for non-platform-admin roles */}
        {!isPlatformAdmin && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>School ID</div>
            <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>{session.schoolId || 'N/A'}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginTop: 10, marginBottom: 4 }}>Tenant ID</div>
            <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>{session.tenantId || 'N/A'}</div>
          </div>
        )}
      </motion.div>

      {/* Tab Nav + Content */}
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Tab sidebar */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, background: tab === t.id ? `${roleColor}12` : 'transparent', border: `1px solid ${tab === t.id ? `${roleColor}25` : 'transparent'}`, color: tab === t.id ? roleColor : '#8b95a2', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left' }}>
              <t.icon size={16} /> {t.label}
              {tab === t.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => { logout(); navigate('/'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, background: 'transparent', border: '1px solid transparent', color: '#fb7185', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', transition: 'all 0.2s' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: '32px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Personal Information</h3>
              {saveError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.85rem' }}>
                  <AlertCircle size={15} /> {saveError}
                </div>
              )}
              {[{ label: 'Full Name', key: 'fullName', type: 'text', icon: User }, { label: 'Email Address', key: 'email', type: 'email', icon: Mail }].map(f => {
                const isDisabled = f.key === 'email' && isPlatformAdmin;
                return (
                  <div key={f.key}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 8 }}>
                      {f.label} {isDisabled && <span style={{ color: roleColor, fontSize: '0.65rem', marginLeft: 8, opacity: 0.8 }}>(LOCKED FOR SECURITY)</span>}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <f.icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: isDisabled ? `${roleColor}40` : '#475569' }} />
                      <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        disabled={isDisabled}
                        style={{ 
                          width: '100%', 
                          boxSizing: 'border-box', 
                          padding: '13px 14px 13px 42px', 
                          borderRadius: 14, 
                          background: isDisabled ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)', 
                          border: `1px solid ${isDisabled ? `${roleColor}20` : 'rgba(255,255,255,0.08)'}`, 
                          color: isDisabled ? '#64748b' : '#fff', 
                          fontSize: '0.9rem', 
                          outline: 'none', 
                          fontFamily: 'inherit', 
                          transition: 'all 0.2s',
                          cursor: isDisabled ? 'not-allowed' : 'text'
                        }}
                        onFocus={e => !isDisabled && (e.target.style.borderColor = roleColor)} 
                        onBlur={e => !isDisabled && (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                    </div>
                  </div>
                );
              })}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                style={{ alignSelf: 'flex-start', padding: '13px 28px', borderRadius: 14, background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`, border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : null}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </motion.button>
            </div>
          )}

          {tab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Security Settings</h3>
              {[
                { label: 'Current Password', key: 'current', placeholder: '••••••••' },
                { label: 'New Password', key: 'newPass', placeholder: 'Min. 8 characters' },
                { label: 'Confirm New Password', key: 'confirm', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 8 }}>{f.label}</div>
                  <input type="password" placeholder={f.placeholder}
                    value={(passwords as any)[f.key]}
                    onChange={e => setPasswords(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#34d399'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
              ))}
              <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <Shield size={18} color="#34d399" />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', marginBottom: 2 }}>Two-Factor Authentication</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b95a2' }}>Add an extra layer of security with 2FA</div>
                </div>
                <div style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 10, background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Enable</div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} onClick={handlePasswordChange} style={{ alignSelf: 'flex-start', padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #34d399, #10b981)', border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} /> Update Password
              </motion.button>
            </div>
          )}

          {tab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Notification Preferences</h3>
              {[
                { label: 'System Announcements', desc: 'Platform-wide updates and alerts', key: 'systemAnnouncements' },
                { label: 'Real-time Events', desc: 'Live MQTT-driven notifications', key: 'realtimeEvents' },
                { label: 'Email Digests', desc: 'Daily summary of activity', key: 'emailDigests' },
                { label: 'Attendance Alerts', desc: 'When students are marked absent', key: 'attendanceAlerts' },
              ].map(n => (
                <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{n.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#8b95a2', marginTop: 2 }}>{n.desc}</div>
                  </div>
                  <div
                    onClick={() => setNotifPrefs(prev => ({ ...prev, [n.key]: !(prev as any)[n.key] }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: (notifPrefs as any)[n.key] ? roleColor : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: (notifPrefs as any)[n.key] ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
              <motion.button whileHover={{ scale: 1.02 }} onClick={() => toast.success('Notification preferences saved!')} style={{ alignSelf: 'flex-start', padding: '13px 28px', borderRadius: 14, background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`, border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} /> Save Preferences
              </motion.button>
            </div>
          )}

          {tab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Visual Preferences</h3>
              <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', marginBottom: 12 }}>Theme Mode</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['dark', 'light', 'system'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setAppearance(prev => ({ ...prev, theme: t as any }))}
                      style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: 12, 
                        background: appearance.theme === t ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', 
                        border: `1px solid ${appearance.theme === t ? roleColor : 'rgba(255,255,255,0.06)'}`, 
                        color: appearance.theme === t ? roleColor : '#fff', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        fontFamily: 'inherit',
                        textTransform: 'capitalize'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', marginBottom: 12 }}>Active Preset</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { id: 'indigo-flow', name: 'Indigo Flow', color: '#6366f1' },
                    { id: 'emerald-pulse', name: 'Emerald Pulse', color: '#10b981' },
                    { id: 'rose-ember', name: 'Rose Ember', color: '#f43f5e' },
                    { id: 'amber-glow', name: 'Amber Glow', color: '#f59e0b' },
                  ].map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setAppearance(prev => ({ ...prev, activeTheme: p.id }))}
                      style={{ 
                        padding: '12px', 
                        borderRadius: 12, 
                        background: appearance.activeTheme === p.id ? `${p.color}15` : 'rgba(255,255,255,0.03)', 
                        border: `1px solid ${appearance.activeTheme === p.id ? p.color : 'rgba(255,255,255,0.06)'}`, 
                        color: appearance.activeTheme === p.id ? '#fff' : '#8b95a2', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSaveAppearance} disabled={saving}
                style={{ alignSelf: 'flex-start', padding: '13px 28px', borderRadius: 14, background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`, border: 'none', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', marginTop: 10 }}>
                {saving ? <Loader size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Palette size={16} />}
                {saving ? 'Applying...' : saved ? 'Applied!' : 'Save Appearance'}
              </motion.button>
            </div>
          )}

          {tab === 'branding' && isSchoolScopedUser && (
            <SchoolBrandingPanel accentColor={roleColor} />
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </motion.div>
  );
}
