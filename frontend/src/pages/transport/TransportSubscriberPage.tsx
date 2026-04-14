import React, { useEffect, useState } from 'react';
import { ApiError, request } from '../../lib/api';
import { useStore } from '../../store/useStore';

type Preferences = {
  pickupAlert: boolean;
  schoolArrivalAlert: boolean;
  dropBoardingAlert: boolean;
  homeDropAlert: boolean;
  delayAlert: boolean;
};

type TimelineItem = {
  eventType: string;
  title: string;
  detail: string;
  occurredAt?: string;
  etaMinutes?: number;
};

type Trip = {
  routeName: string;
  vehicleNumber?: string;
  conductorName?: string;
  driverName?: string;
  tripState: string;
  nextStopName?: string;
  etaToSchoolMinutes?: number;
  currentLatitude?: number;
  currentLongitude?: number;
};

type MyTransportResponse = {
  subscriberRole: string;
  trackedStudentName?: string;
  contactAllowed: boolean;
  conductorContact?: string;
  preferences: Preferences;
  trip?: Trip;
  timeline: TimelineItem[];
};

const panel: React.CSSProperties = {
  background: 'rgba(7, 14, 24, 0.78)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.16)',
};

export default function TransportSubscriberPage() {
  const { session } = useStore();
  const [data, setData] = useState<MyTransportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const loadTransport = async () => {
    try {
      const response = await request<MyTransportResponse>('/school-ops/transport/my');
      setData(response);
      setLocked(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setLocked(true);
        setMessage(null);
        setData(null);
        return;
      }
      setLocked(false);
      setMessage(error instanceof Error ? error.message : 'Unable to load transport details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransport();
    const interval = window.setInterval(loadTransport, 15000);
    return () => window.clearInterval(interval);
  }, [session.tenantId]);

  const updatePreference = async (field: keyof Preferences, value: boolean) => {
    try {
      const response = await request<{ preferences: Preferences }>('/school-ops/transport/my/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
      setData((current) => current ? { ...current, preferences: response.preferences } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update preferences.');
    }
  };

  if (locked) {
    return (
      <div style={panel}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c' }}>Transport Tracking</div>
        <h2 style={{ margin: '8px 0 0', color: 'white' }}>Upgrade required</h2>
        <p style={{ color: 'rgba(226,232,240,0.75)' }}>Live transport tracking, pickup alerts, and drop notifications are available in the Basic and Premium plans.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ color: 'var(--text-strong)' }}>Loading transport view...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ ...panel, display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22d3ee' }}>My Transport</div>
          <h2 style={{ margin: '8px 0 4px', color: 'white' }}>{data?.trackedStudentName || 'Assigned student'}</h2>
          <div style={{ color: 'rgba(226,232,240,0.75)' }}>{data?.subscriberRole} view</div>
        </div>

        {data?.trip ? (
          <div style={{ display: 'grid', gap: 10, color: 'rgba(226,232,240,0.78)' }}>
            <div>Route: {data.trip.routeName}</div>
            <div>Vehicle: {data.trip.vehicleNumber || 'Pending'}</div>
            <div>Status: {data.trip.tripState}</div>
            <div>Next stop: {data.trip.nextStopName || 'In transit'}</div>
            <div>ETA: {data.trip.etaToSchoolMinutes ?? '-'} mins</div>
            <div>Driver: {data.trip.driverName || 'Pending'}</div>
            <div>Conductor: {data.trip.conductorName || 'Pending'}</div>
            {data.contactAllowed && data.conductorContact && <div>Support contact: {data.conductorContact}</div>}
          </div>
        ) : (
          <div style={{ color: 'rgba(226,232,240,0.75)' }}>No active morning or evening trip is visible right now.</div>
        )}

        {message && <div style={{ color: 'white', background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '10px 14px' }}>{message}</div>}
      </section>

      <section style={{ display: 'grid', gap: 20, gridTemplateColumns: '1.1fr 1fr' }}>
        <div style={panel}>
          <div style={{ fontWeight: 800, color: 'white', marginBottom: 12 }}>Trip Timeline</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {data?.timeline?.length ? data.timeline.map((item, index) => (
              <div key={`${item.eventType}-${index}`} style={{ padding: 14, borderRadius: 16, background: 'rgba(15,23,42,0.55)' }}>
                <div style={{ color: 'white', fontWeight: 700 }}>{item.title || item.eventType}</div>
                <div style={{ color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>{item.detail}</div>
                {item.etaMinutes != null && <div style={{ color: '#38bdf8', marginTop: 6 }}>ETA {item.etaMinutes} mins</div>}
                {item.occurredAt && <div style={{ color: 'rgba(148,163,184,0.85)', fontSize: 12, marginTop: 6 }}>{new Date(item.occurredAt).toLocaleString()}</div>}
              </div>
            )) : (
              <div style={{ color: 'rgba(226,232,240,0.72)' }}>Trip events will appear here when the assigned transport starts moving.</div>
            )}
          </div>
        </div>

        <div style={{ ...panel, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 800, color: 'white' }}>Notification Preferences</div>
          {data && (Object.entries(data.preferences) as Array<[keyof Preferences, boolean]>).map(([key, value]) => (
            <label key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.55)', color: 'rgba(226,232,240,0.82)' }}>
              <span>{key}</span>
              <input type="checkbox" checked={value} onChange={(event) => updatePreference(key, event.target.checked)} />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
