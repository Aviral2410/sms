import React, { useEffect, useMemo, useState } from 'react';
import { ApiError, request } from '../../lib/api';
import { useStore } from '../../store/useStore';

type TripStop = {
  tripStopId: string;
  stopId: string;
  stopName: string;
  sequenceOrder: number;
  plannedEta?: string;
  actualArrivalAt?: string;
  actualDepartureAt?: string;
  stopStatus: string;
  occupancyAfterStop?: number;
  etaMinutes?: number;
  haltReason?: string;
};

type TripEvent = {
  eventId: string;
  eventType: string;
  eventStatus?: string;
  eventMessage?: string;
  actorName?: string;
  createdAt: string;
};

type Trip = {
  tripId: string;
  routeId: string;
  routeName: string;
  vehicleNumber?: string;
  vehicleType?: string;
  shiftType: string;
  tripState: string;
  occupancyCount?: number;
  capacity?: number;
  gpsStatus: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentSpeed?: number;
  nextStopId?: string;
  nextStopName?: string;
  etaToSchoolMinutes?: number;
  stops: TripStop[];
  recentEvents: TripEvent[];
};

type TripStatusResponse = {
  tripId: string;
  tripState: string;
  message: string;
  updatedAt: string;
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(7, 14, 24, 0.75)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.16)',
};

export default function TransportDriverConsolePage() {
  const { session } = useStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const activeTrip = useMemo(() => trips[0] || null, [trips]);

  const loadTrips = async () => {
    try {
      const response = await request<Trip[]>('/school-ops/transport/trips/my-active');
      setTrips(response);
      setLocked(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setLocked(true);
        setTrips([]);
        setMessage(null);
        return;
      }
      setLocked(false);
      setMessage(error instanceof Error ? error.message : 'Failed to load active trip.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    const interval = window.setInterval(loadTrips, 15000);
    return () => window.clearInterval(interval);
  }, [session.tenantId]);

  if (locked) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#38bdf8' }}>Driver Console Locked</div>
        <h2 style={{ margin: '8px 0 0', color: 'white' }}>Transport features are not enabled on the current plan</h2>
      </div>
    );
  }

  const runTripAction = async (path: string, body?: unknown) => {
    if (!activeTrip) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await request<TripStatusResponse>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      setMessage(response.message);
      await loadTrips();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const pushGps = async () => {
    if (!activeTrip || !navigator.geolocation) return;
    setBusy(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await request<TripStatusResponse>(`/school-ops/transport/trips/${activeTrip.tripId}/gps`, {
            method: 'POST',
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed: position.coords.speed ?? 0,
              heading: position.coords.heading ?? 0,
              accuracyMeters: position.coords.accuracy ?? 0,
              source: 'MOBILE',
            }),
          });
          setMessage(response.message);
          await loadTrips();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'GPS update failed.');
        } finally {
          setBusy(false);
        }
      },
      (error) => {
        setBusy(false);
        setMessage(error.message || 'Location permission denied.');
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  if (loading) {
    return <div style={{ color: 'var(--text-strong)' }}>Loading driver console...</div>;
  }

  if (!activeTrip) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#38bdf8' }}>Driver Console</div>
        <h2 style={{ margin: '8px 0 0', color: 'white' }}>No active trip assigned</h2>
        <p style={{ color: 'rgba(226,232,240,0.75)' }}>Your route assignment will appear here once transport management publishes today’s duty.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ ...cardStyle, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#38bdf8' }}>Driver Console</div>
            <h2 style={{ margin: '8px 0 4px', color: 'white' }}>{activeTrip.routeName}</h2>
            <div style={{ color: 'rgba(226,232,240,0.75)' }}>
              {activeTrip.shiftType} trip • {activeTrip.vehicleNumber || 'Vehicle pending'} • {activeTrip.tripState}
            </div>
          </div>
          <div style={{ minWidth: 220, color: 'rgba(226,232,240,0.78)' }}>
            <div>GPS: {activeTrip.gpsStatus}</div>
            <div>Speed: {activeTrip.currentSpeed ?? 0} km/h</div>
            <div>Occupancy: {activeTrip.occupancyCount ?? 0}/{activeTrip.capacity ?? 0}</div>
            <div>Next stop: {activeTrip.nextStopName || 'All stops completed'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/onboard`)} disabled={busy}>Mark On-Board</button>
          <button onClick={() => runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/start`)} disabled={busy}>Start Trip</button>
          <button onClick={() => runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/end`)} disabled={busy}>End Trip</button>
          <button onClick={() => runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/offboard`)} disabled={busy}>Mark Off-Board</button>
          <button onClick={pushGps} disabled={busy}>Push GPS</button>
          <button
            onClick={() => {
              const reason = window.prompt('Reason for halt?');
              if (reason) runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/halt`, { reason });
            }}
            disabled={busy}
          >
            Halt Reason
          </button>
          <button
            onClick={() => {
              const delay = window.prompt('Delay in minutes?');
              const reason = window.prompt('Delay reason?');
              if (delay && reason) runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/delay`, { delayMinutes: Number(delay), reason });
            }}
            disabled={busy}
          >
            Delay Update
          </button>
          <button
            onClick={() => {
              const messageText = window.prompt('Emergency message?') || 'Emergency assistance required.';
              runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/sos`, { message: messageText });
            }}
            disabled={busy}
            style={{ background: '#7f1d1d', color: 'white' }}
          >
            SOS Emergency
          </button>
        </div>

        {message && <div style={{ color: '#f8fafc', background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '10px 14px' }}>{message}</div>}
      </section>

      <section style={{ display: 'grid', gap: 20, gridTemplateColumns: '2fr 1fr' }}>
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, color: 'white', marginBottom: 12 }}>Route Stops</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {activeTrip.stops.map((stop) => (
              <div key={stop.tripStopId} style={{ padding: 14, borderRadius: 16, background: 'rgba(15,23,42,0.55)', color: 'rgba(226,232,240,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong style={{ color: 'white' }}>{stop.sequenceOrder}. {stop.stopName}</strong>
                  <span>{stop.stopStatus}</span>
                </div>
                <div style={{ marginTop: 6 }}>ETA: {stop.etaMinutes ?? '-'} mins</div>
                {stop.haltReason && <div style={{ marginTop: 6, color: '#fbbf24' }}>Halt reason: {stop.haltReason}</div>}
                {stop.stopStatus !== 'COMPLETED' && (
                  <button
                    onClick={() => runTripAction(`/school-ops/transport/trips/${activeTrip.tripId}/stops/${stop.tripStopId}/complete`)}
                    disabled={busy}
                    style={{ marginTop: 10 }}
                  >
                    Complete Stop
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 800, color: 'white' }}>Trip Timeline</div>
          {activeTrip.recentEvents.map((event) => (
            <div key={event.eventId} style={{ padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.55)' }}>
              <div style={{ color: 'white', fontWeight: 700 }}>{event.eventType.replace(/_/g, ' ')}</div>
              <div style={{ color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>{event.eventMessage}</div>
              <div style={{ color: 'rgba(148,163,184,0.85)', fontSize: 12, marginTop: 6 }}>{new Date(event.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
