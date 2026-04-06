import { useEffect, useState } from 'react';
import { useRealtime } from '../components/RealtimeHub';
import { TransportVehiclePositionResponse, TransportPickupLogResponse } from '../lib/api';

export function useTransportRealtime(schoolId: string, routeId?: string) {
  const { messages, subscribe } = useRealtime();
  const [latestPosition, setLatestPosition] = useState<TransportVehiclePositionResponse | null>(null);
  const [latestPickup, setLatestPickup] = useState<TransportPickupLogResponse | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    
    const gpsTopic = routeId 
      ? `transport/gps/${schoolId}/${routeId}` 
      : `transport/gps/${schoolId}/#`;
    
    const pickupTopic = routeId 
      ? `transport/pickup/${schoolId}/${routeId}` 
      : `transport/pickup/${schoolId}/#`;

    subscribe(gpsTopic);
    subscribe(pickupTopic);
  }, [schoolId, routeId, subscribe]);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    
    if (last.topic.startsWith(`transport/gps/${schoolId}`)) {
      setLatestPosition(last.payload);
    } else if (last.topic.startsWith(`transport/pickup/${schoolId}`)) {
      setLatestPickup(last.payload);
    }
  }, [messages, schoolId]);

  return { latestPosition, latestPickup };
}
