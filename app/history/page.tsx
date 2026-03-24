'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { Sidebar, Topbar, MobileSidebar } from '@/components/Layout';
import { Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HistorySkeleton } from '@/components/SkeletonBlock';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TiltCard } from '@/components/TiltCard';

type SessionItem = { start: string; end: string | null; kt: number; isLive?: boolean };
type CycleCategory = { name: string; emoji: string; color: string; total_kt: number; sessions: SessionItem[] };
type CycleHistory = {
    cycleDate: string;
    dateDisplay: string;
    rangeDisplay: string;
    totalKT: number;
    categories: CycleCategory[];
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HistoryPage() {
    const [history, setHistory] = useState<CycleHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExplorer, setSelectedExplorer] = useState<{ dateLabel: string; category: CycleCategory } | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('All');

    useEffect(() => {
        let isMounted = true;
        let lastKnownHistory = '';

        const loadHistory = async () => {
            try {
                const res = await fetchWithAuth('/api/sessions/history');
                if (res.ok && isMounted) {
                    const data = await res.json();

                    // Simple diff check to prevent unnecessary re-renders when data exactly matches
                    const stringified = JSON.stringify(data);
                    if (stringified !== lastKnownHistory) {
                        lastKnownHistory = stringified;
                        setHistory(data);

                        // Update the explorer if it's currently open
                        setSelectedExplorer(prev => {
                            if (!prev) return null;
                            const cycleMatch = data.find((c: any) => c.dateDisplay === prev.dateLabel);
                            if (!cycleMatch) return prev;
                            const catMatch = cycleMatch.categories.find((c: any) => c.name === prev.category.name);
                            if (!catMatch) return prev;
                            return { ...prev, category: catMatch };
                        });
                    }
                }
            } catch (err) {
                // Ignore silent errors during polling
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Initial Load
        loadHistory();

        // Background Polling every 5 seconds for live sync
        const pollInterval = setInterval(loadHistory, 5000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    // Live Ticker for Active Open Sessions
    const [liveTick, setLiveTick] = useState(0);
    useEffect(() => {
        const tickInterval = setInterval(() => {
            setLiveTick(prev => prev + 1); // Force a re-render to update the Math.floor calculation below
        }, 15000); // Only needs to roughly tick every quarter minute to jump numbers
        return () => clearInterval(tickInterval);
    }, []);

    // Inject live increment into the raw history data based on start times of unclosed sessions
    const getLiveSimulatedHistory = () => {
        return history.map(cycle => {
            let cycleTotalExtra = 0;
            const liveCategories = cycle.categories.map(cat => {
                let catTotalExtra = 0;
                const liveSessions = cat.sessions.map(s => {
                    if (s.end === null) {
                        const activeMs = Math.max(0, new Date().getTime() - new Date(s.start).getTime());
                        const activeKt = Math.floor(activeMs / 60000);
                        const extraKt = activeKt - s.kt;
                        if (extraKt > 0) {
                            catTotalExtra += extraKt;
                            cycleTotalExtra += extraKt;
                            return { ...s, kt: activeKt, isLive: true };
                        }
                    }
                    return s;
                });
                return { ...cat, total_kt: cat.total_kt + catTotalExtra, sessions: liveSessions };
            });
            return { ...cycle, totalKT: cycle.totalKT + cycleTotalExtra, categories: liveCategories };
        });
    };

    const simulatedHistory = getLiveSimulatedHistory();

    // Extract unique months that have data
    const availableMonths = useMemo(() => {
        const monthSet = new Map<string, { month: number; year: number }>();
        history.forEach(cycle => {
            const d = new Date(cycle.cycleDate);
            const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
            if (!monthSet.has(key)) {
                monthSet.set(key, { month: d.getMonth(), year: d.getFullYear() });
            }
        });
        // Sort by date descending (most recent first)
        return Array.from(monthSet.entries())
            .sort((a, b) => b[1].year !== a[1].year ? b[1].year - a[1].year : b[1].month - a[1].month)
            .map(([key, val]) => ({ label: key, month: val.month, year: val.year }));
    }, [history]);

    // Filter history by selected month
    const filteredHistory = useMemo(() => {
        if (selectedMonth === 'All') return simulatedHistory;
        const selected = availableMonths.find(m => m.label === selectedMonth);
        if (!selected) return simulatedHistory;
        return simulatedHistory.filter(cycle => {
            const d = new Date(cycle.cycleDate);
            return d.getMonth() === selected.month && d.getFullYear() === selected.year;
        });
    }, [simulatedHistory, selectedMonth, availableMonths]);

    const grandTotalKT = filteredHistory.reduce((acc, curr) => acc + curr.totalKT, 0);

    return (
        <div className="flex min-h-screen text-foreground font-sans">
            <Sidebar />
            <Topbar />
            <MobileSidebar />

            <AnimatePresence>
                {selectedExplorer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedExplorer(null)} />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg glass-hero shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-start bg-white/5">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-3xl">{selectedExplorer.category.emoji}</span>
                                        <h2 className="text-xl font-bold uppercase tracking-widest" style={{ color: selectedExplorer.category.color }}>
                                            {selectedExplorer.category.name}
                                        </h2>
                                    </div>
                                    <div className="text-xs uppercase tracking-[0.2em] text-muted">{selectedExplorer.dateLabel}</div>
                                </div>
                                <button onClick={() => setSelectedExplorer(null)} className="text-muted hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body - Sessions List */}
                            <div className="flex-1 overflow-y-auto p-2">
                                {selectedExplorer.category.sessions && selectedExplorer.category.sessions.length > 0 ? (
                                    <div className="space-y-1">
                                        {selectedExplorer.category.sessions.map((session, idx) => {
                                            const startDisplay = new Date(session.start).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
                                            const endDisplay = session.end ? new Date(session.end).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : 'LIVE';
                                            return (
                                                <div key={idx} className={`flex justify-between items-center p-4 rounded-xl transition-colors border ${session.isLive ? 'bg-accent-blue/10 border-accent-blue/50' : 'hover:bg-white/5 border-transparent hover:border-border/50'}`}>
                                                    <div className="text-sm font-mono tracking-widest text-muted">
                                                        <span className="text-white">{startDisplay}</span>
                                                        <span className="mx-3 opacity-50">—</span>
                                                        <span className={session.isLive ? 'text-accent-blue font-bold animate-pulse' : 'text-white'}>{endDisplay}</span>
                                                    </div>
                                                    <div className="font-mono text-white text-lg font-bold tabular-nums">
                                                        {session.kt} <span className="text-[10px] text-muted font-sans uppercase">KT</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted text-sm uppercase tracking-widest">
                                        No session fragments found.
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer - Total Sum */}
                            <div className="px-6 py-5 border-t border-white/10 bg-black/20 flex justify-between items-center">
                                <span className="text-xs font-bold text-muted tracking-[0.2em] uppercase">Cycle Yield</span>
                                <div className="font-mono text-2xl font-bold tabular-nums text-white drop-shadow-glow-blue">
                                    {selectedExplorer.category.sessions?.reduce((acc, s) => acc + s.kt, 0) || 0} <span className="text-sm text-muted font-sans font-light tracking-widest uppercase">KT Total</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 md:ml-64 pt-20 px-6 pb-24 md:pb-6 overflow-y-auto w-full">
                <div className="max-w-4xl mx-auto py-8">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4 md:gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1 md:mb-2 flex items-center gap-3">
                                <Activity size={28} className="text-accent-blue md:w-8 md:h-8" />
                                ARCHIVE
                            </h1>
                            <p className="text-muted text-[10px] md:text-sm uppercase tracking-[0.2em]">1440 Sovereign Cycles</p>
                        </div>
                        <div className="text-left md:text-right">
                            <div className="text-3xl md:text-4xl font-mono text-white tabular-nums drop-shadow-glow-blue"><AnimatedNumber value={grandTotalKT} className="text-3xl md:text-4xl font-mono text-white tabular-nums" /> <span className="text-xs md:text-base text-muted font-sans font-light uppercase tracking-widest">{selectedMonth === 'All' ? 'Total Archived' : selectedMonth} KT</span></div>
                        </div>
                    </div>

                    {/* ── Month Filter Tabs ── */}
                    {!isLoading && availableMonths.length > 0 && (
                        <div className="mb-8 -mx-2">
                            <div className="flex gap-2 overflow-x-auto px-2 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {/* All tab */}
                                <button
                                    onClick={() => setSelectedMonth('All')}
                                    className={`shrink-0 px-6 py-2.5 h-[42px] rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 border whitespace-nowrap ${
                                        selectedMonth === 'All'
                                            ? 'bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/40 shadow-[0_0_14px_rgba(74,158,255,0.25)]'
                                            : 'bg-white/[0.03] text-[#5483B3] border-white/[0.06] hover:bg-white/[0.06] hover:text-[#7DA0CA]'
                                    }`}
                                >
                                    All
                                </button>

                                {availableMonths.map(m => {
                                    const isActive = selectedMonth === m.label;
                                    // Show short month name, and year only if it's different from the first month's year
                                    const shortLabel = MONTH_NAMES[m.month];
                                    const showYear = availableMonths.some(other => other.month === m.month && other.year !== m.year) || m.year !== new Date().getFullYear();

                                    return (
                                        <button
                                            key={m.label}
                                            onClick={() => setSelectedMonth(m.label)}
                                            className={`shrink-0 px-6 py-2.5 h-[42px] rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 border whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-[#4a9eff]/15 text-[#4a9eff] border-[#4a9eff]/40 shadow-[0_0_14px_rgba(74,158,255,0.25)]'
                                                    : 'bg-white/[0.03] text-[#5483B3] border-white/[0.06] hover:bg-white/[0.06] hover:text-[#7DA0CA]'
                                            }`}
                                        >
                                            {shortLabel}
                                            {showYear && <span className="ml-1 opacity-50 text-[9px]">{m.year}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-20"><HistorySkeleton /></div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-8 glass-data rounded-3xl border border-white/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,158,255,0.05)_0%,transparent_70%)] animate-pulse" />
                            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 relative z-10">
                                <Activity size={32} className="text-muted/20" />
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-[0.3em] text-white/80 mb-3 relative z-10">Archive Empty</h3>
                            <p className="text-muted/60 text-sm uppercase tracking-[0.15em] max-w-xs text-center leading-relaxed relative z-10">
                                The chronicle is currently blank. Complete your first cycle to begin the record.
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Vertical spine */}
                            <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent-blue/40 via-accent-blue/20 to-transparent pointer-events-none" />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedMonth}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-0"
                                >
                                    {filteredHistory.map((cycle, i) => {
                                        const hasPrimary = cycle.categories.some(c => c.sessions && c.sessions.length > 0 && c.total_kt > 0);
                                        const isSovereign = hasPrimary && cycle.totalKT >= 120;
                                        const nodeColor = isSovereign ? '#22c55e' : cycle.totalKT > 0 ? '#2F80ED' : '#334155';

                                        return (
                                            <motion.div
                                                key={cycle.cycleDate}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                                className="relative pl-14 md:pl-16 pb-8"
                                            >
                                                {/* Node on spine */}
                                                <div className="absolute left-2.5 md:left-4.5 top-4 z-10">
                                                    <div
                                                        className="w-3.5 h-3.5 rounded-full border-2"
                                                        style={{
                                                            backgroundColor: nodeColor,
                                                            borderColor: nodeColor,
                                                            boxShadow: isSovereign ? `0 0 10px ${nodeColor}60` : `0 0 6px ${nodeColor}30`,
                                                        }}
                                                    />
                                                </div>

                                                {/* Connecting horizontal line */}
                                                <div className="absolute left-[23px] md:left-[31px] top-[22px] w-5 md:w-4 h-px" style={{ backgroundColor: `${nodeColor}40` }} />

                                                {/* Day card */}
                                                <TiltCard className="max-w-3xl">
                                                    <div className="glass-data rounded-2xl overflow-hidden hover:ring-1 hover:ring-white/[0.1] transition-all">
                                                        <div className="bg-white/[0.03] border-b border-white/[0.06] px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h2 className="text-lg font-bold text-white">{cycle.dateDisplay}</h2>
                                                                    {isSovereign && (
                                                                        <span className="text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 rounded border border-[#22c55e40] text-[#22c55e] bg-[#22c55e10]">
                                                                            Sovereign
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-muted/50">{cycle.rangeDisplay}</div>
                                                            </div>
                                                            <div className="text-xl font-mono text-accent-blue font-bold tabular-nums">
                                                                {cycle.totalKT} <span className="text-[10px] font-sans text-muted/40 tracking-widest uppercase font-light">KT</span>
                                                            </div>
                                                        </div>

                                                        <div className="p-1.5">
                                                            {cycle.categories.map((cat, j) => {
                                                                const isLive = cat.sessions.some(s => s.isLive);
                                                                const catColor = cat.color || '#64748b';
                                                                const ktPct = cycle.totalKT > 0 ? (cat.total_kt / cycle.totalKT) * 100 : 0;

                                                                return (
                                                                    <button
                                                                        key={j}
                                                                        onClick={() => setSelectedExplorer({ dateLabel: cycle.dateDisplay, category: cat })}
                                                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group text-left cursor-pointer ${isLive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                            <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">{cat.emoji}</span>
                                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                                <span className="font-bold uppercase tracking-widest text-sm truncate" style={{ color: catColor }}>
                                                                                    {cat.name} {isLive && <span className="text-[10px] ml-1 text-accent-blue animate-pulse">● LIVE</span>}
                                                                                </span>
                                                                                {/* Mini horizontal KT bar */}
                                                                                <div className="h-1 w-full bg-white/[0.04] rounded-full mt-1.5 max-w-[160px]">
                                                                                    <motion.div
                                                                                        initial={{ width: 0 }}
                                                                                        animate={{ width: `${ktPct}%` }}
                                                                                        transition={{ duration: 0.6, delay: i * 0.08 + j * 0.05 }}
                                                                                        className="h-full rounded-full"
                                                                                        style={{ backgroundColor: catColor }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-mono text-white text-lg tabular-nums group-hover:text-accent-blue transition-colors shrink-0 ml-3">
                                                                            {cat.total_kt} <span className="text-xs text-muted/40 group-hover:text-accent-blue/70">KT</span>
                                                                        </div>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </TiltCard>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
