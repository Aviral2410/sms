import React, { useState, useEffect } from 'react';
import { useRealtime } from './RealtimeHub';
import { Sparkles, TrendingUp, Activity } from 'lucide-react';

interface VisualData {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  color?: string;
}

export const AiVisualizer: React.FC = () => {
  const { messages } = useRealtime();
  const [data, setData] = useState<VisualData[]>([
    { label: 'Platform Activity', value: 72, trend: 'up', color: 'cyan' },
    { label: 'AI Confidence', value: 88, trend: 'stable', color: 'violet' }
  ]);

  useEffect(() => {
    // Listen for AI visualization updates
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('ai/visualize')) {
      try {
        const payload = JSON.parse(lastMsg.payload);
        if (Array.isArray(payload)) {
          setData(payload);
        }
      } catch (e) {
        console.error('Invalid AI visual payload', e);
      }
    }
  }, [messages]);

  return (
    <div className="ai-visualizer-container">
      {data.map((item, idx) => (
        <div key={idx} className="ai-stat-card glass-card">
          <div className="ai-stat-header">
            <span className="eyebrow">{item.label}</span>
            {item.trend === 'up' ? <TrendingUp size={14} className="text-cyan-400" /> : <Activity size={14} className="text-violet-400" />}
          </div>
          <div className="ai-stat-body">
            <h2 className={`neon-text-${item.color || 'cyan'}`}>{item.value}%</h2>
            <div className="ai-progress-bg">
              <div 
                className={`ai-progress-fill bg-${item.color || 'cyan'}-500`}
                style={{ width: `${item.value}%`, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
            </div>
          </div>
          <div className="ai-stat-footer">
            <Sparkles size={12} className="animate-pulse mr-1" />
            <span>AI-Driven Refresh</span>
          </div>
        </div>
      ))}
    </div>
  );
};
