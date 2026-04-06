import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, List, Activity, LayoutGrid, CheckCircle2, 
  ChevronRight, BarChart3, Users, Building2 
} from 'lucide-react';
import { McpAiResponse } from '../lib/mcp';
import { AiRichText } from './ai/AiRichText';

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
    if (typeof val === 'number') return <span className="font-mono font-black text-cyan-400">{val.toLocaleString()}</span>;
    if (typeof val === 'boolean') return val ? <CheckCircle2 size={14} className="text-emerald-400 inline" /> : <Activity size={14} className="text-rose-400 inline" />;
    return <span style={{ color: 'var(--text-main)' }}>{String(val)}</span>;
  };

  const renderRecord = (record: any, index: number) => {
    const keys = Object.keys(record).filter(k => !k.toLowerCase().includes('id') && k !== 'createdAt' && k !== 'updatedAt');
    return (
      <motion.div 
        key={index}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-3 mb-2 rounded-xl transition-all group"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <ChevronRight size={14} />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {keys.slice(0, 4).map(key => (
              <div key={key} className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold block truncate" style={{ color: 'var(--text-muted)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-soft)' }}>{String(record[key])}</span>
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
        <div key={key} className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <List size={14} className="text-indigo-400" />
            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md border border-indigo-500/30">{value.length}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {value.map((item, idx) => renderRecord(item, idx))}
          </div>
        </div>
      );
    }

    // If it's a "summarizedCollection" structure from the MCP server
    if (value && typeof value === 'object' && 'preview' in value && Array.isArray(value.preview)) {
      return (
        <div key={key} className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-cyan-400" />
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
            {value.total && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-md border border-cyan-500/30">{value.total} total</span>
            )}
          </div>
          <div className="space-y-2">
            {value.preview.map((item: any, idx: number) => renderRecord(item, idx))}
            {value.hasMore && (
                <div className="text-[10px] italic text-center py-1" style={{ color: 'var(--text-muted)' }}>
                  Showing top results... View more in settings.
                </div>
            )}
          </div>
        </div>
      );
    }

    // If it's a flat object (like totals or dashboard stats)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const stats = Object.entries(value).filter(([_, v]) => typeof v === 'number' || typeof v === 'string');
      if (stats.length === 0) return null;

      return (
        <div key={key} className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-violet-400" />
            <span className="text-[11px] font-black text-violet-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.map(([k, v]) => (
              <div key={k} className="p-3 rounded-2xl transition-all" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }}>
                <span className="text-[10px] uppercase font-black block mb-1" style={{ color: 'var(--text-muted)' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                <div className="text-lg font-black tracking-tight" style={{ color: 'var(--text-strong)' }}>
                  {renderValue(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default: Single value
    if (typeof value !== 'object') {
       return (
         <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
           <span className="text-xs font-medium uppercase truncate mr-4" style={{ color: 'var(--text-dim)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
           <span className="text-sm font-bold" style={{ color: 'var(--text-strong)' }}>{renderValue(value)}</span>
         </div>
       );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* The textual answer always shows first as the primary context */}
      <AiRichText content={answer} className="text-sm md:text-base" />

      <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
        {Object.entries(data).map(([key, value]) => renderSection(key, value))}
      </div>
    </div>
  );
};
