'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Topbar, Sidebar, MobileSidebar } from '@/components/Layout';
import { fetchWithAuth } from '@/lib/api';
import { LiveFlame } from '@/components/streak/LiveFlame';
import { Info, X } from 'lucide-react';
import { getMilestone, MILESTONES } from '@/lib/utils/milestone';
import { TiltCard } from '@/components/TiltCard';
import { StreakSkeleton, ErrorDisplay } from '@/components/SkeletonBlock';

export default function StreakPage() {
    const [loading, setLoading] = useState(true);
    const [streakData, setStreakData] = useState({ sovereign_days: 0, total_kt_this_streak: 0, primary_kt_this_streak: 0, primary_kt_today: 0 });
    const [showInfoModal, setShowInfoModal] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function loadStreak() {
            try {
                const res = await fetchWithAuth('/api/streak');
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setStreakData({
                        sovereign_days: data.sovereign_days || 0,
                        total_kt_this_streak: data.total_kt_this_streak || 0,
                        primary_kt_this_streak: data.primary_kt_this_streak || 0,
                        primary_kt_today: data.primary_kt_today || 0
                    });
                }
            } catch (err) {
                console.error("Failed to load streak stats:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadStreak();

        // Live polling every 30s to keep "Primary KT Today" organically synchronized with real-time tracking
        const pollInterval = setInterval(loadStreak, 30000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    // Placeholder data for Topbar
    const [activeKT] = useState(0);
    const [currentCategory] = useState(null);

    // Milestone progress
    const currentMilestone = getMilestone(streakData.primary_kt_this_streak);
    const currentIdx = MILESTONES.findIndex(m => m.name === currentMilestone.name);
    const nextMilestone = currentIdx < MILESTONES.length - 1 ? MILESTONES[currentIdx + 1] : null;
    const progressPct = nextMilestone
        ? Math.min(100, ((streakData.primary_kt_this_streak - MILESTONES[currentIdx].threshold) / (nextMilestone.threshold - MILESTONES[currentIdx].threshold)) * 100)
        : 100;

    // Deep dark background for max contrast with the glowing flame
    return (
        <div className="min-h-screen text-foreground flex flex-col md:flex-row overflow-hidden relative">
            <Sidebar />

            <div className="flex-1 flex flex-col md:ml-64 relative z-10 w-full min-h-screen">
                <Topbar />
                <MobileSidebar />

                <main className="flex-1 overflow-auto p-4 md:p-8 pt-24 md:pt-28 pb-32 flex flex-col items-center justify-start">
                    {loading ? (
                        <StreakSkeleton />
                    ) : !streakData ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <ErrorDisplay message="Unable to synchronize with the sovereign flame. Your streak matrix is momentarily offline." onRetry={() => window.location.reload()} />
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center justify-start w-full max-w-4xl mt-12 md:mt-24 relative"
                        >
                            {/* Info Button anchored to container */}
                            <div className="absolute top-0 right-4 sm:right-8 md:right-0 z-[50]">
                                <button
                                    onClick={() => setShowInfoModal(true)}
                                    className="p-3 glass-interactive rounded-full text-white shadow-lg focus:outline-none"
                                    title="View Sovereign Day Conditions"
                                >
                                    <Info size={22} />
                                </button>
                            </div>

                            {/* Stats Display */}
                            <div className="text-center z-20 mb-16 mt-8 md:mt-0 relative">

                                {/* Radar Rings behind number */}
                                <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
                                    {[0, 1, 2].map(i => (
                                        <div
                                            key={i}
                                            className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full border border-accent-blue/20 animate-radar"
                                            style={{ animationDelay: `${i * 1}s` }}
                                        />
                                    ))}
                                </div>

                                <motion.div
                                    className="text-7xl md:text-[10rem] font-black font-mono tracking-tighter leading-none bg-gradient-to-b from-white via-blue-200 to-accent-blue bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.6, type: 'spring' }}
                                >
                                    {streakData.sovereign_days}
                                </motion.div>
                                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.4em] text-accent-blue mt-4 opacity-90">
                                    Sovereign Days
                                </h2>

                                {/* Milestone Progress Bar */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-8 w-full max-w-md mx-auto"
                                >
                                    <div className="flex items-center justify-between mb-2 px-4 md:px-0">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted/60 flex items-center gap-2">
                                            <img src={currentMilestone.badge} alt="" className="w-4 h-4" />
                                            {currentMilestone.name}
                                        </span>
                                        {nextMilestone && (
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted/40">
                                                {nextMilestone.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPct}%` }}
                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                            className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-teal"
                                        />
                                    </div>
                                </motion.div>

                                <TiltCard className="mt-8">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="px-6 md:px-8 py-5 glass-hero rounded-2xl inline-flex flex-col items-center gap-4 w-full"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs md:text-base font-mono tracking-widest text-[#4a9eff]">
                                                TOTAL KT THIS STREAK: <span className="text-white font-bold ml-2">{streakData.total_kt_this_streak}</span>
                                            </span>
                                        </div>

                                        <div className="w-full gradient-divider" />

                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)] shrink-0" />
                                            <span className="text-xs md:text-base font-mono tracking-widest text-muted">
                                                PRIMARY KT THIS STREAK: <span className="text-white font-bold ml-2">{streakData.primary_kt_this_streak}</span>
                                            </span>
                                        </div>

                                        <div className="w-full gradient-divider" />

                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] md:text-sm font-mono tracking-widest text-muted opacity-80">
                                                PRIMARY KT TODAY: <span className="text-white font-bold ml-2">{streakData.primary_kt_today}</span>
                                            </span>
                                        </div>
                                    </motion.div>
                                </TiltCard>
                            </div>


                            {/* Live Flame — scaled up */}
                            <div className="mt-8 md:mt-8 flex justify-center items-center w-full scale-[1.2] md:scale-150 origin-top">
                                <LiveFlame days={streakData.sovereign_days} />
                            </div>

                        </motion.div>
                    )}
                </main>

                {/* Info Modal Overlay */}
                <AnimatePresence>
                    {showInfoModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="glass-hero rounded-2xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl overflow-hidden"
                            >
                                {/* Top Blue Glow Accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-blue to-transparent opacity-70" />

                                <button
                                    onClick={() => setShowInfoModal(false)}
                                    className="absolute top-5 right-5 text-muted hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
                                >
                                    <X size={20} />
                                </button>

                                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                                    <Info className="text-accent-blue shrink-0" size={24} />
                                    Sovereign Conditions
                                </h3>

                                <div className="space-y-6 text-muted font-sans leading-relaxed">
                                    <p className="text-sm md:text-base text-white/80">
                                        A cycle officially qualifies as a <strong className="text-white font-bold tracking-wide">Sovereign Day</strong> only when both of the following conditions are met simultaneously:
                                    </p>

                                    <ul className="space-y-4 rounded-xl bg-background/50 p-5 border border-white/5">
                                        <li className="flex items-start gap-4">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                            <span className="text-sm">At least one <strong className="text-white">Primary</strong> category section must be switched and utilized during the cycle.</span>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                            <span className="text-sm">A minimum of <strong className="text-white font-mono">120 KT</strong> must be rendered in total across all sections combined during that exact cycle.</span>
                                        </li>
                                    </ul>

                                    <div className="text-[13px] md:text-sm italic opacity-70 border-l-2 border-accent-blue/40 pl-4 py-1 leading-snug">
                                        "The streak measures consecutive days of sovereign intention — days where you showed up, declared a primary purpose, and rendered meaningful time."
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setShowInfoModal(false)}
                                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold uppercase tracking-widest transition-colors border border-border"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
