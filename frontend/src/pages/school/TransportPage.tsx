import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, MapPin, Phone, User, Plus, Search, Clock, Shield, 
  Radio, CheckCircle2, X, Navigation, LocateFixed, 
  Users, Settings, LayoutDashboard, ChevronRight,
  AlertCircle, Map as MapIcon, RotateCcw
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ApiError, schoolOpsApi, TransportRouteFull, TransportRouteResponse, TransportStopResponse } from '../../lib/api';
import { useTransportRealtime } from '../../hooks/useTransportRealtime';
import { TransportLiveMap } from './TransportLiveMap';
import { useToast } from '../../hooks/useToast';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

type TabType = 'dashboard' | 'fleet' | 'conductor' | 'setup';

export default function TransportPage() {
  const { session } = useStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [routes, setRoutes] = useState<TransportRouteFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Real-time map mode toggle
  const [mapMode, setMapMode] = useState<'SCHEMATIC' | 'REAL_MAP'>('SCHEMATIC');

  // Real-time hook for a specific route if selected, else null
  const { latestPosition } = useTransportRealtime(session.schoolId || '', selectedRouteId || undefined);

  if (locked) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl">
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-300">Transport Module Locked</div>
        <h2 className="mt-3 text-3xl font-black text-white">Upgrade to Basic or Premium</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Route management, live bus tracking, pickup and drop notifications, and staff assignment are available once the school subscription enables transport features.
        </p>
      </div>
    );
  }

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await schoolOpsApi.getFullTransportDashboard(session.schoolId || '');
      setRoutes(data);
      setLocked(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setLocked(true);
        setRoutes([]);
        return;
      }
      setLocked(false);
    } finally {
      setLoading(false);
    }
  }, [session.schoolId]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const selectedRoute = routes.find(r => r.route.routeId === selectedRouteId);

  // Conductor Logic (Simplified for Demo)
  const isConductor = session.role === 'CONDUCTOR' || session.role === 'ADMIN';
  const [isSharingGps, setIsSharingGps] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const toggleGpsSharing = () => {
    if (isSharingGps) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setIsSharingGps(false);
      setWatchId(null);
    } else {
      if (!selectedRouteId) return toast.warning("Please select your route first.");
      setIsSharingGps(true);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          schoolOpsApi.updateVehicleGps({
            schoolId: session.schoolId || '',
            routeId: selectedRouteId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      setWatchId(id);
    }
  };

  return (
    <motion.div variants={V} initial="hidden" animate="show" className="flex flex-col gap-6 pb-20">
      {/* Header */}
      <motion.div variants={I} className="flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Bus size={12} /> Transport Hub
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight -mb-1">Fleet Operations</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Real-time tracking, safety logs, and route configuration</p>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
          {(['dashboard', 'fleet', 'conductor', 'setup'] as TabType[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === t ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div key="dash" variants={V} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* KPI Cards */}
            <StatCard icon={MapIcon} label="Total Routes" value={routes.length} color="#6366f1" />
            <StatCard icon={Radio} label="Live Vehicles" value={routes.filter(r => r.latestPosition).length} color="#34d399" />
            <StatCard icon={Users} label="Total Students" value={routes.reduce((s, r) => s + r.assignments.length, 0)} color="#a78bfa" />
            <StatCard icon={Clock} label="Average ETA" value="12 min" color="#fbbf24" />

            {/* Recent Activity / Status List */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {routes.map(r => (
                <RouteSummaryCard 
                  key={r.route.routeId} 
                  routeFull={r} 
                  onClick={() => { setSelectedRouteId(r.route.routeId); setActiveTab('fleet'); }} 
                />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'fleet' && (
          <motion.div key="fleet" variants={V} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Route List Sidebar */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2 mb-4">Select Route to Track</h3>
              {routes.map(r => (
                <button
                  key={r.route.routeId}
                  onClick={() => setSelectedRouteId(r.route.routeId)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedRouteId === r.route.routeId 
                      ? 'bg-accent-primary/10 border-accent-primary/30' 
                      : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white mb-1">{r.route.routeName}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">{r.route.vehicleNumber} • {r.route.conductorName || 'No Conductor'}</div>
                    </div>
                    {r.latestPosition ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600 font-bold uppercase">Offline</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Live Map Display */}
            <div className="xl:col-span-2 space-y-4">
              {selectedRoute ? (
                <>
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {mapMode === 'SCHEMATIC' ? <LayoutDashboard size={16} className="text-slate-400" /> : <MapIcon size={16} className="text-accent-primary" />}
                      Live Tracking Feed
                    </h3>
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5 shadow-inner">
                      <button
                        onClick={() => setMapMode('SCHEMATIC')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${
                          mapMode === 'SCHEMATIC' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Schematic
                      </button>
                      <button
                        onClick={() => setMapMode('REAL_MAP')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${
                          mapMode === 'REAL_MAP' ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Shield size={10} /> Real Map
                      </button>
                    </div>
                  </div>

                  <div className="p-1 bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <TransportLiveMap 
                      route={selectedRoute.route} 
                      stops={selectedRoute.stops} 
                      latestPosition={latestPosition || selectedRoute.latestPosition} 
                      mode={mapMode}
                    />
                  </div>
                  
                  {/* Stops Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-accent-primary" /> Route Stops
                      </h4>
                      <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                        {selectedRoute.stops.map(stop => (
                          <div key={stop.stopId} className="relative pl-8">
                            <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-accent-primary z-10" />
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-bold text-white">{stop.stopName}</div>
                                <div className="text-xs text-slate-500 font-medium">{stop.pickupTime} Pickup • {stop.dropTime} Drop</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={16} className="text-purple-400" /> Students Assigned
                      </h4>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {selectedRoute.assignments.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs font-bold uppercase italic">No students mapped</div>
                        ) : (
                          selectedRoute.assignments.map(ass => (
                            <div key={ass.assignmentId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-black text-xs">
                                {ass.studentUserId.slice(-2)}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">Student ID: {ass.studentUserId.split('-')[0]}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stop: {selectedRoute.stops.find(s => s.stopId === ass.stopId)?.stopName || 'Unknown'}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[400px] rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                  <Bus size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">Select a route to begin tracking</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'conductor' && (
          <motion.div key="conductor" variants={V} exit={{ opacity: 0 }} className="max-w-2xl mx-auto space-y-6">
            {!isConductor ? (
              <div className="p-12 text-center bg-red-500/5 rounded-3xl border border-red-500/20">
                <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">Access Restricted</h3>
                <p className="text-slate-500 text-sm mt-2">Only authorized conductors or administrators can use the terminal.</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 overflow-hidden relative shadow-2xl shadow-accent-primary/10">
                  <div className="absolute top-0 right-0 p-8">
                    <Radio size={120} className={`opacity-[0.03] transition-all duration-1000 ${isSharingGps ? 'scale-125 text-emerald-500 opacity-20' : ''}`} />
                  </div>
                  
                  <h2 className="text-2xl font-black text-white mb-2">Conductor Terminal</h2>
                  <p className="text-slate-500 text-sm mb-8">Maintain logs and share live location for parents.</p>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Assign My Route</label>
                       <select 
                         value={selectedRouteId || ''} 
                         onChange={(e) => setSelectedRouteId(e.target.value)}
                         className="bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-accent-primary/50 transition-all font-bold"
                       >
                         <option value="">Choose active route...</option>
                         {routes.map(r => (
                           <option key={r.route.routeId} value={r.route.routeId}>{r.route.routeName} ({r.route.vehicleNumber})</option>
                         ))}
                       </select>
                    </div>

                    <button
                      onClick={toggleGpsSharing}
                      disabled={!selectedRouteId}
                      className={`w-full py-6 rounded-2xl flex items-center justify-center gap-4 transition-all ${
                        isSharingGps 
                          ? 'bg-red-500/10 border border-red-500/30 text-red-500' 
                          : 'bg-emerald-500 text-black font-black hover:scale-[1.02]'
                      } disabled:opacity-30 disabled:grayscale`}
                    >
                      {isSharingGps ? (
                        <>
                          <RotateCcw size={20} className="animate-spin" />
                          <span className="text-lg font-black uppercase tracking-wider italic">Stop Tracking Channel</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed size={20} />
                          <span className="text-lg font-black uppercase tracking-wider italic">Go Live on Air</span>
                        </>
                      )}
                    </button>
                    
                    {isSharingGps && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span className="text-xs text-white font-bold tracking-tight italic">Location stream active. Parents are receiving updates.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRoute && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Passenger Boarding Logs</h3>
                    {selectedRoute.assignments.map(ass => (
                      <div key={ass.assignmentId} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-slate-500">
                               ID
                            </div>
                            <div>
                               <div className="font-bold text-white text-sm">Student {ass.studentUserId.slice(0, 8)}</div>
                               <div className="text-[10px] text-slate-500 font-black uppercase">{selectedRoute.stops.find(s => s.stopId === ass.stopId)?.stopName}</div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => selectedRouteId && schoolOpsApi.markPickupDrop({
                                schoolId: session.schoolId || '',
                                routeId: selectedRouteId,
                                studentUserId: ass.studentUserId,
                                stopId: ass.stopId || '',
                                action: 'PICKED_UP',
                                markedBy: session.email || '',
                                tripDate: new Date().toISOString().split('T')[0]
                              })}
                              className="px-4 py-2 bg-accent-primary rounded-xl text-[10px] font-black uppercase text-white hover:brightness-125"
                            >
                              Pick
                            </button>
                            <button 
                              onClick={() => selectedRouteId && schoolOpsApi.markPickupDrop({
                                schoolId: session.schoolId || '',
                                routeId: selectedRouteId,
                                studentUserId: ass.studentUserId,
                                stopId: ass.stopId || '',
                                action: 'DROPPED_OFF',
                                markedBy: session.email || '',
                                tripDate: new Date().toISOString().split('T')[0]
                              })}
                              className="px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white"
                            >
                              Drop
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'setup' && (
           <SetupView routes={routes} schoolId={session.schoolId} onRefresh={fetchRoutes} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <motion.div variants={I} whileHover={{ y: -4 }} className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 relative group">
      <div 
        className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.02] filter blur-xl transition-all group-hover:scale-150 group-hover:opacity-10" 
        style={{ background: color }} 
      />
      <Icon size={20} style={{ color }} className="mb-4" />
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </motion.div>
  );
}

function RouteSummaryCard({ routeFull, onClick }: { routeFull: TransportRouteFull; onClick: () => void }) {
  const { route, stops, assignments, latestPosition } = routeFull;
  return (
    <motion.div 
      variants={I} 
      onClick={onClick}
      className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-accent-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary transition-all group-hover:scale-110">
            <Bus size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white group-hover:text-accent-primary transition-colors">{route.routeName}</h4>
            <div className="text-[10px] text-slate-500 font-bold uppercase">{route.vehicleNumber}</div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${latestPosition ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
          {latestPosition ? 'Online' : 'Offline'}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-[9px] font-bold text-slate-600 uppercase mb-1">Stops</div>
          <div className="text-sm font-black text-white">{stops.length}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-slate-600 uppercase mb-1">Capacity</div>
          <div className="text-sm font-black text-white">{assignments.length}/{route.capacity}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-slate-600 uppercase mb-1">Driver</div>
          <div className="text-sm font-black text-white truncate max-w-full">{route.driverName.split(' ')[0]}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
           <Phone size={10} /> {route.driverPhone}
        </div>
        <div className="text-accent-primary flex items-center gap-1 text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
           Track <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
}

function SetupView({ routes, schoolId, onRefresh }: any) {
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newRoute, setNewRoute] = useState({ routeName: '', vehicleNumber: '', driverName: '', driverPhone: '', attendantName: '', conductorName: '', conductorPhone: '', capacity: 40 });

  const handleCreateRoute = async () => {
    try {
      await schoolOpsApi.createTransportRoute({ ...newRoute, schoolId });
      setShowAdd(false);
      onRefresh();
      toast.success("New route deployed successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create route");
    }
  };

  return (
    <motion.div key="setup" variants={V} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-white/5">
        <div>
           <h3 className="text-lg font-black text-white">Route Architecture</h3>
           <p className="text-slate-500 text-xs mt-1">Define fleet nodes and staff assignments</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} /> New Route
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-8 overflow-hidden relative shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-black text-white">Configure New Fleet Unit</h2>
                 <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white"><X /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Route Descriptor</label>
                    <input 
                      value={newRoute.routeName} onChange={e => setNewRoute({...newRoute, routeName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-accent-primary/50 transition-all font-bold" 
                      placeholder="e.g. North Zone Express" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Vehicle No</label>
                    <input 
                      value={newRoute.vehicleNumber} onChange={e => setNewRoute({...newRoute, vehicleNumber: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-accent-primary/50 transition-all font-bold" 
                      placeholder="DL-01-XX-0000" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Capacity</label>
                    <input 
                      type="number"
                      value={newRoute.capacity} onChange={e => setNewRoute({...newRoute, capacity: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-accent-primary/50 transition-all font-bold" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Driver Name</label>
                    <input 
                      value={newRoute.driverName} onChange={e => setNewRoute({...newRoute, driverName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-accent-primary/50 transition-all font-bold" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Driver Phone</label>
                    <input 
                      value={newRoute.driverPhone} onChange={e => setNewRoute({...newRoute, driverPhone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-accent-primary/50 transition-all font-bold" 
                    />
                 </div>
                 <div className="col-span-2 mt-4">
                    <button 
                      onClick={handleCreateRoute}
                      className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
                    >
                      Authorize & Deploy
                    </button>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 text-center text-slate-500">
         <p className="text-sm italic">Advanced route segmentation and stop mapping tools available in enterprise tier.</p>
      </div>
    </motion.div>
  );
}
