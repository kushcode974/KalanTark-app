'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, getToken } from '@/lib/api';
import { Sidebar, Topbar, MobileSidebar } from '@/components/Layout';
import { ProfileSkeleton, ErrorDisplay } from '@/components/SkeletonBlock';
import { PageTransition } from '@/components/PageTransition';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TiltCard } from '@/components/TiltCard';
import { getMilestone, MILESTONES } from '@/lib/utils/milestone';
import { Flame, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

type ProfileStats = {
    totalKT: number;
    primaryKT: number;
    essentialKT: number;
    scatteredKT: number;
    currentMilestone: string;
    nextMilestone: string | null;
    nextMilestoneThreshold: number | null;
    ktUntilNext: number;
    currentStreak: number;
    longestStreak: number;
    username: string;
};

const DESCRIPTORS: Record<string, string> = {
    'Awakened': "Your sovereign journey begins.",
    'Contender': "You are no longer testing. You are operating.",
    'Sovereign': "Dominion established. The system knows you.",
    'Architect': "You are building something that lasts.",
    'Chronarch': "Rare. Genuine. Elite.",
    'Sovereign Prime': "Beyond rank. Beyond title. Absolute."
};

const MILESTONE_COLORS: Record<string, string> = {
    'Awakened': '#5483B3',
    'Contender': '#4a9eff',
    'Sovereign': '#22c55e',
    'Architect': '#ffd700',
    'Chronarch': '#ff6b35',
    'Sovereign Prime': '#ff4444'
};

export default function ProfilePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [stats, setStats] = useState<ProfileStats | null>(null);
    // If token already exists, skip loading — show page instantly on app reopen
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window === 'undefined') return true;
        return !getToken();
    });

    const loadData = async () => {
        const token = getToken();
        if (!token) return router.push('/login');

        try {
            const statsRes = await fetchWithAuth('/api/profile/stats');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000);
        return () => clearInterval(interval);
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex">
                <Sidebar />
                <div className="flex-1 md:ml-64 relative flex flex-col">
                    <Topbar />
                    <div className="pt-28 px-6 pb-12">
                        <ProfileSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-background text-foreground flex">
                <Sidebar />
                <div className="flex-1 md:ml-64 relative flex flex-col">
                    <Topbar />
                    <div className="flex-1 flex items-center justify-center p-6">
                        <ErrorDisplay message="Unable to reconstruct identity matrix. Sovereign stats are currently unreachable." onRetry={loadData} />
                    </div>
                </div>
            </div>
        );
    }

    const liveTotalKT = stats.totalKT;
    const milestone = getMilestone(liveTotalKT);
    const milestoneColor = MILESTONE_COLORS[milestone.name] || '#4a9eff';

    const milestoneIndex = MILESTONES.findIndex(m => m.name === milestone.name);
    const nextMilestone = milestoneIndex < MILESTONES.length - 1 ? MILESTONES[milestoneIndex + 1] : null;

    let progressPct = 100;
    let ktUntilNextLabel = "You have reached the absolute summit.";

    if (nextMilestone) {
        const range = nextMilestone.threshold - milestone.threshold;
        const currentProgress = liveTotalKT - milestone.threshold;
        progressPct = Math.min(100, Math.max(0, (currentProgress / range) * 100));
        const ktUntilNext = nextMilestone.threshold - liveTotalKT;
        ktUntilNextLabel = `${ktUntilNext.toLocaleString()} KT until ${nextMilestone.name}`;
    }

    const primaryPct = liveTotalKT > 0 ? (stats.primaryKT / liveTotalKT) * 100 : 0;
    const essentialPct = liveTotalKT > 0 ? (stats.essentialKT / liveTotalKT) * 100 : 0;
    const scatteredPct = liveTotalKT > 0 ? (stats.scatteredKT / liveTotalKT) * 100 : 0;

    const maxThreshold = MILESTONES[MILESTONES.length - 1].threshold;
    const sovereigntyScore = Math.min(100, Math.round((liveTotalKT / maxThreshold) * 100));

    const initials = stats.username
        ? stats.username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Topbar />
                <MobileSidebar />

                <main className="flex-1 overflow-y-auto px-6 pt-28 pb-12 custom-scrollbar">
                    <PageTransition className="max-w-5xl mx-auto space-y-6">

                        {/* ══════════════════════════════════════════════════
                            SECTION 1 — Identity Header Card
                        ══════════════════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <TiltCard>
                                <div
                                    className="relative w-full rounded-3xl overflow-hidden glass-hero"
                                    style={{ background: 'linear-gradient(135deg, #052659 0%, #0a3a7a 50%, #052659 100%)' }}
                                >
                                    {/* Ambient glow */}
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(74,158,255,0.12)_0%,transparent_60%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(74,158,255,0.08)_0%,transparent_50%)]" />

                                    {/* Scan line shimmer */}
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(193,232,255,0.04) 50%, transparent 100%)',
                                            backgroundSize: '200% 100%',
                                        }}
                                        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    />

                                    {/* Floating particles */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        {mounted && [...Array(8)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute rounded-full"
                                                style={{
                                                    width: 2 + Math.random() * 3,
                                                    height: 2 + Math.random() * 3,
                                                    backgroundColor: `rgba(193,232,255,${0.15 + Math.random() * 0.2})`,
                                                    left: `${10 + Math.random() * 80}%`,
                                                    top: `${10 + Math.random() * 80}%`,
                                                }}
                                                animate={{
                                                    opacity: [0, 0.8, 0],
                                                    scale: [0.5, 1.5, 0.5],
                                                    y: [0, -20, 0],
                                                }}
                                                transition={{
                                                    duration: 3 + Math.random() * 3,
                                                    repeat: Infinity,
                                                    delay: i * 0.5,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                        {/* Avatar with animated glow border */}
                                        <div className="shrink-0 relative">
                                            <motion.div
                                                className="absolute inset-[-4px] rounded-full"
                                                style={{
                                                    background: `conic-gradient(from 0deg, ${milestoneColor}, transparent, ${milestoneColor})`,
                                                }}
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                                            />
                                            <div
                                                className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl md:text-4xl font-black"
                                                style={{
                                                    boxShadow: `0 0 40px ${milestoneColor}40, inset 0 0 30px ${milestoneColor}10`,
                                                    background: `linear-gradient(135deg, #0a1628 0%, ${milestoneColor}15 100%)`,
                                                    color: milestoneColor,
                                                    border: `3px solid ${milestoneColor}80`,
                                                }}
                                            >
                                                {initials}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="text-center md:text-left flex-1">
                                            <h1
                                                className="text-3xl md:text-5xl font-bold leading-tight"
                                                style={{ color: milestoneColor, fontFamily: 'Syne, sans-serif', textShadow: `0 0 30px ${milestoneColor}40` }}
                                            >
                                                {milestone.name}
                                            </h1>
                                            <div className="text-[#4a9eff] font-medium mt-1 text-base md:text-lg">
                                                @{stats.username}
                                            </div>
                                            <div className="text-muted italic mt-2 text-xs md:text-sm max-w-md mx-auto md:mx-0">
                                                &ldquo;{DESCRIPTORS[milestone.name] || "Your sovereign journey begins."}&rdquo;
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar at bottom */}
                                    <div className="relative z-10 px-8 md:px-10 pb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#5483B3] font-bold">Milestone Progress</span>
                                            <span className="text-[10px] uppercase tracking-[0.15em] text-[#5483B3]">{ktUntilNextLabel}</span>
                                        </div>
                                        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a2744' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPct}%` }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: milestoneColor, boxShadow: `0 0 16px ${milestoneColor}80, 0 0 4px ${milestoneColor}` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>

                        {/* ══════════════════════════════════════════════════
                            SECTION 2 — KT Sovereignty Stats (3 cards)
                        ══════════════════════════════════════════════════ */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total KT Rendered */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <TiltCard>
                                    <div className="glass-data rounded-2xl p-7 relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(74,158,255,0.12)_0%,transparent_70%)]" />
                                        <div className="flex items-center gap-2 mb-5">
                                            <Zap size={16} className="text-[#4a9eff]" style={{ filter: 'drop-shadow(0 0 6px rgba(74,158,255,0.5))' }} />
                                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5483B3]">Total KT Rendered</span>
                                        </div>
                                        <AnimatedNumber value={liveTotalKT} className="text-4xl font-bold text-[#4a9eff]" />
                                        <div className="text-[10px] text-[#5483B3] mt-2 uppercase tracking-wide">
                                            tokens across sovereign existence
                                        </div>
                                    </div>
                                </TiltCard>
                            </motion.div>

                            {/* Current Streak */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <TiltCard>
                                    <div className="glass-data rounded-2xl p-7 relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(255,165,0,0.1)_0%,transparent_70%)]" />
                                        <div className="flex items-center gap-2 mb-5">
                                            <Flame size={16} className="text-orange-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.5))' }} />
                                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5483B3]">Current Streak</span>
                                        </div>
                                        <AnimatedNumber value={stats.currentStreak} className="text-4xl font-bold text-orange-400" />
                                        <div className="text-[10px] text-[#5483B3] mt-2 uppercase tracking-wide">
                                            consecutive sovereign cycles
                                        </div>
                                    </div>
                                </TiltCard>
                            </motion.div>

                            {/* Sovereignty Score */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <TiltCard>
                                    <div className="glass-data rounded-2xl p-7 relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(34,197,94,0.1)_0%,transparent_70%)]" />
                                        <div className="flex items-center gap-2 mb-5">
                                            <Crown size={16} className="text-[#22c55e]" style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' }} />
                                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5483B3]">Sovereignty Score</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 shrink-0">
                                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                                    <circle cx="32" cy="32" r="28" fill="none" stroke="#1a2744" strokeWidth="4" />
                                                    <motion.circle
                                                        cx="32" cy="32" r="28" fill="none"
                                                        stroke="#22c55e"
                                                        strokeWidth="4"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${2 * Math.PI * 28}`}
                                                        initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                                                        animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - sovereigntyScore / 100) }}
                                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                                        style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-[#22c55e]">{sovereigntyScore}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-[#22c55e]">{sovereigntyScore}%</div>
                                                <div className="text-[10px] text-[#5483B3] uppercase tracking-wide">milestone mastery</div>
                                            </div>
                                        </div>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        </section>

                        {/* ══════════════════════════════════════════════════
                            SECTION 3 — Category Breakdown (3 cards)
                        ══════════════════════════════════════════════════ */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'PRIMARY', kt: stats.primaryKT, pct: primaryPct, color: '#00ff88' },
                                { label: 'ESSENTIAL', kt: stats.essentialKT, pct: essentialPct, color: '#ffd700' },
                                { label: 'SCATTERED', kt: stats.scatteredKT, pct: scatteredPct, color: '#ff4444' },
                            ].map((cat, i) => (
                                <motion.div
                                    key={cat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 * i + 0.3 }}
                                >
                                    <TiltCard>
                                        <div className="glass-data rounded-2xl p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                                            {/* Watermark percentage */}
                                            <div
                                                className="absolute -right-2 -bottom-4 text-[5rem] font-black leading-none pointer-events-none select-none"
                                                style={{ color: `${cat.color}08` }}
                                            >
                                                {cat.pct.toFixed(0)}%
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2.5 mb-6">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: cat.color, boxShadow: `0 0 12px ${cat.color}60` }}
                                                    />
                                                    <span className="font-bold uppercase tracking-[0.2em] text-xs" style={{ color: cat.color }}>{cat.label}</span>
                                                </div>
                                                <AnimatedNumber
                                                    value={cat.kt}
                                                    className="text-5xl font-bold"
                                                />
                                                <div className="text-[11px] text-[#5483B3] mt-3 uppercase tracking-wide font-medium">
                                                    {cat.pct.toFixed(1)}% of all time rendered
                                                </div>
                                            </div>
                                            <div className="relative z-10 w-full h-2.5 bg-white/[0.06] rounded-full mt-8 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cat.pct}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: cat.color, boxShadow: `0 0 12px ${cat.color}60, 0 0 4px ${cat.color}` }}
                                                />
                                            </div>
                                        </div>
                                    </TiltCard>
                                </motion.div>
                            ))}
                        </section>

                        {/* ══════════════════════════════════════════════════
                            SECTION 4 — Milestone Journey (full width)
                        ══════════════════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <TiltCard>
                                <div className="glass-data rounded-2xl p-6 md:p-10">
                                    <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5483B3] mb-8 md:mb-10">
                                        Milestone Journey
                                    </div>

                                    {/* Responsive Milestone Journey */}
                                    <div className="relative">
                                        {/* Desktop Horizontal View */}
                                        <div className="hidden md:block relative pb-2 overflow-x-auto scrollbar-hide">
                                            {/* Track line */}
                                            <div className="absolute top-6 left-0 right-0 h-[2px] bg-white/[0.06]" />
                                            <div
                                                className="absolute top-6 left-0 h-[2px]"
                                                style={{
                                                    width: `${(milestoneIndex / (MILESTONES.length - 1)) * 100}%`,
                                                    background: `linear-gradient(90deg, #5483B3, ${milestoneColor})`,
                                                    boxShadow: `0 0 8px ${milestoneColor}40`,
                                                }}
                                            />

                                            <div className="flex justify-between items-start">
                                                {MILESTONES.map((m, i) => {
                                                    const isReached = liveTotalKT >= m.threshold;
                                                    const isCurrent = milestone.name === m.name;
                                                    const mColor = MILESTONE_COLORS[m.name] || '#5483B3';

                                                    return (
                                                        <div key={m.name} className="flex flex-col items-center min-w-[100px] flex-1">
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                whileInView={{ scale: 1 }}
                                                                viewport={{ once: true }}
                                                                className="w-12 h-12 rounded-full flex items-center justify-center border-2 mb-3 relative z-10"
                                                                style={{
                                                                    borderColor: isReached ? mColor : 'rgba(255,255,255,0.06)',
                                                                    backgroundColor: isReached ? `${mColor}15` : '#0a1628',
                                                                    boxShadow: isCurrent ? `0 0 24px ${mColor}60` : 'none',
                                                                }}
                                                            >
                                                                <span className="text-xs font-bold" style={{ color: isReached ? mColor : '#334155' }}>{i + 1}</span>
                                                            </motion.div>
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-center" style={{ color: isReached ? mColor : '#334155' }}>{m.name}</span>
                                                            <span className="text-[10px] mt-0.5 font-mono" style={{ color: isReached ? `${mColor}90` : '#252f3f' }}>{m.threshold.toLocaleString()}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Mobile Vertical View */}
                                        <div className="md:hidden relative space-y-12 pl-4 py-8">
                                            {/* Vertical Track Line */}
                                            <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-white/[0.06]" />
                                            <div
                                                className="absolute left-[23px] top-0 w-[2px]"
                                                style={{
                                                    height: `${(milestoneIndex / (MILESTONES.length - 1)) * 100}%`,
                                                    background: `linear-gradient(180deg, #5483B3, ${milestoneColor})`,
                                                    boxShadow: `0 0 8px ${milestoneColor}40`,
                                                }}
                                            />

                                            {MILESTONES.map((m, i) => {
                                                const isReached = liveTotalKT >= m.threshold;
                                                const isCurrent = milestone.name === m.name;
                                                const mColor = MILESTONE_COLORS[m.name] || '#5483B3';

                                                return (
                                                    <div key={m.name} className="relative flex items-center gap-6">
                                                        {/* Node */}
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            whileInView={{ scale: 1 }}
                                                            viewport={{ once: true }}
                                                            className="w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 relative z-10"
                                                            style={{
                                                                borderColor: isReached ? mColor : 'rgba(255,255,255,0.06)',
                                                                backgroundColor: isReached ? `${mColor}15` : '#0a1628',
                                                                boxShadow: isCurrent ? `0 0 20px ${mColor}60` : 'none',
                                                            }}
                                                        >
                                                            <span className="text-xs font-bold" style={{ color: isReached ? mColor : '#334155' }}>{i + 1}</span>
                                                        </motion.div>

                                                        {/* Label */}
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: isReached ? mColor : '#334155' }}>{m.name}</span>
                                                            <span className="text-[10px] mt-0.5 font-mono" style={{ color: isReached ? `${mColor}90` : '#252f3f' }}>{m.threshold.toLocaleString()} KT</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>

                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
