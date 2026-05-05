import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Info, Bug, Activity, Search, Filter, Trash2, Play, Pause, X, RefreshCw, Terminal, Layers, Database, Cpu } from 'lucide-react';
import { useRealtime } from '../../components/RealtimeHub';
import { mcpApi } from '../../lib/mcp';

interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  topic: string;
  details?: any;
}

const LEVELS = ['info', 'warn', 'error', 'debug'] as const;

export default function SystemLogs() {
  const { lastMessage } = useRealtime();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterService, setFilterService] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState<{ service: string; content: string } | null>(null);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  // Tabs and Streaming State
  const [activeTab, setActiveTab] = useState<'events' | 'streaming'>('events');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selectedStreamService, setSelectedStreamService] = useState<string>('');
  const [streamingLogs, setStreamingLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const FALLBACK_SERVICES = [
      { id: 'gw', service: 'api-gateway', status: 'READY' },
      { id: 'auth', service: 'auth-service', status: 'READY' },
      { id: 'onboarding', service: 'school-onboarding-service', status: 'READY' },
      { id: 'ops', service: 'school-operations-service', status: 'READY' },
      { id: 'realtime', service: 'realtime-service', status: 'READY' },
      { id: 'mcp', service: 'mcp-server', status: 'READY' },
      { id: 'finance', service: 'finance-service', status: 'READY' },
      { id: 'comm', service: 'communication-service', status: 'READY' }
    ];

    mcpApi.listServices()
      .then(data => {
        const list = (Array.isArray(data) && data.length > 0) ? data : FALLBACK_SERVICES;
        setAllServices(list);
        if (list.length > 0 && !selectedStreamService) {
          setSelectedStreamService(list[0].service);
        }
      })
      .catch(() => {
        setAllServices(FALLBACK_SERVICES);
        if (!selectedStreamService) setSelectedStreamService(FALLBACK_SERVICES[0].service);
      });
  }, []);

  // MQTT Log Listener
  useEffect(() => {
    if (isPaused) return;

    if (lastMessage) {
      const topic = String(lastMessage.topic || '').toLowerCase();
      const payload = lastMessage.payload || {};
      
      const parts = lastMessage.topic.split('/');
      const service = parts[1] || 'system';
      
      let displayMessage = `Event on ${lastMessage.topic}`;
      if (typeof payload === 'string') {
        displayMessage = payload;
      } else if (payload.message) {
        displayMessage = payload.message;
      } else if (payload.error) {
        displayMessage = payload.error;
      } else if (payload.status) {
        displayMessage = `Status update: ${payload.status}`;
      } else if (parts[2]) {
        displayMessage = `${parts[2]} event triggered`;
      }

      const level: LogEntry['level'] = (topic.includes('error') || (payload && payload.error))
        ? 'error'
        : (topic.includes('warn') || topic.includes('alert'))
          ? 'warn'
          : topic.includes('debug')
            ? 'debug'
            : 'info';

      const newLog: LogEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        timestamp: new Date().toISOString(),
        service,
        level,
        message: displayMessage,
        topic: lastMessage.topic,
        details: payload
      };
      setLogs(prev => [newLog, ...prev].slice(0, 500));
    }
  }, [lastMessage, isPaused]);

  // Log Stream (SSE) Effect
  useEffect(() => {
    if (activeTab === 'streaming' && isStreaming && selectedStreamService) {
      const url = mcpApi.getLogStreamUrl(selectedStreamService);
      const es = new EventSource(url);
      
      setStreamingLogs(prev => [...prev, `[SYSTEM] Starting stream for ${selectedStreamService}...`]);
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.log) {
            setStreamingLogs(prev => [...prev, data.log].slice(-1000));
          } else if (data.error) {
            setStreamingLogs(prev => [...prev, `[ERROR] ${data.error}`].slice(-1000));
          }
        } catch (e) {
          // Non-JSON line or raw log
          setStreamingLogs(prev => [...prev, event.data].slice(-1000));
        }
      };
      
      es.onerror = () => {
        setStreamingLogs(prev => [...prev, `[SYSTEM] Stream connection interrupted. Reconnecting...`]);
      };
      
      eventSourceRef.current = es;
      return () => {
        es.close();
        eventSourceRef.current = null;
      };
    }
  }, [activeTab, isStreaming, selectedStreamService]);

  useEffect(() => {
    if (activeTab === 'events' && !isPaused) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isPaused, activeTab]);

  useEffect(() => {
    if (activeTab === 'streaming') streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamingLogs, activeTab]);

  const services = Array.from(new Set(logs.map(log => log.service))).sort();

  const filteredLogs = logs.filter(log => {
    if (filterService !== 'all' && log.service !== filterService) return false;
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) && !log.service.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#f43f5e';
      case 'warn': return '#fbbf24';
      case 'info': return '#38bdf8';
      case 'debug': return '#94a3b8';
      default: return '#fff';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle size={14} />;
      case 'warn': return <Filter size={14} />;
      case 'info': return <Info size={14} />;
      case 'debug': return <Bug size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 20 }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
            <Cpu size={12} /> Observability Node
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>System Diagnostics</h1>
          <p style={{ color: '#8b95a2', margin: 0, fontSize: '0.9rem' }}>Real-time telemetry and continuous log streaming across the microservice mesh.</p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => setActiveTab('events')}
            style={{ 
              padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'events' ? '#6366f1' : 'transparent',
              color: activeTab === 'events' ? '#fff' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Activity size={14} /> Live Events
          </button>
          <button 
            onClick={() => setActiveTab('streaming')}
            style={{ 
              padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'streaming' ? '#6366f1' : 'transparent',
              color: activeTab === 'streaming' ? '#fff' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Terminal size={14} /> Service Logs
          </button>
        </div>
      </div>

      {activeTab === 'events' ? (
        <>
          {/* Main Content: Live Events */}
          <div style={{ display: 'flex', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input type="text" placeholder="Filter events by message or service..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px 10px 40px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
            <select value={filterService} onChange={e => setFilterService(e.target.value)} 
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', padding: '0 12px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
              <option value="all" style={{ background: '#1e293b', color: '#fff' }}>All Services</option>
              {services.map(s => <option key={s} value={s} style={{ background: '#1e293b', color: '#fff' }}>{s}</option>)}
            </select>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} 
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', padding: '0 12px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
              <option value="all" style={{ background: '#1e293b', color: '#fff' }}>All Levels</option>
              {LEVELS.map(l => <option key={l} value={l} style={{ background: '#1e293b', color: '#fff' }}>{l.toUpperCase()}</option>)}
            </select>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setIsPaused(!isPaused)} style={{ padding: '8px 16px', borderRadius: 10, background: isPaused ? '#10b981' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={() => setLogs([])} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          <div style={{ flex: 1, background: '#0b0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 20, fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: 140 }}>Timestamp</div>
              <div style={{ width: 80 }}>Level</div>
              <div style={{ width: 150 }}>Service</div>
              <div style={{ flex: 1 }}>Event Message</div>
            </div>
            
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', fontFamily: '"JetBrains Mono", monospace' }}>
              {filteredLogs.length === 0 && (
                <div style={{ padding: 24, color: '#8b95a2', fontSize: '0.9rem' }}>
                  {logs.length === 0
                    ? 'Waiting for telemetry packets...'
                    : 'No events match the current filters.'}
                </div>
              )}
              <AnimatePresence initial={false}>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      style={{ 
                        display: 'flex', gap: 20, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', zoom: 0.9,
                        fontSize: '0.85rem', alignItems: 'flex-start', cursor: 'pointer',
                        background: expandedId === log.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                      }}
                      whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div style={{ width: 140, color: '#475569', fontSize: '0.75rem', paddingTop: 2 }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 6, color: getLevelColor(log.level), fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', paddingTop: 2 }}>
                        {getLevelIcon(log.level)} {log.level}
                      </div>
                      <div style={{ width: 150, color: '#94a3b8' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>{log.service}</span>
                      </div>
                      <div style={{ flex: 1, color: log.level === 'error' ? '#fda4af' : '#e2e8f0', wordBreak: 'break-all', lineHeight: '1.4' }}>
                        {log.message}
                      </div>
                    </motion.div>
                    <AnimatePresence>
                      {expandedId === log.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: '#080c10' }}>
                          <div style={{ padding: '15px 20px 20px 240px' }}>
                            <pre style={{ margin: 0, padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', fontSize: '0.75rem' }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Main Content: Continuous Streaming */}
          <div style={{ display: 'flex', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#818cf8' }}>
                <Layers size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Active Service</label>
                <select 
                  value={selectedStreamService} 
                  onChange={e => {
                    setSelectedStreamService(e.target.value);
                    setIsStreaming(false);
                    setStreamingLogs([]);
                  }} 
                  style={{ width: '100%', maxWidth: 300, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', padding: '8px 12px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                >
                  {allServices.map(s => (
                    <option key={s.id} value={s.service}>{s.service} ({s.status})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <button 
                onClick={() => setIsStreaming(!isStreaming)} 
                style={{ 
                  padding: '10px 24px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  background: isStreaming ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                  border: isStreaming ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(16,185,129,0.2)',
                  color: isStreaming ? '#fb7185' : '#34d399',
                }}
              >
                {isStreaming ? <Pause size={16} /> : <Play size={16} />} {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
              </button>
              <button onClick={() => setStreamingLogs([])} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, background: '#05070a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ padding: '10px 20px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#8b95a2', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isStreaming ? '#10b981' : '#64748b', boxShadow: isStreaming ? '0 0 10px #10b981' : 'none' }}></span>
                {selectedStreamService ? `${selectedStreamService}.log` : 'no-service.log'}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>Lines: {streamingLogs.length}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>Auto-scroll: ON</div>
              </div>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 20, fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
              {streamingLogs.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#334155', gap: 16 }}>
                  <Terminal size={48} strokeWidth={1} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Log stream initialized.</p>
                    <p style={{ margin: 4, fontSize: '0.75rem' }}>Select a service and click 'Start Streaming' to begin ingestion.</p>
                  </div>
                </div>
              ) : (
                streamingLogs.map((line, i) => (
                  <div key={i} style={{ 
                    whiteSpace: 'pre-wrap', 
                    borderLeft: '2px solid transparent',
                    paddingLeft: 12,
                    marginBottom: 2,
                    color: line.includes('ERROR') || line.includes('Exception') ? '#fda4af' : line.includes('WARN') ? '#fcd34d' : '#94a3b8',
                    background: line.includes('ERROR') ? 'rgba(244,63,94,0.05)' : 'transparent'
                  }}>
                    {line}
                  </div>
                ))
              )}
              <div ref={streamEndRef} />
            </div>
          </div>
        </>
      )}

      {/* Container Logs Overlay (Keep for backward compatibility / quick look) */}
      <AnimatePresence>
        {containerLogs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 1000, maxHeight: '80vh', background: '#0b0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Snapshot: {containerLogs.service}</h3>
                <button onClick={() => setContainerLogs(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#080c10', fontFamily: 'monospace', fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                {containerLogs.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
