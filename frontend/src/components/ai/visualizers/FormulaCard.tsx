import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const GLASS_STYLE = "bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08]";

interface FormulaCardProps {
    title: string;
    latex: string;
    explanation: string;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({ title, latex, explanation }) => {
    return (
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${GLASS_STYLE} rounded-[2.5rem] p-10 my-6 relative overflow-hidden text-center group`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col items-center gap-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-400">
                    <Sparkles size={20} />
                </div>
                
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">{title}</div>
                    <div className="text-5xl font-serif text-white tracking-widest py-8 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent italic selection:bg-emerald-500/30">
                        {latex}
                    </div>
                </div>

                <div className="w-16 h-[1px] bg-white/10" />

                <p className="max-w-md text-sm text-white/50 font-medium leading-relaxed italic">
                    "{explanation}"
                </p>
            </div>

            {/* Decorative Background Logic */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};
