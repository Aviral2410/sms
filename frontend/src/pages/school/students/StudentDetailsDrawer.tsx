import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus, ChevronRight, Mail, Phone, Calendar, MapPin, Award, Activity } from 'lucide-react';
import {
   LineChart,
   Line,
   AreaChart,
   Area,
   XAxis,
   Tooltip,
   ResponsiveContainer,
} from 'recharts';
import type { StudentRowResponse, StudentAnalyticsResponse, TransportRouteFull, StudentMonitoringReportResponse } from '../../../lib/api';
import { clsx } from 'clsx';

type Props = {
   student: StudentRowResponse | null;
   open: boolean;
   onClose: () => void;
   analytics: StudentAnalyticsResponse | null;
   transport: TransportRouteFull['route'] | null;
   reports: StudentMonitoringReportResponse[] | null;
};

export function StudentDetailsDrawer({ student, open, onClose, analytics, transport, reports }: Props) {
   if (!student) return null;

   const attendanceData = analytics?.attendanceTrend?.map(p => ({ 
      name: p.label, 
      value: Number(p.value) 
   })) || [
      { name: 'W1', value: 80 }, { name: 'W2', value: 85 }, { name: 'W3', value: 82 }, { name: 'W4', value: 86 }
   ];

   const academicData = analytics?.academicProgress?.map(p => ({ 
      name: p.label, 
      value: Number(p.value) 
   })) || [
      { name: 'Oct', value: 70 }, { name: 'Nov', value: 85 }, { name: 'Dec', value: 75 }, { name: 'Jan', value: 92 }, { name: 'Feb', value: 88 }, { name: 'Mar', value: 95 }
   ];

   return (
      <AnimatePresence>
         {open && (
            <>
               {/* Transluscent Backdrop */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
               />

               {/* Right Drawer Panel */}
               <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-screen w-[330px] bg-[#0D1226] border-l border-white/10 z-[101] shadow-2xl overflow-y-auto custom-scrollbar-student flex flex-col"
               >
                  {/* Header Profile Block */}
                  <div className="relative h-48 shrink-0 overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-[#0D1226]" />
                     <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-10"
                     >
                        <X size={18} />
                     </button>
                     
                     <div className="absolute bottom-6 left-6 right-6 flex items-end gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-2xl font-bold text-blue-400 shadow-xl">
                           {student.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                           <h2 className="text-xl font-bold text-white truncate">{student.fullName}</h2>
                           <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-0.5">#{student.admissionNo}</p>
                        </div>
                     </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="px-6 space-y-8 pb-12">
                     
                     {/* Metadata Grid */}
                     <div className="student-meta-grid">
                        <div className="student-meta-item">
                           <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">Class</p>
                           <p className="text-sm font-bold text-white/80">{student.className}</p>
                        </div>
                        <div className="student-meta-item">
                           <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">Section</p>
                           <p className="text-sm font-bold text-white/80">{student.sectionName}</p>
                        </div>
                        <div className="student-meta-item">
                           <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">Roll No</p>
                           <p className="text-sm font-bold text-blue-400">{student.rollNo || '--'}</p>
                        </div>
                     </div>

                     {/* Attendance Sparkline Card */}
                     <div className="student-glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <Activity size={12} className="text-blue-400" />
                              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Attendance</h3>
                           </div>
                           <span className="text-xs font-bold text-white">{analytics?.attendancePercentage || 86}%</span>
                        </div>
                        <div className="h-16 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={attendanceData}>
                                 <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#3B6FD4" 
                                    strokeWidth={3} 
                                    dot={false} 
                                    isAnimationActive={true}
                                 />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Academic Progress Area Chart */}
                     <div className="space-y-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-1">Academic Progress</h3>
                        <div className="student-glass-card p-5">
                           <div className="h-32 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart data={academicData}>
                                    <defs>
                                       <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3B6FD4" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#3B6FD4" stopOpacity={0}/>
                                       </linearGradient>
                                    </defs>
                                    <Area 
                                       type="monotone" 
                                       dataKey="value" 
                                       stroke="#3B6FD4" 
                                       strokeWidth={2} 
                                       fill="url(#areaColor)" 
                                    />
                                 </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                     </div>

                     {/* Behavior Overview Timeline */}
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-1">Behavior Overview</h3>
                        <div className="space-y-4">
                           {reports && reports.length > 0 ? (
                              reports.slice(0, 2).map((r, idx) => (
                                 <BehaviorItem 
                                    key={r.reportId}
                                    color={idx === 0 ? "#3B6FD4" : "#7A7FA8"}
                                    date={r.reportMonth}
                                    text={r.behaviourNote || "No behavior notes recorded for this period."}
                                    isLast={idx === reports.length - 1}
                                 />
                              ))
                           ) : (
                              <BehaviorItem 
                                 color="#3B6FD4" 
                                 date="Recent" 
                                 text={analytics?.behaviourSummary || "No behavioral incidents recorded."} 
                                 isLast={true}
                              />
                           )}
                        </div>
                     </div>

                     {/* Contact & Bio Info */}
                     <div className="student-glass-card p-5 space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Information</h3>
                        <div className="space-y-4">
                           <InfoRow icon={Mail} label="Guardian" value={student.guardianName || 'Unknown'} />
                           <InfoRow icon={Phone} label="Contact" value={student.contact || 'Unknown'} />
                           <InfoRow icon={Bus} label="Transport" value={student.routeName || 'Not Assigned'} />
                        </div>
                     </div>

                  </div>
               </motion.aside>
            </>
         )}
      </AnimatePresence>
   );
}

function BehaviorItem({ color, date, text, isLast }: { color: string; date: string; text: string, isLast?: boolean }) {
   return (
      <div className="flex gap-4 group">
         <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
            {!isLast && <div className="w-px flex-1 bg-white/[0.05] my-1" />}
         </div>
         <div className="pb-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{date}</p>
            <p className="text-xs text-white/60 leading-relaxed font-medium">{text}</p>
         </div>
      </div>
   );
}

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
   return (
      <div className="flex items-center gap-4">
         <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/40">
            <Icon size={14} />
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{label}</p>
            <p className="text-xs font-bold text-white/80 truncate">{value}</p>
         </div>
      </div>
   );
}
