import React, { useEffect, useState } from 'react';
import { ImagePlus, Loader, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { onboardingApi, type SchoolBrandingResponse } from '../../lib/api';
import { SchoolMark } from '../public/SchoolMark';

export function SchoolBrandingPanel({
  accentColor,
}: {
  accentColor: string;
}) {
  const [branding, setBranding] = useState<SchoolBrandingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    onboardingApi.getCurrentBranding()
      .then((response) => {
        if (active) {
          setBranding(response);
        }
      })
      .catch((error: any) => {
        if (active) {
          toast.error(error?.message || 'Could not load school branding.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await onboardingApi.uploadCurrentSchoolLogo(file);
      setBranding(response);
      toast.success('School branding updated.');
    } catch (error: any) {
      toast.error(error?.message || 'Could not update the school logo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
        Loading school branding...
      </div>
    );
  }

  if (!branding) {
    return (
      <div style={{ color: '#94a3b8', lineHeight: 1.7 }}>
        School branding is unavailable for this account right now.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: 24, alignItems: 'start' }}>
      <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <SchoolMark
          school={{
            schoolName: branding.schoolName,
            schoolCode: branding.schoolCode,
            logoUrl: branding.logoUrl || null,
          }}
          size="lg"
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 800 }}>{branding.schoolName}</div>
          <div style={{ color: '#8b95a2', fontSize: '0.82rem', marginTop: 4 }}>{branding.schoolCode}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 8px' }}>School Branding</h3>
          <p style={{ color: '#8b95a2', margin: 0, lineHeight: 1.7 }}>
            Keep the school identity current for the public landing surface, onboarding records, and school-facing experiences.
            If no uploaded logo exists, the platform automatically falls back to an interactive initials-based mark.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: 6 }}>City</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{branding.city}</div>
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: 6 }}>State</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{branding.state}</div>
          </div>
        </div>

        <div style={{ padding: 20, borderRadius: 22, background: `linear-gradient(135deg, ${accentColor}10, rgba(255,255,255,0.03))`, border: `1px solid ${accentColor}25`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: accentColor, fontWeight: 800 }}>
            <Sparkles size={16} />
            Branding refresh
          </div>
          <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.7 }}>
            Upload PNG, JPG, or WebP artwork. The updated mark is stored centrally and immediately becomes available to public and authenticated experiences.
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: 'fit-content', padding: '12px 16px', borderRadius: 14, border: `1px dashed ${accentColor}66`, background: `${accentColor}12`, color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 0 }}>
            {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ImagePlus size={16} />}
            {uploading ? 'Uploading logo...' : branding.logoUrl ? 'Replace school logo' : 'Upload school logo'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                handleUpload(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
