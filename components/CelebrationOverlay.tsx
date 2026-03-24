'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, CheckCircle2, Sparkles } from 'lucide-react';

export function CelebrationOverlay({
    isVisible,
    onClose
}: {
    isVisible: boolean;
    onClose: () => void;
}) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 isolate pointer-events-auto"
                >
                    {/* Dark Backdrop with Heavy Blur */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl -z-10"
                        onClick={onClose}
                    />

                    {/* Sovereign Glow Background */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute w-[800px] h-[800px] bg-purple-core/20 rounded-full blur-[150px] -z-10 pointer-events-none"
                    />

                    {/* Content Box */}
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9, rotateX: -20 }}
                        animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ y: 20, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200 }}
                        className="glass-panel p-16 flex flex-col items-center max-w-xl w-full text-center relative overflow-hidden border-white/10 shadow-[0_0_100px_rgba(124,58,237,0.3)]"
                    >
                        {/* Decorative Background Icon */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-[0.03] scale-[4] pointer-events-none -z-10">
                            <Trophy size={100} />
                        </div>

                        <div className="relative mb-10">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-t from-purple-core to-transparent rounded-full blur-2xl opacity-20 scale-150"
                            />
                            <div className="w-24 h-24 rounded-3xl bg-purple-core/20 flex items-center justify-center border border-purple-core/30 relative z-10 shadow-lg">
                                <Trophy size={48} className="text-purple-bright" />
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-2 -right-2 text-purple-light"
                            >
                                <Sparkles size={24} />
                            </motion.div>
                        </div>

                        <h2 className="text-5xl md:text-6xl font-syne font-800 tracking-tighter uppercase mb-2 text-white leading-tight">
                            OBJECTIVE<br />NEUTRALIZED
                        </h2>

                        <div className="h-0.5 w-12 bg-purple-core/50 mb-6 rounded-full" />

                        <p className="label-caps text-purple-light tracking-[0.4em] text-xs mb-14 opacity-80">
                            Sovereignty State: 100% Operational
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full mb-12">
                            <div className="glass-panel bg-white/5 border-white/5 p-6 rounded-3xl text-center">
                                <div className="text-[10px] label-caps text-text-muted mb-2">Discipline Streak</div>
                                <div className="flex items-center justify-center gap-2">
                                    <Flame size={20} className="text-purple-bright" />
                                    <span className="text-3xl font-syne font-800 text-white">14+</span>
                                </div>
                            </div>
                            <div className="glass-panel bg-white/5 border-white/5 p-6 rounded-3xl text-center">
                                <div className="text-[10px] label-caps text-text-muted mb-2">Cycle Integrity</div>
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 size={20} className="text-green-500" />
                                    <span className="text-3xl font-syne font-800 text-white">SECURE</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="glow-button w-full py-5 label-caps text-sm tracking-[0.2em] font-800"
                        >
                            Acknowledge Achievement
                        </button>

                        <button
                            onClick={onClose}
                            className="mt-6 text-[10px] label-caps text-text-muted hover:text-white transition-colors opacity-60"
                        >
                            Continue Command (Esc)
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
