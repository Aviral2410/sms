import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Search, Filter, RefreshCw, Clock, 
  User, Building2, Terminal, Info, ChevronRight,
  ShieldAlert, Activity, FileJson
} from 'lucide-react';

interface AuditEvent {
  timestamp: string;
  type: string;
  userId: string;
  schoolId?: string;
  status: string;
  payload?: any;
}

export default function AiAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai-interaction/audit/events?limit=200');
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error('Audit fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.payload ? JSON.stringify(e.payload).toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesType = filterType === 'all' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  const eventTypes = Array.from(new Set(events.map(e => e.type)));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={12} /> Compliance & Integrity
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">AI Neural Audits</h1>
          <p className="text-white/40 max-w-xl font-medium">Persistent immutable record of all AI-orchestrated actions, tool executions, and security validations.</p>
        </div>
        
        <button 
          onClick={fetchEvents}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
        >
          <RefreshCw size={20} className={`text-emerald-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input 
            type="text" 
            placeholder="Search payload contents..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Event Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-white/20">
          <Activity size={14} /> Global Persistence Active
        </div>
      </div>

      {/* Audit List */}
      <div className="bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-500/60">
          <div className="col-span-3 flex items-center gap-2"><Clock size={12} /> Timestamp</div>
          <div className="col-span-2 flex items-center gap-2"><Terminal size={12} /> Event Type</div>
          <div className="col-span-3 flex items-center gap-2"><User size={12} /> User Identifier</div>
          <div className="col-span-3 flex items-center gap-2"><Building2 size={12} /> School / Tenant</div>
          <div className="col-span-1">Status</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading && events.length === 0 ? (
            <div className="p-20 text-center animate-pulse text-white/20 font-bold uppercase tracking-widest">Synchronizing Audit Records...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-20 text-center text-white/20 font-bold uppercase tracking-widest">No matching audit trails found.</div>
          ) : (
            filteredEvents.map((event, idx) => (
              <div key={idx} className="group">
                <div 
                  onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                  className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="col-span-3 text-xs font-mono text-white/60">{new Date(event.timestamp).toLocaleString()}</div>
                  <div className="col-span-2">
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white/80">{event.type}</span>
                  </div>
                  <div className="col-span-3 text-xs font-semibold text-white/80 truncate">{event.userId}</div>
                  <div className="col-span-3 text-xs text-white/40 truncate">{event.schoolId || 'Global / NA'}</div>
                  <div className="col-span-1">
                    <div className={`w-2 h-2 rounded-full ${event.status === 'SUCCESS' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedId === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-black/60"
                    >
                      <div className="px-8 pb-8 pt-2">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/40">
                             <span className="flex items-center gap-2"><FileJson size={14} className="text-emerald-500" /> Event Payload Data</span>
                             <span className="flex items-center gap-2">Trace ID: {event.payload?.requestId || 'N/A'}</span>
                          </div>
                          <pre className="text-xs font-mono text-emerald-50/70 p-4 bg-black/40 rounded-xl overflow-auto max-h-[400px] custom-scrollbar">
                            {JSON.stringify(event.payload || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
