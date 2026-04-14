import React, { useState, useEffect } from 'react';
import { useRealtime } from './RealtimeHub';
import { Zap, Brain, Bell, Sparkles } from 'lucide-react';
import { communicationApi, type NotificationResponse } from '../lib/api';
import { useStore } from '../store/useStore';
import './ai-panels.css';

interface Insight {
  id: string;
  type: 'attendance' | 'performance' | 'billing' | 'system';
  message: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
}

export const AiNotificationCenter: React.FC = () => {
  const { lastMessage, isConnected } = useRealtime();
  const userId = useStore((state) => state.session.userId);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    communicationApi.listNotifications(userId)
      .then((items) => {
        if (!mounted) return;
        setInsights(items.slice(0, 5).map(toInsightFromNotification));
      })
      .catch(() => {
        if (!mounted) return;
        setInsights([]);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (lastMessage?.topic?.includes('ai/insights')) {
      const newInsight: Insight = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        type: normalizeInsightType(lastMessage.payload.type),
        message: lastMessage.payload.message || 'Incoming AI Stream...',
        impact: normalizeInsightImpact(lastMessage.payload.impact),
        timestamp: new Date().toISOString(),
      };
      setInsights(prev => [newInsight, ...prev].slice(0, 5));
    }
  }, [lastMessage]);

  return (
    <article className="ai-panel-card ai-notification-center">
      <div className="ai-panel-header">
        <span className="ai-engine-badge">
          <Brain size={14} className="pulse-icon" />
          AI Engine {isConnected ? 'Live' : 'Syncing...'}
        </span>
        <h3>Real-time Insights</h3>
      </div>

      <div className="ai-insight-list">
        {insights.length === 0 ? (
          <div className="ai-insight-item" data-impact="low">
            <div className="ai-insight-item-header">
              <Zap size={16} />
              <span>system</span>
              <span className="ai-insight-item-time">now</span>
            </div>
            <p className="ai-insight-item-message">No insights yet. AI insights will appear here as data events arrive.</p>
          </div>
        ) : insights.map((insight) => (
          <div key={insight.id} className="ai-insight-item" data-impact={insight.impact}>
            <div className="ai-insight-item-header">
              {insight.type === 'performance' ? <Sparkles size={16} /> : <Zap size={16} />}
              <span>{insight.type}</span>
              <span className="ai-insight-item-time">{new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="ai-insight-item-message">{insight.message}</p>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div className="ai-reconnect-hint">
          <Bell size={12} />
          Connecting to SaaS Real-time Hub...
        </div>
      )}
    </article>
  );
};

function toInsightFromNotification(notification: NotificationResponse): Insight {
  return {
    id: notification.notificationId,
    type: notification.title.toLowerCase().includes('fee') ? 'billing' : 'system',
    message: notification.message,
    impact: notification.isRead ? 'low' : 'medium',
    timestamp: notification.createdAt,
  };
}

function normalizeInsightType(value: unknown): Insight['type'] {
  if (value === 'attendance' || value === 'performance' || value === 'billing' || value === 'system') {
    return value;
  }
  return 'system';
}

function normalizeInsightImpact(value: unknown): Insight['impact'] {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'low';
}
