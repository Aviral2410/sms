import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { McpAiResponse } from '../lib/mcp';
import { AiDataVisualizer } from './AiDataVisualizer';
import { AiRichText } from './ai/AiRichText';

interface DynamicAiWidgetProps {
  id: string;
  query: string;
  title: string;
}

export const DynamicAiWidget: React.FC<DynamicAiWidgetProps> = ({ query, title }) => {
  const [response, setResponse] = useState<McpAiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/mcp-http/insights/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'platform_admin',
          question: query
        })
      });
      if (!res.ok) throw new Error('Failed to fetch AI insights');
      const result = await res.json();
      setResponse(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading widget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [query]);

  const hasDetailedData = response?.data && Object.keys(response.data).length > 0;

  return (
    <article className="dashboard-card glass-card p-6 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Sparkles size={40} className="text-cyan-400" />
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1 block">AI Insight</span>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-strong)' }}>{title}</h3>
        </div>
        <div className="flex gap-2">
          {hasDetailedData && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-1.5 rounded-lg transition-all"
              style={{ background: 'var(--surface-elevated)', color: 'var(--text-dim)', border: '1px solid var(--glass-border)' }}
              title={isExpanded ? "Show Less" : "Show Details"}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button 
            onClick={() => void fetchData()} 
            disabled={loading}
            className="p-1.5 rounded-lg transition-all"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-dim)', border: '1px solid var(--glass-border)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="min-h-[60px]">
        {loading ? (
          <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-muted)' }}>
            <Loader size={16} className="animate-spin" />
            <span className="text-xs font-mono">Analyzing institutional data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-rose-400/80 py-4">
            <AlertCircle size={16} />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`ai-response-shell p-4 md:p-5 ${isExpanded ? 'pb-5' : ''}`}
              style={isExpanded ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined}
            >
              <AiRichText
                content={response?.answer || 'No data'}
                className="text-sm md:text-base"
              />
            </div>
            
            {isExpanded && response && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 ai-response-shell p-4 md:p-5">
                <AiDataVisualizer response={response} compact />
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="text-[10px] mt-4 font-medium italic" style={{ color: 'var(--text-muted)' }}>
        " {query} "
      </p>
    </article>
  );
};
