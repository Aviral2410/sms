import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { useStore } from '../store/useStore';

interface RealtimeContextType {
  client: MqttClient | null;
  isConnected: boolean;
  messages: any[];
  lastMessage: any;
  subscribe: (topic: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeHub: React.FC<{ children: ReactNode; tenantId?: string }> = ({ children, tenantId }) => {
  const { session } = useStore();
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const lastMessage = messages[messages.length - 1] || null;

  useEffect(() => {
    const isSuperAdmin = session.role === 'SUPER_ADMIN' || session.role === 'PLATFORM_ADMIN';
    if (!tenantId && !isSuperAdmin) return;

    // In a real SaaS, this would be a secure WebSocket endpoint for EMQX
    const mqttHost = window.location.hostname;
    const mqttPort = 8087; // Mapped host port for EMQX WebSocket
    const mqttUrl = `ws://${mqttHost}:${mqttPort}/mqtt`;

    const mqttClient = mqtt.connect(mqttUrl, {
      clientId: `frontend_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    mqttClient.on('connect', () => {
      setIsConnected(true);
      
      if (tenantId) {
        mqttClient.subscribe(`school/notifications/${tenantId}`);
        mqttClient.subscribe(`ai/insights/${tenantId}`);
        mqttClient.subscribe(`ai/visualize/${tenantId}`);
      }
      
      if (isSuperAdmin) {
        mqttClient.subscribe('platform/onboarding/#');
        mqttClient.subscribe('platform/subscriptions/#');
        mqttClient.subscribe('platform/stats');
        mqttClient.subscribe('platform/logs/#');
        mqttClient.subscribe('platform/errors/#');
      }
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setMessages(prev => [...prev.slice(-19), { topic, payload, timestamp: Date.now() }]);
      } catch (e) {
        setMessages(prev => [...prev.slice(-19), { topic, payload: message.toString(), timestamp: Date.now() }]);
      }
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT Error:', err);
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, [tenantId, session.role]);

  const subscribe = (topic: string) => {
    if (client && isConnected) {
      client.subscribe(topic);
    }
  };

  return (
    <RealtimeContext.Provider value={{ client, isConnected, messages, lastMessage, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeHub');
  }
  return context;
};
