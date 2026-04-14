import React, { useEffect, useMemo, useState } from 'react';
import { aiInteractionApi, AiRateLimitPolicyResponse, AiToolCatalogItem } from '../../lib/api';

type EditableLimits = Record<string, Record<string, string>>;

const PLAN_ORDER = ['FREE', 'BASIC', 'PREMIUM'];

const AiGovernancePage: React.FC = () => {
  const [tools, setTools] = useState<AiToolCatalogItem[]>([]);
  const [policy, setPolicy] = useState<AiRateLimitPolicyResponse | null>(null);
  const [editable, setEditable] = useState<EditableLimits>({});
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [toolList, ratePolicy, events] = await Promise.all([
          aiInteractionApi.listTools(),
          aiInteractionApi.getRateLimits(),
          aiInteractionApi.listAuditEvents(100),
        ]);
        setTools(toolList);
        setPolicy(ratePolicy);
        setAuditEvents(events);

        const next: EditableLimits = {};
        for (const [plan, rules] of Object.entries(ratePolicy.limits || {})) {
          next[plan] = {};
          for (const [tool, limit] of Object.entries(rules || {})) {
            next[plan][tool] = String(limit);
          }
        }
        setEditable(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load AI governance data.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const toolsByName = useMemo(() => tools.map((t) => t.name), [tools]);

  const updateLimit = (plan: string, tool: string, value: string) => {
    setEditable((prev) => ({
      ...prev,
      [plan]: {
        ...(prev[plan] || {}),
        [tool]: value,
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const normalized: Record<string, Record<string, number>> = {};
      for (const plan of PLAN_ORDER) {
        const raw = editable[plan] || {};
        normalized[plan] = {};
        for (const tool of toolsByName) {
          const val = Number(raw[tool] ?? '');
          if (!Number.isFinite(val) || val < 1 || val > 10000) {
            throw new Error(`Invalid limit for ${plan}.${tool}`);
          }
          normalized[plan][tool] = Math.floor(val);
        }
      }

      const updated = await aiInteractionApi.updateRateLimits(normalized);
      setPolicy(updated);
      setSuccess('AI rate-limit policy saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save AI rate limits.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Loading AI governance...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ border: '1px solid var(--glass-border)', borderRadius: 14, padding: 16, background: 'var(--surface-elevated)' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-strong)' }}>AI Tool Catalog</h2>
        <p style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 13 }}>
          Visible tools and prompts available to current role.
        </p>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {tools.map((tool) => (
            <article key={tool.name} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>
                {tool.name} {tool.requiresConfirmation ? '(confirmation)' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{tool.description}</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                {tool.examplePrompts?.map((p) => (
                  <span key={p} style={{ display: 'inline-block', marginRight: 6, marginBottom: 6, border: '1px solid var(--glass-border)', borderRadius: 999, padding: '3px 8px' }}>
                    {p}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ border: '1px solid var(--glass-border)', borderRadius: 14, padding: 16, background: 'var(--surface-elevated)' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-strong)' }}>Subscription Tool Rate Limits</h2>
        <p style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 13 }}>
          Per-minute tool limits by subscription plan (FREE, BASIC, PREMIUM).
        </p>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--glass-border)' }}>Tool</th>
                {PLAN_ORDER.map((plan) => (
                  <th key={plan} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--glass-border)' }}>{plan}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {toolsByName.map((tool) => (
                <tr key={tool}>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--glass-border)' }}>{tool}</td>
                  {PLAN_ORDER.map((plan) => (
                    <td key={`${tool}-${plan}`} style={{ padding: 8, borderBottom: '1px solid var(--glass-border)' }}>
                      <input
                        value={editable[plan]?.[tool] ?? ''}
                        onChange={(e) => updateLimit(plan, tool, e.target.value)}
                        style={{
                          width: 90,
                          border: '1px solid var(--glass-border)',
                          borderRadius: 8,
                          padding: '5px 8px',
                          background: 'var(--bg-dropdown)',
                          color: 'var(--text-main)',
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            style={{
              border: '1px solid var(--surface-accent-border)',
              background: 'var(--surface-accent-soft)',
              color: 'var(--text-strong)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Rate Limits'}
          </button>
          {success && <span style={{ fontSize: 12, color: '#34d399' }}>{success}</span>}
          {error && <span style={{ fontSize: 12, color: '#fb7185' }}>{error}</span>}
        </div>
      </section>

      <section style={{ border: '1px solid var(--glass-border)', borderRadius: 14, padding: 16, background: 'var(--surface-elevated)' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-strong)' }}>AI Audit Feed</h2>
        <p style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 13 }}>
          Most recent AI activity for governance and debugging.
        </p>
        <div style={{ maxHeight: 320, overflow: 'auto', marginTop: 10, display: 'grid', gap: 8 }}>
          {auditEvents.map((event, idx) => (
            <pre key={`${event.requestId || idx}-${idx}`} style={{ margin: 0, padding: 10, borderRadius: 10, border: '1px solid var(--glass-border)', fontSize: 11, background: 'rgba(15,23,42,0.22)' }}>
              {JSON.stringify(event, null, 2)}
            </pre>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AiGovernancePage;
