import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, List, Activity, CheckCircle2, 
  ChevronRight, BarChart3 
} from 'lucide-react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';
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

  const widgetsRaw = (data as any)?.widgets;
  const widgets = Array.isArray(widgetsRaw) ? (widgetsRaw as any[]).slice(0, 2) : [];
  const dataWithoutWidgets: any = (() => {
    if (!widgets.length) return data;
    const copy: any = { ...(data as any) };
    delete copy.widgets;
    return copy;
  })();

  const renderValue = (val: any) => {
    if (typeof val === 'number') return <span className="is-number">{val.toLocaleString()}</span>;
    if (typeof val === 'boolean') return val ? <CheckCircle2 size={14} className="inline text-emerald-400" /> : <Activity size={14} className="inline text-rose-400" />;
    return <span>{String(val)}</span>;
  };

  const renderWidget = (widget: any, idx: number) => {
    const type = typeof widget?.type === 'string' ? widget.type : '';
    const title = typeof widget?.title === 'string' ? widget.title : '';

    if (type === 'cards' && Array.isArray(widget?.items)) {
      return (
        <section key={`w-${idx}`} className="ai-data-section">
          <div className="ai-data-section-title">
            <BarChart3 size={14} className="is-violet" />
            <span className="is-violet">{title || 'At a glance'}</span>
          </div>
          <div className="ai-data-stat-grid">
            {widget.items.slice(0, 6).map((item: any, i: number) => (
              <div key={i} className="ai-data-stat-card">
                <span className="ai-data-stat-label">{formatLabel(String(item?.label ?? `Item ${i + 1}`))}</span>
                <div className="ai-data-stat-value">{renderValue(item?.value)}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (type === 'chart' && Array.isArray(widget?.points)) {
      const chartType = widget?.chartType === 'bar' ? 'bar' : 'line';
      const points = widget.points.slice(0, 60);
      const xKey = typeof widget?.xKey === 'string' ? widget.xKey : 'label';
      const yKey = typeof widget?.yKey === 'string' ? widget.yKey : 'y';

      return (
        <section key={`w-${idx}`} className="ai-data-section">
          <div className="ai-data-section-title">
            <BarChart3 size={14} className="is-cyan" />
            <span className="is-cyan">{title || 'Chart'}</span>
          </div>
          <div className="ai-data-record-list" style={{ height: compact ? 180 : 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey={xKey} stroke="rgba(148,163,184,0.85)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(148,163,184,0.85)" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey={yKey} fill="#22d3ee" />
                </BarChart>
              ) : (
                <LineChart data={points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey={xKey} stroke="rgba(148,163,184,0.85)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(148,163,184,0.85)" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey={yKey} stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      );
    }

    if (type === 'table' && Array.isArray(widget?.rows)) {
      const rows = widget.rows.slice(0, compact ? 6 : 10);
      return (
        <section key={`w-${idx}`} className="ai-data-section">
          <div className="ai-data-section-title">
            <Database size={14} className="is-indigo" />
            <span className="is-indigo">{title || 'Details'}</span>
            <span className="ai-data-badge">{rows.length}</span>
          </div>
          <div className="ai-data-record-list is-scrollable custom-scrollbar">
            {rows.map((row: any, i: number) => renderRecord(row, i))}
          </div>
        </section>
      );
    }

    return null;
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
        {widgets.length ? widgets.map(renderWidget) : null}
        {Object.entries(dataWithoutWidgets).map(([key, value]) => renderSection(key, value))}
      </div>
    </div>
  );
};

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}
