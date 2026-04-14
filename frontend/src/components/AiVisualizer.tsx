import React, { useState, useEffect } from 'react';
import { useRealtime } from './RealtimeHub';
import { Sparkles, TrendingUp, Activity, Minus } from 'lucide-react';
import './ai-panels.css';

interface VisualData {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  color?: 'cyan' | 'violet' | 'emerald' | 'amber';
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
    <div className="ai-visualizer-grid">
      {data.map((item, idx) => (
        <div key={idx} className="ai-panel-card ai-stat-card" data-tone={item.color || 'cyan'}>
          <div className="ai-stat-header">
            <div className="ai-stat-title">
              <span className="ai-stat-kicker">
                <Sparkles size={12} />
                AI Signal
              </span>
              <span className="ai-stat-name">{item.label}</span>
            </div>
            <div className={`ai-stat-trend ${item.trend === 'up' ? 'is-up' : item.trend === 'down' ? 'is-down' : 'is-stable'}`}>
              {item.trend === 'up' ? <TrendingUp size={16} /> : item.trend === 'down' ? <Activity size={16} /> : <Minus size={16} />}
            </div>
          </div>

          <div className="ai-stat-body">
            <div className="ai-stat-value-row">
              <h2 className="ai-stat-value">{item.value}%</h2>
              <span className="ai-stat-caption">
                {item.trend === 'up' ? 'Improving signal' : item.trend === 'down' ? 'Needs review' : 'Holding steady'}
              </span>
            </div>
            <div className="ai-progress-track">
              <div 
                className="ai-progress-fill"
                data-tone={item.color || 'cyan'}
                style={{ width: `${item.value}%`, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
            </div>
          </div>

          <div className="ai-stat-footer">
            <Sparkles size={12} className="animate-pulse" />
            <span>Live refresh from AI events</span>
          </div>
        </div>
      ))}
    </div>
  );
};
