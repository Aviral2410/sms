import React, { useState, useEffect } from 'react';
import { useRealtime } from './RealtimeHub';
import { Zap, Brain, Bell, Sparkles } from 'lucide-react';

interface Insight {
  id: string;
  type: 'attendance' | 'performance' | 'billing' | 'system';
  message: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
}

export const AiNotificationCenter: React.FC = () => {
  const { lastMessage, isConnected } = useRealtime();
  const [insights, setInsights] = useState<Insight[]>([
    { id: '1', type: 'system', message: 'AI Engine initialized and monitoring tenant streams.', impact: 'low', timestamp: new Date().toISOString() },
    { id: '2', type: 'performance', message: 'Predicted 12% improvement in student engagement for Class 10A.', impact: 'medium', timestamp: new Date().toISOString() },
  ]);

  useEffect(() => {
    if (lastMessage?.topic?.includes('ai/insights')) {
      const newInsight: Insight = {
        id: Math.random().toString(36).slice(2, 9),
        type: lastMessage.payload.type || 'system',
        message: lastMessage.payload.message || 'Incoming AI Stream...',
        impact: lastMessage.payload.impact || 'low',
        timestamp: new Date().toISOString(),
      };
      setInsights(prev => [newInsight, ...prev].slice(0, 5));
    }
  }, [lastMessage]);

  return (
    <article className="ai-notification-center glass-card">
      <div className="section-title">
        <span className="eyebrow ai-engine-badge">
          <Brain size={14} className="pulse-icon" />
          AI Engine {isConnected ? 'Live' : 'Syncing...'}
        </span>
        <h3>Real-time Insights</h3>
      </div>

      <div className="insight-stack">
        {insights.map((insight) => (
          <div key={insight.id} className={`insight-card impact-${insight.impact}`}>
            <div className="insight-header">
              {insight.type === 'performance' ? <Sparkles size={16} /> : <Zap size={16} />}
              <span className="insight-type">{insight.type}</span>
              <span className="insight-time">{new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="insight-message">{insight.message}</p>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div className="reconnect-hint">
          <Bell size={12} />
          Connecting to SaaS Real-time Hub...
        </div>
      )}
    </article>
  );
};
