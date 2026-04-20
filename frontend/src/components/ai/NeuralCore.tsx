import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const NeuralCore: React.FC<{ isThinking: boolean; themeColor: string }> = ({ isThinking, themeColor }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    const x = useSpring(0, { stiffness: 100, damping: 30 });
    const y = useSpring(0, { stiffness: 100, damping: 30 });

    useEffect(() => {
        x.set(mousePos.x / window.innerWidth - 0.5);
        y.set(mousePos.y / window.innerHeight - 0.5);
    }, [mousePos, x, y]);

    const rotateX = useTransform(y, [-0.5, 0.5], [20, -20]);
    const rotateY = useTransform(x, [-0.5, 0.5], [-20, 20]);

    return (
        <div className="fixed bottom-20 right-10 z-[100] pointer-events-none">
            <motion.div
                style={{ rotateX, rotateY, perspective: 1000 }}
                className="relative w-32 h-32 flex items-center justify-center"
            >
                {/* --- Outer Ring --- */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20"
                />

                {/* --- The Core Orb --- */}
                <motion.div
                    animate={{ 
                        scale: isThinking ? [1, 1.2, 1] : [1, 1.05, 1],
                        boxShadow: isThinking ? 
                            [`0 0 40px ${themeColor}60`, `0 0 80px ${themeColor}90`, `0 0 40px ${themeColor}60`] : 
                            [`0 0 20px ${themeColor}20`, `0 0 40px ${themeColor}40`, `0 0 20px ${themeColor}20`]
                    }}
                    transition={{ duration: isThinking ? 1 : 3, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-black border border-white/20 relative flex items-center justify-center overflow-hidden"
                >
                    {/* --- Pupil / Eye --- */}
                    <motion.div 
                        animate={{ 
                            x: mousePos.x / window.innerWidth * 20 - 10,
                            y: mousePos.y / window.innerHeight * 20 - 10
                        }}
                        className="w-6 h-6 rounded-full bg-emerald-500 blur-[2px] relative"
                    >
                        <div className="absolute inset-0 bg-white/40 rounded-full scale-50" />
                    </motion.div>

                    {/* --- Neural Waves --- */}
                    <AnimatePresence>
                        {isThinking && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 0.5, 0], scale: 2 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="absolute inset-0 bg-emerald-500/30 rounded-full"
                            />
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* --- Floating Particles --- */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ 
                            y: [0, -40, 0],
                            x: [0, (i-1)*30, 0],
                            opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                        className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                    />
                ))}
            </motion.div>
            <div className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.4em] text-center mt-2">Neural Presence</div>
        </div>
    );
};

import { AnimatePresence } from 'framer-motion';
