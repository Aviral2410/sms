import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronRight, Zap } from 'lucide-react';

const GLASS_STYLE = "bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08]";

interface StepLadderProps {
    title: string;
    steps: Array<{ title: string; desc: string; why?: string }>;
}

export const StepLadder: React.FC<StepLadderProps> = ({ title, steps }) => {
    return (
        <div className={`${GLASS_STYLE} rounded-[2.5rem] p-8 my-6 relative overflow-hidden`}>
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Zap size={20} />
                </div>
                <h4 className="text-2xl font-black text-white tracking-tight">{title}</h4>
            </div>

            <div className="space-y-6 relative">
                {/* Connector Line */}
                <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-sky-500/40 via-emerald-500/20 to-transparent" />

                {steps.map((step, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-6 group"
                    >
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-black border-2 border-white/10 flex items-center justify-center text-lg font-black text-white/40 group-hover:border-sky-500/50 group-hover:text-sky-400 transition-all shadow-xl">
                                {idx + 1}
                            </div>
                        </div>
                        <div className="flex-1 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 group-hover:bg-white/[0.05] transition-all">
                            <div className="text-[10px] font-black uppercase tracking-widest text-sky-500/60 mb-1">Concept Node</div>
                            <div className="text-md font-black text-white/90 mb-2">{step.title}</div>
                            <p className="text-sm text-white/40 font-medium leading-relaxed">{step.desc}</p>
                            
                            {step.why && (
                                <div className="mt-4 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 flex gap-3">
                                    <HelpCircle size={14} className="text-sky-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="text-[9px] font-black uppercase text-sky-400/60 mb-0.5 tracking-tighter">Deep Synthesis</div>
                                        <div className="text-[11px] text-sky-300/80 font-bold italic">{step.why}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
