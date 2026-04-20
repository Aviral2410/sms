import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Play, RotateCcw, Activity, Zap } from 'lucide-react';

const GLASS_STYLE = "bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08]";

interface SimulationCanvasProps {
    title: string;
    logic: 'physics_f_ma' | 'pendulum' | 'projectile';
    parameters: any;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ title, logic, parameters }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [stats, setStats] = useState({ v: 0, x: 0, t: 0 });
    const controls = useAnimation();

    useEffect(() => {
        if (logic === 'physics_f_ma' && isPlaying) {
            const acceleration = parameters.force / parameters.mass;
            let currentV = 0;
            let currentX = 0;
            let time = 0;
            
            const interval = setInterval(() => {
                time += 0.05;
                currentV += acceleration * 0.05;
                currentX += currentV * 0.05;
                
                setStats({ v: Number(currentV.toFixed(2)), x: Number(currentX.toFixed(2)), t: Number(time.toFixed(2)) });
                
                if (currentX > 300) {
                   setIsPlaying(false);
                   clearInterval(interval);
                }
            }, 50);

            controls.start({
                x: 300,
                transition: { duration: 3, ease: "easeIn" }
            });

            return () => clearInterval(interval);
        }
    }, [isPlaying, logic, parameters, controls]);

    const handleReset = () => {
        setIsPlaying(false);
        setStats({ v: 0, x: 0, t: 0 });
        controls.set({ x: 0 });
    };

    return (
        <div className={`${GLASS_STYLE} rounded-[2.5rem] p-8 my-6 overflow-hidden relative group`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Activity size={80} className="text-emerald-400" />
            </div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 mb-1">Neural Simulation v1.0</div>
                    <h4 className="text-2xl font-black text-white tracking-tight">{title}</h4>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-4 rounded-2xl bg-emerald-500 text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                    >
                        {isPlaying ? <RotateCcw size={18} /> : <Play size={18} />}
                    </button>
                    <button 
                        onClick={handleReset}
                        className="p-4 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 transition-all border border-white/5"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="relative h-64 bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden flex items-center px-12">
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.2) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                
                <motion.div 
                    animate={controls}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center relative z-10"
                >
                    <span className="text-[10px] font-black text-black">{parameters.mass}KG</span>
                </motion.div>

                {/* Tracking Shadow */}
                <div className="absolute bottom-16 left-12 right-12 h-[1px] bg-white/10" />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                    { label: 'Velocity', val: stats.v, unit: 'm/s', icon: <Zap size={12} className="text-amber-400" />},
                    { label: 'Displacement', val: stats.x, unit: 'm', icon: <Activity size={12} className="text-sky-400" />},
                    { label: 'Time', val: stats.t, unit: 's', icon: <Clock size={12} className="text-white/40" />}
                ].map(stat => (
                    <div key={stat.label} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            {stat.icon}
                            <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">{stat.label}</span>
                        </div>
                        <div className="text-xl font-black text-white/90">{stat.val}<small className="text-[10px] ml-1 text-white/20">{stat.unit}</small></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Clock: React.FC<{ size?: number; className?: string }> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
