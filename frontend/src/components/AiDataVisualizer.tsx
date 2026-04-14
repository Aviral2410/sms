import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, List, Activity, CheckCircle2, 
  ChevronRight, BarChart3 
} from 'lucide-react';
import { McpAiResponse } from '../lib/mcp';
import { AiRichText } from './ai/AiRichText';
import './ai-panels.css';

interface AiDataVisualizerProps {
  response: McpAiResponse;
  compact?: boolean;
}

export const AiDataVisualizer: React.FC<AiDataVisualizerProps> = ({ response, compact }) => {
  const { data, answer } = response;

  if (!data || Object.keys(data).length === 0) {
    return (
      <AiRichText content={answer} className="text-sm md:text-base" />
    );
  }

  const renderValue = (val: any) => {
    if (typeof val === 'number') return <span className="is-number">{val.toLocaleString()}</span>;
    if (typeof val === 'boolean') return val ? <CheckCircle2 size={14} className="inline text-emerald-400" /> : <Activity size={14} className="inline text-rose-400" />;
    return <span>{String(val)}</span>;
  };

  const renderRecord = (record: any, index: number) => {
    const keys = Object.keys(record).filter(k => !k.toLowerCase().includes('id') && k !== 'createdAt' && k !== 'updatedAt');
    return (
      <motion.div 
        key={index}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="ai-data-record"
      >
        <div className="ai-data-record-top">
          <div className="ai-data-record-icon">
            <ChevronRight size={14} />
          </div>
          <div className="ai-data-record-grid">
            {keys.slice(0, 4).map(key => (
              <div key={key} className="ai-data-record-field">
                <span className="ai-data-record-field-label">{formatLabel(key)}</span>
                <span className="ai-data-record-field-value">{String(record[key])}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSection = (key: string, value: any) => {
    // If it's an array of objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      return (
        <section key={key} className="ai-data-section">
          <div className="ai-data-section-title">
            <List size={14} className="is-indigo" />
            <span className="is-indigo">{formatLabel(key)}</span>
            <span className="ai-data-badge">{value.length}</span>
          </div>
          <div className="ai-data-record-list is-scrollable custom-scrollbar">
            {value.map((item, idx) => renderRecord(item, idx))}
          </div>
        </section>
      );
    }

    // If it's a "summarizedCollection" structure from the MCP server
    if (value && typeof value === 'object' && 'preview' in value && Array.isArray(value.preview)) {
      return (
        <section key={key} className="ai-data-section">
          <div className="ai-data-section-title">
            <Database size={14} className="is-cyan" />
            <span className="is-cyan">{formatLabel(key)}</span>
            {value.total && (
              <span className="ai-data-badge">{value.total} total</span>
            )}
          </div>
          <div className="ai-data-record-list">
            {value.preview.map((item: any, idx: number) => renderRecord(item, idx))}
            {value.hasMore && (
              <div className="ai-data-hint">Showing top results. Open the source module for the full list.</div>
            )}
          </div>
        </section>
      );
    }

    // If it's a flat object (like totals or dashboard stats)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const stats = Object.entries(value).filter(([_, v]) => typeof v === 'number' || typeof v === 'string');
      if (stats.length === 0) return null;

      return (
        <section key={key} className="ai-data-section">
          <div className="ai-data-section-title">
            <BarChart3 size={14} className="is-violet" />
            <span className="is-violet">{formatLabel(key)}</span>
          </div>
          <div className="ai-data-stat-grid">
            {stats.map(([k, v]) => (
              <div key={k} className="ai-data-stat-card">
                <span className="ai-data-stat-label">{formatLabel(k)}</span>
                <div className="ai-data-stat-value">
                  {renderValue(v)}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // Default: Single value
    if (typeof value !== 'object') {
       return (
         <div key={key} className="ai-data-value-row">
           <span className="ai-data-value-label">{formatLabel(key)}</span>
           <span className="ai-data-value-result">{renderValue(value)}</span>
         </div>
       );
    }

    return null;
  };

  return (
    <div className={`ai-data-visualizer${compact ? ' is-compact' : ''}`}>
      <AiRichText content={answer} className="text-sm md:text-base" />

      <div className="ai-data-divider">
        {Object.entries(data).map(([key, value]) => renderSection(key, value))}
      </div>
    </div>
  );
};

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}
