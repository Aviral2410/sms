import React, { useMemo, useState } from 'react';
import { CheckCircle2, Globe2, Loader, ShieldCheck, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useStore } from '../../store/useStore';
import { PortalPageHeader, PortalSection, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { routingAdminApi, type TenantDomainRecord, type TenantResolutionResponse } from '../../lib/routingAdminApi';

const DEFAULT_PLATFORM_DOMAIN = 'localhost:30080';

export default function RoutingManagementPage() {
  const { session } = useStore();
  const [domains, setDomains] = useState<TenantDomainRecord[]>([]);
  const [form, setForm] = useState({ domain: '', verificationMethod: 'DNS_TXT' });
  const [resolveHost, setResolveHost] = useState(`${session.schoolCode?.toLowerCase() || 'demo-school'}.localhost`);
  const [resolution, setResolution] = useState<TenantResolutionResponse | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const primaryDomain = useMemo(() => domains.find((item) => item.isPrimary) || null, [domains]);

  const addDomain = async () => {
    if (!session.tenantId || !form.domain.trim()) {
      setMessage('Tenant context and domain are required.');
      return;
    }
    setSaving('add');
    setMessage('');
    try {
      const created = await routingAdminApi.addDomain(session.tenantId, {
        domain: form.domain.trim(),
        verificationMethod: form.verificationMethod,
      });
      setDomains((current) => [created, ...current.filter((item) => item.domainId !== created.domainId)]);
      setForm({ domain: '', verificationMethod: 'DNS_TXT' });
      setMessage('Domain added. Use verify once DNS is configured.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to add domain.');
    } finally {
      setSaving(null);
    }
  };

  const verifyDomain = async (domainId: string) => {
    setSaving(domainId);
    setMessage('');
    try {
      const updated = await routingAdminApi.verifyDomain(domainId);
      setDomains((current) => current.map((item) => (item.domainId === domainId ? updated : item)));
      setMessage('Domain verification status refreshed.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to verify domain.');
    } finally {
      setSaving(null);
    }
  };

  const setPrimary = async (domainId: string) => {
    if (!session.tenantId) return;
    setSaving(`primary-${domainId}`);
    setMessage('');
    try {
      await routingAdminApi.setPrimary(session.tenantId, domainId);
      setDomains((current) => current.map((item) => ({ ...item, isPrimary: item.domainId === domainId })));
      setMessage('Primary domain updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to set primary domain.');
    } finally {
      setSaving(null);
    }
  };

  const resolve = async () => {
    if (!resolveHost.trim()) return;
    setSaving('resolve');
    setMessage('');
    try {
      const result = await routingAdminApi.resolveHost(resolveHost.trim());
      setResolution(result);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to resolve host.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Routing & domains"
        title="Tenant host, subdomain, and custom domain control"
        description="This page covers the missing realm/subdomain/custom-domain management requirement with host resolution checks, domain verification actions, and primary-host switching."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="School code host" value={`${session.schoolCode?.toLowerCase() || 'school'}.${DEFAULT_PLATFORM_DOMAIN}`} icon={Globe2} accent="#22d3ee" />
        <PortalStatCard label="Custom domains" value={domains.length} icon={Sparkles} accent="#a78bfa" />
        <PortalStatCard label="Verified" value={domains.filter((item) => item.verificationStatus === 'VERIFIED').length} icon={CheckCircle2} accent="#34d399" />
        <PortalStatCard label="Primary host" value={primaryDomain?.host || `${session.schoolCode?.toLowerCase() || 'school'}.${DEFAULT_PLATFORM_DOMAIN}`} icon={ShieldCheck} accent="#ffb663" />
      </div>

      <PortalSection title="Platform host and DNS guidance" description="Use the school code subdomain today on localhost, then add custom domains when DNS is ready.">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <div className="glass-panel" style={{ padding: 20, display: 'grid', gap: 12 }}>
            <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>Current development host</div>
            <div style={{ color: '#22d3ee', fontSize: '1.1rem', fontWeight: 800 }}>{session.schoolCode?.toLowerCase() || 'demo-school'}.{DEFAULT_PLATFORM_DOMAIN}</div>
            <div style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
              This maps to the school-specific landing page and login flow. Production domains can be layered on top once verification succeeds.
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 20, display: 'grid', gap: 10 }}>
            <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>Recommended DNS steps</div>
            <div style={{ color: 'var(--text-dim)' }}>1. Add a TXT record with the verification token returned after domain creation.</div>
            <div style={{ color: 'var(--text-dim)' }}>2. Point your CNAME or A record to the platform ingress.</div>
            <div style={{ color: 'var(--text-dim)' }}>3. Re-run verification and then mark the host as primary if needed.</div>
          </div>
        </div>
      </PortalSection>

      <PortalSection title="Add custom domain" description="Create a custom domain record and keep verification details in one place.">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px_auto]">
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Custom domain</span>
            <input className="input-field" placeholder="school.example.edu" value={form.domain} onChange={(event) => setForm((current) => ({ ...current, domain: event.target.value }))} />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Verification method</span>
            <select className="input-field" value={form.verificationMethod} onChange={(event) => setForm((current) => ({ ...current, verificationMethod: event.target.value }))}>
              <option value="DNS_TXT">DNS TXT</option>
              <option value="HTTP_FILE">HTTP file</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button onClick={addDomain} isLoading={saving === 'add'}>Add domain</Button>
          </div>
        </div>
      </PortalSection>

      <PortalSection title="Domain inventory" description="Verification status, SSL state, and primary-host actions stay visible in the same admin surface.">
        <div className="grid gap-4">
          {domains.length === 0 ? (
            <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)' }}>No custom domains added yet.</div>
          ) : domains.map((domain) => (
            <div key={domain.domainId} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{domain.host}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {domain.domainType} - verification {domain.verificationStatus} - SSL {domain.sslStatus || 'PENDING'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => verifyDomain(domain.domainId)} isLoading={saving === domain.domainId}>Re-verify</Button>
                  <Button onClick={() => setPrimary(domain.domainId)} isLoading={saving === `primary-${domain.domainId}`} disabled={domain.isPrimary}>Set primary</Button>
                </div>
              </div>
              {domain.verificationToken ? (
                <div className="glass-panel" style={{ padding: 14, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>DNS token</div>
                  <div style={{ marginTop: 8, color: 'var(--text-strong)', wordBreak: 'break-all' }}>{domain.verificationToken}</div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Host resolution checker" description="Quickly confirm how the gateway resolves a host before making it canonical.">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
          <input className="input-field" value={resolveHost} onChange={(event) => setResolveHost(event.target.value)} />
          <Button onClick={resolve} isLoading={saving === 'resolve'}>Resolve host</Button>
        </div>
        {resolution ? (
          <div className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
            <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{resolution.error ? 'Resolution error' : 'Resolution result'}</div>
            {resolution.error ? (
              <div style={{ color: '#fda4af' }}>{resolution.error}</div>
            ) : (
              <>
                <div style={{ color: 'var(--text-dim)' }}>Tenant ID: {resolution.tenantId || 'N/A'}</div>
                <div style={{ color: 'var(--text-dim)' }}>Type: {resolution.type || 'N/A'}</div>
                <div style={{ color: 'var(--text-dim)' }}>Realm: {resolution.realmName || resolution.schoolCode || 'N/A'}</div>
                <div style={{ color: 'var(--text-dim)' }}>Redirect: {resolution.redirectUrl || 'None'}</div>
              </>
            )}
          </div>
        ) : null}
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>
    </div>
  );
}
