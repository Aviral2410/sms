import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { McpAiResponse } from '../lib/mcp';
import { AiDataVisualizer } from './AiDataVisualizer';
import { AiRichText } from './ai/AiRichText';
import { useStore } from '../store/useStore';
import './ai-panels.css';

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
  const { session } = useStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/mcp-http/insights/ask', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': session.token ? `Bearer ${session.token}` : ''
        },
        body: JSON.stringify({
          role: session.role?.toLowerCase() || 'platform_admin',
          schoolId: session.schoolId,
          email: session.email,
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
    <article className="ai-panel-card ai-widget-card">
      <div className="ai-widget-card-header">
        <div className="ai-widget-card-title">
          <span className="ai-widget-card-eyebrow">
            <Sparkles size={12} />
            AI Insight
          </span>
          <h3>{title}</h3>
        </div>
        <div className="ai-widget-card-actions">
          {hasDetailedData && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="ai-widget-icon-button"
              title={isExpanded ? "Show Less" : "Show Details"}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button 
            onClick={() => void fetchData()} 
            disabled={loading}
            className="ai-widget-icon-button"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="min-h-[60px]">
        {loading ? (
          <div className="ai-widget-loading">
            <Loader size={16} className="animate-spin" />
            <span className="text-xs font-mono">Analyzing institutional data...</span>
          </div>
        ) : error ? (
          <div className="ai-widget-error">
            <AlertCircle size={16} />
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <div className="ai-widget-stack">
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
      
      <p className="ai-widget-query">
        " {query} "
      </p>
    </article>
  );
};
