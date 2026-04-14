import React, { useEffect, useMemo, useState } from 'react';
import { ApiError, request } from '../../lib/api';
import { useStore } from '../../store/useStore';

type TripStop = {
  tripStopId: string;
  stopId: string;
  stopName: string;
  sequenceOrder: number;
  stopStatus: string;
  etaMinutes?: number;
};

type TripEvent = {
  eventId: string;
  eventType: string;
  eventMessage?: string;
  createdAt: string;
};

type Trip = {
  tripId: string;
  routeId: string;
  routeName: string;
  vehicleNumber?: string;
  shiftType: string;
  tripState: string;
  occupancyCount?: number;
  capacity?: number;
  nextStopName?: string;
  stops: TripStop[];
  recentEvents: TripEvent[];
};

type BoardingResponse = {
  studentName?: string;
  boardingState: string;
  createdAt: string;
};

type VoiceBoardingResponse = {
  transcript: string;
  appliedCount: number;
  rejectedCount: number;
};

const shellCard: React.CSSProperties = {
  background: 'rgba(7, 14, 24, 0.78)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.16)',
};

export default function TransportConductorPanelPage() {
  const { session } = useStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [studentUserId, setStudentUserId] = useState('');
  const [boardingState, setBoardingState] = useState('BOARDED');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const trip = useMemo(() => trips[0] || null, [trips]);
  const activeStop = useMemo(() => trip?.stops.find((stop) => stop.stopStatus !== 'COMPLETED') || trip?.stops[0] || null, [trip]);

  const loadTrips = async () => {
    try {
      const response = await request<Trip[]>('/school-ops/transport/trips/my-active');
      setTrips(response);
      setLocked(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setLocked(true);
        setTrips([]);
        setStatusMessage(null);
        return;
      }
      setLocked(false);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to load conductor panel.');
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
      <div style={shellCard}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c' }}>Conductor Panel Locked</div>
        <h2 style={{ margin: '8px 0 0', color: 'white' }}>Transport features are not enabled on the current plan</h2>
      </div>
    );
  }

  const post = async <T,>(path: string, body?: unknown) => {
    setBusy(true);
    setStatusMessage(null);
    try {
      const response = await request<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      await loadTrips();
      return response;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Action failed.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-strong)' }}>Loading conductor panel...</div>;
  }

  if (!trip) {
    return (
      <div style={shellCard}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c' }}>Conductor Panel</div>
        <h2 style={{ margin: '8px 0 0', color: 'white' }}>No active trip available</h2>
      </div>
    );
  }

  const handleBoarding = async () => {
    if (!studentUserId || !activeStop) {
      setStatusMessage('Enter the student user ID and keep an active stop selected.');
      return;
    }
    const response = await post<BoardingResponse>(`/school-ops/transport/trips/${trip.tripId}/boarding`, {
      studentUserId,
      tripStopId: activeStop.tripStopId,
      stopId: activeStop.stopId,
      boardingState,
      verificationMode: 'MANUAL',
    });
    if (response) {
      setStatusMessage(`${response.studentName || 'Student'} marked ${response.boardingState.toLowerCase()}.`);
      setStudentUserId('');
    }
  };

  const handleVoiceBoarding = async () => {
    if (!voiceTranscript.trim()) return;
    const response = await post<VoiceBoardingResponse>(`/school-ops/transport/trips/${trip.tripId}/boarding/voice`, {
      transcript: voiceTranscript,
    });
    if (response) {
      setStatusMessage(`Voice processed. Applied ${response.appliedCount}, rejected ${response.rejectedCount}.`);
      setVoiceTranscript('');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ ...shellCard, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fb923c' }}>Conductor Panel</div>
            <h2 style={{ margin: '8px 0 4px', color: 'white' }}>{trip.routeName}</h2>
            <div style={{ color: 'rgba(226,232,240,0.75)' }}>{trip.vehicleNumber || 'Vehicle pending'} • {trip.shiftType} • {trip.tripState}</div>
          </div>
          <div style={{ color: 'rgba(226,232,240,0.78)' }}>
            <div>Current stop: {activeStop?.stopName || 'None'}</div>
            <div>Next ETA: {activeStop?.etaMinutes ?? '-'} mins</div>
            <div>Occupancy: {trip.occupancyCount ?? 0}/{trip.capacity ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => post(`/school-ops/transport/trips/${trip.tripId}/onboard`)} disabled={busy}>Mark On-Board</button>
          <button onClick={() => activeStop && post(`/school-ops/transport/trips/${trip.tripId}/stops/${activeStop.tripStopId}/complete`)} disabled={busy || !activeStop}>Complete Stop</button>
          <button
            onClick={() => {
              const reason = window.prompt('Delay reason?');
              const delay = window.prompt('Delay in minutes?');
              if (reason && delay) post(`/school-ops/transport/trips/${trip.tripId}/delay`, { delayMinutes: Number(delay), reason });
            }}
            disabled={busy}
          >
            Delay Update
          </button>
          <button
            onClick={() => {
              const reason = window.prompt('Halt reason?');
              if (reason) post(`/school-ops/transport/trips/${trip.tripId}/halt`, { reason });
            }}
            disabled={busy}
          >
            Halt Reason
          </button>
          <button
            onClick={() => {
              const message = window.prompt('Emergency message?') || 'Conductor emergency alert';
              post(`/school-ops/transport/trips/${trip.tripId}/sos`, { message });
            }}
            disabled={busy}
            style={{ background: '#7f1d1d', color: 'white' }}
          >
            Raise Alarm
          </button>
        </div>

        {statusMessage && <div style={{ color: 'white', background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '10px 14px' }}>{statusMessage}</div>}
      </section>

      <section style={{ display: 'grid', gap: 20, gridTemplateColumns: '1.3fr 1fr 1fr' }}>
        <div style={{ ...shellCard, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 800, color: 'white' }}>Manual Boarding</div>
          <input value={studentUserId} onChange={(event) => setStudentUserId(event.target.value)} placeholder="Student user ID / scan result" />
          <select value={boardingState} onChange={(event) => setBoardingState(event.target.value)}>
            <option value="BOARDED">Boarded</option>
            <option value="ABSENT">Absent</option>
            <option value="DROPPED">Dropped</option>
            <option value="NO_SHOW">No Show</option>
          </select>
          <button onClick={handleBoarding} disabled={busy || !activeStop}>Submit Boarding Update</button>
        </div>

        <div style={{ ...shellCard, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 800, color: 'white' }}>Voice Boarding</div>
          <textarea value={voiceTranscript} onChange={(event) => setVoiceTranscript(event.target.value)} rows={6} placeholder='Example: "Aarav boarded. Meera absent today."' />
          <button onClick={handleVoiceBoarding} disabled={busy || !voiceTranscript.trim()}>Process Voice Update</button>
        </div>

        <div style={{ ...shellCard, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 800, color: 'white' }}>Trip Timeline</div>
          {trip.recentEvents.map((event) => (
            <div key={event.eventId} style={{ padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.55)' }}>
              <div style={{ color: 'white', fontWeight: 700 }}>{event.eventType.replace(/_/g, ' ')}</div>
              <div style={{ color: 'rgba(226,232,240,0.72)', marginTop: 4 }}>{event.eventMessage}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={shellCard}>
        <div style={{ fontWeight: 800, color: 'white', marginBottom: 12 }}>Stop List</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {trip.stops.map((stop) => (
            <div key={stop.tripStopId} style={{ padding: 14, borderRadius: 16, background: activeStop?.tripStopId === stop.tripStopId ? 'rgba(251,146,60,0.18)' : 'rgba(15,23,42,0.55)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'white' }}>
                <strong>{stop.sequenceOrder}. {stop.stopName}</strong>
                <span>{stop.stopStatus}</span>
              </div>
              <div style={{ color: 'rgba(226,232,240,0.72)', marginTop: 6 }}>ETA: {stop.etaMinutes ?? '-'} mins</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
