import React, { useEffect, useState } from 'react';
import { ApiError, request, subscriptionApi } from '../../lib/api';
import { useStore } from '../../store/useStore';

type DashboardStats = {
  activeVehicles: number;
  runningRoutes: number;
  studentsOnboard: number;
  overspeedAlerts: number;
  idleAlerts: number;
  offlineGps: number;
  openCriticalAlerts: number;
};

type Trip = {
  tripId: string;
  routeName: string;
  vehicleNumber?: string;
  driverName?: string;
  conductorName?: string;
  tripState: string;
  occupancyCount?: number;
  capacity?: number;
  etaToSchoolMinutes?: number;
  nextStopName?: string;
};

type Alert = {
  alertId: string;
  alertType: string;
  severity: string;
  message: string;
  alertStatus: string;
  createdAt: string;
};

type Cluster = {
  localityLabel: string;
  studentCount: number;
  routeCount: number;
  capacityDelta: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  activeTrips: Trip[];
  alerts: Alert[];
  clusters: Cluster[];
};

const glassCard: React.CSSProperties = {
  background: 'rgba(7, 14, 24, 0.78)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.16)',
};

export default function TransportManagementHubPage() {
  const { session, updateSession } = useStore();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const hasPremiumAnalytics = (session.featureCodes || []).includes('*') || (session.featureCodes || []).includes('TRANSPORT_PREMIUM_ANALYTICS');

  const loadDashboard = async () => {
    try {
      const response = await request<DashboardResponse>('/school-ops/transport/dashboard');
      setDashboard(response);
      setError(null);
      setLocked(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setLocked(true);
        setDashboard(null);
        setError(null);
        return;
      }
      setLocked(false);
      setError(err instanceof Error ? err.message : 'Failed to load transport dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const sub = await subscriptionApi.getCurrent();
      const nextFeatures = sub.featureCodes || [];
      const currentFeatures = session.featureCodes || [];
      const changed =
        sub.planCode !== session.planCode ||
        JSON.stringify(nextFeatures) !== JSON.stringify(currentFeatures);

      if (changed) {
        updateSession({
          planCode: sub.planCode,
          featureCodes: nextFeatures,
        });
      }
    } catch (err) {
      console.warn('Silent subscription check failed', err);
    }
  };

  const handleRequestUpgrade = async () => {
    setRequesting(true);
    try {
      const plans = await subscriptionApi.listPlans();
      const premiumPlan = plans.find(p => p.planCode === 'PREMIUM');
      if (premiumPlan) {
        await subscriptionApi.requestUpgrade({ 
          requestedPlanId: premiumPlan.planId,
          requestNotes: 'Interested in live transport tracking and analytics.'
        });
        alert('Upgrade request sent to platform admin. They will review and contact you.');
      }
    } catch (err) {
      alert('Failed to send upgrade request: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    checkSubscription(); // Also check for transitions
    const interval = window.setInterval(loadDashboard, 15000);
    return () => window.clearInterval(interval);
  }, [session.tenantId]);

  if (locked) {
    return (
      <div style={glassCard}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c' }}>Transport Module Locked</div>
        <h2 style={{ margin: '8px 0 0', color: 'white' }}>Upgrade required for live transport</h2>
        <p style={{ color: 'rgba(226,232,240,0.75)', margin: '16px 0 24px' }}>Free plans can keep only static transport records. Upgrade to Basic for live tracking and Premium for alerts, optimization, replay, and advanced analytics.</p>
        <button 
          onClick={handleRequestUpgrade}
          disabled={requesting}
          style={{ 
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 14,
            fontWeight: 800,
            cursor: requesting ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 16px rgba(249, 115, 22, 0.25)'
          }}
        >
          {requesting ? 'Sending Request...' : 'Request Plan Upgrade'}
        </button>
      </div>
    );
  }

  if (loading) {
    return <div style={{ color: 'var(--text-strong)' }}>Loading transport dashboard...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ ...glassCard, display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c' }}>Transport Management</div>
          <h2 style={{ margin: '8px 0 4px', color: 'white' }}>Live operations hub</h2>
          <div style={{ color: 'rgba(226,232,240,0.75)' }}>{session.planCode} plan • Live fleet, route health, and morning/evening trip visibility</div>
        </div>

        {error && <div style={{ color: 'white', background: 'rgba(127,29,29,0.55)', borderRadius: 14, padding: '10px 14px' }}>{error}</div>}

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <StatTile label="Active Vehicles" value={dashboard?.stats.activeVehicles ?? 0} />
          <StatTile label="Running Routes" value={dashboard?.stats.runningRoutes ?? 0} />
          <StatTile label="Students Onboard" value={dashboard?.stats.studentsOnboard ?? 0} />
          <StatTile label="Overspeed Alerts" value={dashboard?.stats.overspeedAlerts ?? 0} tone="#f59e0b" />
          <StatTile label="Idle Alerts" value={dashboard?.stats.idleAlerts ?? 0} tone="#f59e0b" />
          <StatTile label="Offline GPS" value={dashboard?.stats.offlineGps ?? 0} tone="#ef4444" />
          <StatTile label="Critical Alerts" value={dashboard?.stats.openCriticalAlerts ?? 0} tone="#ef4444" />
        </div>
      </section>

      <section style={{ display: 'grid', gap: 20, gridTemplateColumns: '1.4fr 1fr' }}>
        <div style={glassCard}>
          <div style={{ fontWeight: 800, color: 'white', marginBottom: 12 }}>Active Trips</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {dashboard?.activeTrips?.length ? dashboard.activeTrips.map((trip) => (
              <div key={trip.tripId} style={{ padding: 16, borderRadius: 18, background: 'rgba(15,23,42,0.55)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'white' }}>
                  <strong>{trip.routeName}</strong>
                  <span>{trip.tripState}</span>
                </div>
                <div style={{ color: 'rgba(226,232,240,0.76)', marginTop: 8 }}>
                  {trip.vehicleNumber || 'Vehicle pending'} • {trip.occupancyCount ?? 0}/{trip.capacity ?? 0} seats • Next stop {trip.nextStopName || 'N/A'}
                </div>
                <div style={{ color: 'rgba(148,163,184,0.85)', marginTop: 6 }}>
                  Driver: {trip.driverName || 'Pending'} • Conductor: {trip.conductorName || 'Pending'} • ETA {trip.etaToSchoolMinutes ?? '-'} mins
                </div>
              </div>
            )) : (
              <div style={{ color: 'rgba(226,232,240,0.72)' }}>No active trips are running for the selected service window.</div>
            )}
          </div>
        </div>

        <div style={{ ...glassCard, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 800, color: 'white' }}>Alerts Center</div>
          {dashboard?.alerts?.length ? dashboard.alerts.map((alert) => (
            <div key={alert.alertId} style={{ padding: 14, borderRadius: 16, background: alert.severity === 'CRITICAL' ? 'rgba(127,29,29,0.5)' : 'rgba(15,23,42,0.55)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'white' }}>
                <strong>{alert.alertType.replace(/_/g, ' ')}</strong>
                <span>{alert.severity}</span>
              </div>
              <div style={{ color: 'rgba(226,232,240,0.78)', marginTop: 6 }}>{alert.message}</div>
              <div style={{ color: 'rgba(148,163,184,0.85)', fontSize: 12, marginTop: 6 }}>{new Date(alert.createdAt).toLocaleString()}</div>
            </div>
          )) : (
            <div style={{ color: 'rgba(226,232,240,0.72)' }}>No open alerts right now.</div>
          )}
        </div>
      </section>

      <section style={{ ...glassCard, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, color: 'white' }}>Locality Clusters and Optimization</div>
            <div style={{ color: 'rgba(226,232,240,0.72)' }}>Premium analytics combines locality demand, route load, and vehicle usage suggestions.</div>
          </div>
          {!hasPremiumAnalytics && (
            <div style={{ alignSelf: 'center', color: '#fbbf24', fontWeight: 700 }}>Premium required for clusters, replay, and AI optimization</div>
          )}
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {(dashboard?.clusters || []).length ? dashboard!.clusters.map((cluster) => (
            <div key={cluster.localityLabel} style={{ padding: 14, borderRadius: 16, background: 'rgba(15,23,42,0.55)' }}>
              <div style={{ color: 'white', fontWeight: 700 }}>{cluster.localityLabel}</div>
              <div style={{ color: 'rgba(226,232,240,0.78)', marginTop: 6 }}>{cluster.studentCount} students • {cluster.routeCount} routes</div>
              <div style={{ color: cluster.capacityDelta >= 0 ? '#22c55e' : '#f59e0b', marginTop: 6 }}>Capacity delta {cluster.capacityDelta}</div>
            </div>
          )) : (
            <div style={{ color: 'rgba(226,232,240,0.72)' }}>
              {hasPremiumAnalytics ? 'Cluster analytics will populate as route assignments and student localities are mapped.' : 'Upgrade to Premium to view locality clusters and route optimization insights.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value, tone = '#38bdf8' }: { label: string; value: number; tone?: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 18, background: 'rgba(15,23,42,0.55)' }}>
      <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: tone, fontSize: 28, fontWeight: 900, marginTop: 10 }}>{value}</div>
    </div>
  );
}
