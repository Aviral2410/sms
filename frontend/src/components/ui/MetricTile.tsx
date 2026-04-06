import React from 'react';
import GlassCard from './GlassCard';

interface MetricTileProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
}

const MetricTile = ({ label, value, icon, trend, className = '' }: MetricTileProps) => {
  return (
    <GlassCard className={`metric-tile ${className}`}>
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        {trend && (
          <span className={`metric-trend ${trend.isUp ? 'trend-up' : 'trend-down'}`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="metric-body">
        <strong className="metric-value">{value}</strong>
        <span className="metric-label">{label}</span>
      </div>
    </GlassCard>
  );
};

export default MetricTile;
