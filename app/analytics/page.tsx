'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Sidebar, Topbar, MobileSidebar } from '@/components/Layout';
import { fetchWithAuth } from '@/lib/api';
import { ChevronLeft, ChevronRight, Activity, Calendar, Zap, AlertTriangle, Info, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isAfter, isBefore, addMonths, subMonths, startOfDay, parseISO } from 'date-fns';
import { AnalyticsSkeleton } from '@/components/SkeletonBlock';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TiltCard } from '@/components/TiltCard';

type SessionItem = { start: string; end: string | null; kt: number; };
type CycleCategory = { name: string; emoji: string; color: string; category_type: string; total_kt: number; sessions: SessionItem[] };
type CycleHistory = {
    cycleDate: string;
    dateDisplay: string;
    rangeDisplay: string;
    totalKT: number;
    categories: CycleCategory[];
};

type ReportStats = {
    averageScore: number;
    totalPrimary: number;
    totalRecorded: number;
    sovereignDays: number;
    daysAnalyzed: number;
    bestDay: { date: string, score: number, tag: string } | null;
    worstDay: { date: string, score: number, tag: string } | null;
};

type SovereigntyReportData = {
    weekly: ReportStats;
    monthly: ReportStats;
};

// Heatmap Color Logic
const getHeatmapColor = (primaryKT: number, scatteredKT: number, totalKT: number) => {
    if (totalKT === 0) return '#0a0f1e';

    // Total conscious tracked KT (excluding essential)
    const consciousBase = primaryKT + scatteredKT;
    if (consciousBase === 0) return '#0a0f1e'; // If they only did Essential, score is effectively neutral/uncalculated by definition, fallback to base.

    const score = (primaryKT / consciousBase) * 100;

    if (score < 40) return '#1a2744';
    if (score < 55) return '#1e3a6e';
    if (score < 70) return '#1d5fa8';
    if (score < 80) return '#2979d4';
    if (score < 90) return '#4a9eff';
    return '#7ec8ff';
};

const getCategoryColor = (categoryType: string) => {
    if (categoryType === 'primary') return '#22c55e';
    if (categoryType === 'essential') return '#eab308';
    if (categoryType === 'scattered') return '#ef4444';
    return '#2979d4';
};

export default function AnalyticsPage() {
    const [history, setHistory] = useState<CycleHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

    const [noteText, setNoteText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const noteAbortControllerRef = useRef<AbortController | null>(null);

    const [reportData, setReportData] = useState<SovereigntyReportData | null>(null);
    const [isReportLoading, setIsReportLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let lastKnownHistory = '';

        const loadHistory = async () => {
            try {
                const res = await fetchWithAuth('/api/sessions/history');
                if (res.ok && isMounted) {
                    const data = await res.json();

                    const stringified = JSON.stringify(data);
                    if (stringified !== lastKnownHistory) {
                        lastKnownHistory = stringified;
                        setHistory(data);
                    }
                }
            } catch (err) {
                // Ignore silent poll errors
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Initial 
        loadHistory();

        // Sync via optimized background polling
        const pollInterval = setInterval(loadHistory, 5000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        }
    }, []);

    // Active session ticking
    const [liveTick, setLiveTick] = useState(0);
    useEffect(() => {
        const tickInterval = setInterval(() => setLiveTick(prev => prev + 1), 15000); // 15s refresh
        return () => clearInterval(tickInterval);
    }, []);

    // Sovereignty Report Polling
    useEffect(() => {
        let isMounted = true;

        const loadReport = async () => {
            try {
                const res = await fetchWithAuth('/api/sovereignty-report');
                if (res.ok && isMounted) {
                    const data = await res.json();
                    setReportData(data);
                }
            } catch (err) {
                // Ignore silent poll errors
            } finally {
                if (isMounted) setIsReportLoading(false);
            }
        };

        loadReport();
        const pollInterval = setInterval(loadReport, 60000); // 60s refresh

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    // Merge active session durations into the base memory map for the charts seamlessly
    const simulatedHistoryMap = useMemo(() => {
        const map = new Map<string, CycleHistory>();

        history.forEach(h => {
            let extraCycleKt = 0;
            const liveCategories = h.categories.map(cat => {
                let extraCatKt = 0;
                cat.sessions.forEach(s => {
                    if (s.end === null) {
                        const activeKt = Math.floor(Math.max(0, new Date().getTime() - new Date(s.start).getTime()) / 60000);
                        const extra = activeKt - s.kt;
                        if (extra > 0) extraCatKt += extra;
                    }
                });

                extraCycleKt += extraCatKt;
                return { ...cat, total_kt: cat.total_kt + extraCatKt };
            });

            map.set(h.cycleDate, {
                ...h,
                totalKT: h.totalKT + extraCycleKt,
                categories: liveCategories
            });
        });

        return map;
    }, [history, liveTick]);



    const getDayData = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return simulatedHistoryMap.get(dateStr);
    };

    // Computations for specific date
    const selectedData = getDayData(selectedDate);

    // Fetch note for the selected date
    useEffect(() => {
        let isMounted = true;
        setNoteText('');
        setSaveStatus(null);
        setIsSaving(false);

        if (noteAbortControllerRef.current) {
            noteAbortControllerRef.current.abort();
        }

        const controller = new AbortController();
        noteAbortControllerRef.current = controller;

        const fetchNote = async () => {
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const res = await fetchWithAuth(`/api/cycle-notes/${dateStr}`, {
                    signal: controller.signal
                });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data.note !== undefined && data.note !== null) {
                        setNoteText(data.note);
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching note', err);
                }
            }
        };

        fetchNote();

        return () => {
            isMounted = false;
        };
    }, [selectedDate]);

    const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        if (text.length <= 120) {
            setNoteText(text);

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            setSaveStatus(null);

            saveTimeoutRef.current = setTimeout(async () => {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                setIsSaving(true);
                try {
                    const res = await fetchWithAuth(`/api/cycle-notes/${dateStr}`, {
                        method: 'PUT',
                        body: JSON.stringify({ note: text })
                    });

                    if (res.ok) {
                        setSaveStatus('success');
                        setTimeout(() => setSaveStatus(null), 2000);
                    } else {
                        setSaveStatus('error');
                    }
                } catch (err) {
                    setSaveStatus('error');
                } finally {
                    setIsSaving(false);
                }
            }, 800);
        }
    };

    const computeStats = (data: CycleHistory | undefined): { total: number, primary: number, essential: number, scattered: number, score: number, topSection: CycleCategory | null } => {
        if (!data) return { total: 0, primary: 0, essential: 0, scattered: 0, score: 0, topSection: null };

        let primary = 0;
        let essential = 0;
        let scattered = 0;
        let topSection: CycleCategory | null = null;
        let maxKt = -1;

        data.categories.forEach(c => {
            if (c.category_type === 'primary') primary += c.total_kt;
            else if (c.category_type === 'essential') essential += c.total_kt;
            else if (c.category_type === 'scattered') scattered += c.total_kt;

            if (c.total_kt > maxKt) {
                maxKt = c.total_kt;
                topSection = c;
            }
        });

        const consciousBase = primary + scattered;
        const score = consciousBase > 0 ? (primary / consciousBase) * 100 : 0;

        return { total: data.totalKT, primary, essential, scattered, score, topSection };
    };

    const stats = computeStats(selectedData);
    const scoreFormatted = stats.score.toFixed(1);

    // Compute top sections array for the selected date
    const topSections = useMemo(() => {
        if (!selectedData || !selectedData.categories) return [];
        return [...selectedData.categories]
            .filter(c => c.total_kt > 0)
            .sort((a, b) => b.total_kt - a.total_kt)
            .slice(0, 5);
    }, [selectedData]);

    // Bounds for navigation
    const oldestDateStr = history.length > 0 ? history[history.length - 1].cycleDate : format(new Date(), 'yyyy-MM-dd');
    const oldestDateObj = startOfMonth(parseISO(oldestDateStr));
    const currentMonthObj = startOfMonth(new Date());

    const canGoBack = isAfter(startOfMonth(currentMonthDate), oldestDateObj);
    const canGoForward = isBefore(startOfMonth(currentMonthDate), currentMonthObj);

    // Grid Generation
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(currentMonthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Offset for week start (Assuming Monday start for sovereign aesthetics, or Sunday. standard getDay: 0 is Sun).
    const startOffset = monthStart.getDay(); // 0-6 (0 is Sunday, let's keep Sunday as first column)

    const ReportCard = ({ title, stats, daysLabel }: { title: string, stats: ReportStats, daysLabel: string }) => {
        const scoreColor = stats.averageScore >= 70 ? 'text-[#22c55e]' : stats.averageScore >= 50 ? 'text-[#eab308]' : 'text-[#ef4444]';
        const gradFrom = stats.averageScore >= 70 ? '#22c55e' : stats.averageScore >= 50 ? '#eab308' : '#ef4444';
        const gradTo = stats.averageScore >= 70 ? '#4ade80' : stats.averageScore >= 50 ? '#fbbf24' : '#f87171';

        return (
            <div className="glass-data rounded-3xl p-8 flex flex-col h-full relative overflow-hidden">
                {/* Decorative subtle background gradient based on score */}
                <div
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none"
                    style={{ backgroundColor: stats.averageScore >= 70 ? '#22c55e' : stats.averageScore >= 50 ? '#eab308' : '#ef4444' }}
                />

                <div className="text-xs uppercase tracking-widest text-muted font-bold mb-6">{title}</div>

                <div className="flex items-end gap-2 mb-8 z-10">
                    <span
                        className="text-6xl font-bold tracking-tighter leading-none bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
                    >
                        {Math.round(stats.averageScore)}
                    </span>
                    <span
                        className="text-3xl font-bold mb-1 bg-clip-text text-transparent opacity-70"
                        style={{ backgroundImage: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
                    >%</span>
                </div>

                <div className="space-y-4 mb-8 z-10 flex-grow">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                        <span className="text-sm text-muted">Primary Yield</span>
                        <span className="text-white font-mono font-bold tracking-tight">{stats.totalPrimary} <span className="text-muted/50 text-xs text-sans">KT</span></span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                        <span className="text-sm text-muted">Constructed Volume</span>
                        <span className="text-white font-mono font-bold tracking-tight">{stats.totalRecorded} <span className="text-muted/50 text-xs text-sans">KT</span></span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border/50">
                        <span className="text-sm text-muted">Sovereign Days</span>
                        <span className="text-white font-bold text-sm">{daysLabel}</span>
                    </div>
                </div>

                <div className="space-y-3 z-10 mt-auto bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted mb-1 flex justify-between">
                            <span>Highest Yield</span>
                            {stats.bestDay && <span className="text-[#22c55e] font-mono">{Math.round(stats.bestDay.score)}%</span>}
                        </div>
                        {stats.bestDay ? (
                            <div className="text-sm text-white">
                                {stats.bestDay.date}
                                {stats.bestDay.tag && <span className="ml-2 text-muted italic">"{stats.bestDay.tag}"</span>}
                            </div>
                        ) : (
                            <div className="text-sm text-muted/50 italic">No conscious days recorded</div>
                        )}
                    </div>
                    <div className="pt-3 border-t border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-muted mb-1 flex justify-between">
                            <span>Lowest Yield</span>
                            {stats.worstDay && <span className="text-[#ef4444] font-mono">{Math.round(stats.worstDay.score)}%</span>}
                        </div>
                        {stats.worstDay ? (
                            <div className="text-sm text-white">
                                {stats.worstDay.date}
                                {stats.worstDay.tag && <span className="ml-2 text-muted italic">"{stats.worstDay.tag}"</span>}
                            </div>
                        ) : (
                            <div className="text-sm text-muted/50 italic">No conscious days recorded</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen text-foreground font-sans relative">
            <Sidebar />
            <Topbar />
            <MobileSidebar />

            <main className="flex-1 md:ml-64 pt-20 px-6 pb-24 md:pb-6 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto py-8">

                    <div className="flex items-center gap-3 mb-8 md:mb-10">
                        <Target size={28} className="text-accent-blue md:w-8 md:h-8" />
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">COMMAND CENTER</h1>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20"><AnalyticsSkeleton /></div>
                    ) : (
                        <div className="space-y-12">

                            {/* SECTION 1: SOVEREIGNTY HEATMAP */}
                            <section className="glass-data rounded-2xl p-6 w-full">
                                <div className="flex items-center justify-between mb-6 gap-8">
                                    <h2 className="text-xs md:text-sm font-bold uppercase tracking-widest text-white">
                                        {format(currentMonthDate, 'MMMM yyyy')}
                                    </h2>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => canGoBack && setCurrentMonthDate(subMonths(currentMonthDate, 1))}
                                            disabled={!canGoBack}
                                            className={`p-1.5 rounded-md border transition-colors ${canGoBack ? 'bg-white/5 border-border hover:border-accent-blue text-white' : 'border-transparent text-muted/30 cursor-not-allowed'}`}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => canGoForward && setCurrentMonthDate(addMonths(currentMonthDate, 1))}
                                            disabled={!canGoForward}
                                            className={`p-1.5 rounded-md border transition-colors ${canGoForward ? 'bg-white/5 border-border hover:border-accent-blue text-white' : 'border-transparent text-muted/30 cursor-not-allowed'}`}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                    <div className="grid grid-cols-7 gap-1 w-fit mx-auto min-w-[240px]">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <div key={`${d}-${i}`} className="text-center text-[12px] font-mono text-muted mb-1">{d}</div>
                                    ))}

                                    {Array.from({ length: startOffset }).map((_, i) => (
                                        <div key={`empty-${i}`} className="w-8 h-8 rounded-md" />
                                    ))}

                                    {daysInMonth.map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const dData = getDayData(day);
                                        const dStats = computeStats(dData);

                                        const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
                                        const isSelected = isSameDay(day, selectedDate);

                                        let baseColor = dData ? getHeatmapColor(dStats.primary, dStats.scattered, dStats.total) : '#0a0f1e';

                                        return (
                                            <div key={dateStr} className="relative w-8 h-8 group">
                                                <button
                                                    disabled={isFuture}
                                                    onClick={() => setSelectedDate(day)}
                                                    onMouseEnter={() => setHoveredDateStr(dateStr)}
                                                    onMouseLeave={() => setHoveredDateStr(null)}
                                                    className={`w-8 h-8 rounded-md transition-all duration-300 relative overflow-hidden block
                                                        ${isFuture ? 'opacity-30 cursor-not-allowed bg-transparent border border-border/20' : 'cursor-pointer hover:ring-2 hover:ring-white/40'}
                                                        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}
                                                        ${isSameDay(day, new Date()) && !isFuture ? 'ring-2 ring-white/60 animate-glow-pulse' : ''}
                                                    `}
                                                    style={{ backgroundColor: isFuture ? 'transparent' : baseColor }}
                                                />

                                                {/* Tooltip on Desktop */}
                                                {!isFuture && hoveredDateStr === dateStr && (
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 glass-hero shadow-2xl rounded-xl p-3 z-50 pointer-events-none hidden md:block">
                                                        <div className="text-white font-bold text-sm mb-2">{format(day, 'MMMM do, yyyy')}</div>
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between"><span className="text-muted">Total KT</span><span className="font-mono text-white">{dStats.total}</span></div>
                                                            <div className="flex justify-between"><span className="text-accent-green">Primary</span><span className="font-mono text-white">{dStats.primary}</span></div>
                                                            <div className="flex justify-between"><span className="text-accent-yellow">Essential</span><span className="font-mono text-white">{dStats.essential}</span></div>
                                                            <div className="flex justify-between"><span className="text-accent-red">Scattered</span><span className="font-mono text-white">{dStats.scattered}</span></div>
                                                        </div>
                                                        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between font-bold">
                                                            <span className="text-muted">Score</span>
                                                            <span className="font-mono" style={{ color: getHeatmapColor(dStats.primary, dStats.scattered, dStats.total) }}>
                                                                {dData && (dStats.primary + dStats.scattered > 0) ? `${dStats.score.toFixed(1)}%` : '---'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted">
                                    <span className="mr-2">Yields</span>
                                    <div className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: '#0a0f1e' }} title="Undeclared" />
                                    <div className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: '#1e3a6e' }} title="0-55%" />
                                    <div className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: '#2979d4' }} title="55-80%" />
                                    <div className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: '#4a9eff' }} title="80-90%" />
                                    <div className="w-[12px] h-[12px] rounded-[2px] relative" style={{ backgroundColor: '#7ec8ff' }} title="+90% Elite">
                                        <div className="absolute inset-0 bg-[#7ec8ff] blur-[4px] opacity-60 rounded-full" />
                                    </div>
                                </div>
                            </section>


                            {/* SECTION 2: DAILY BREAKDOWN GRAPHS */}
                            <section>
                                <div className="flex flex-col mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-3">
                                        {format(selectedDate, 'do MMMM yyyy')}
                                    </h3>

                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="text-3xl font-mono tabular-nums font-bold text-accent-blue mr-4">
                                            <AnimatedNumber value={stats.total} className="text-3xl font-mono tabular-nums font-bold text-accent-blue" /> <span className="text-sm font-sans text-muted tracking-widest font-light uppercase">KT Rendered</span>
                                        </div>
                                        <div className="px-3 py-1 bg-accent-green/10 border border-accent-green/30 text-accent-green rounded-full text-xs font-bold font-mono">
                                            PRI: {stats.primary} KT
                                        </div>
                                        <div className="px-3 py-1 bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow rounded-full text-xs font-bold font-mono">
                                            ESS: {stats.essential} KT
                                        </div>
                                        <div className="px-3 py-1 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-full text-xs font-bold font-mono">
                                            SCT: {stats.scattered} KT
                                        </div>
                                    </div>
                                </div>

                                {/* DAY TAG FIELD */}
                                <div className="mb-6 w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs uppercase tracking-widest text-muted">DAY TAG</label>
                                        <div className="h-4 flex items-center">
                                            {saveStatus === 'success' && <span className="text-[10px] text-accent-green uppercase font-bold tracking-widest animate-pulse">Saved</span>}
                                            {saveStatus === 'error' && <span className="text-[10px] text-accent-red uppercase font-bold tracking-widest">Could not save</span>}
                                            {isSaving && <span className="text-[10px] text-muted uppercase tracking-widest">Saving...</span>}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={noteText}
                                        onChange={handleNoteChange}
                                        placeholder="Capture this day in a word or phrase..."
                                        maxLength={120}
                                        className="w-full glass-interactive rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>

                                <div className="glass-data rounded-3xl overflow-hidden flex flex-col xl:flex-row relative" style={{ minHeight: '300px', height: 'auto' }}>
                                    {stats.total === 0 ? (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted tracking-widest uppercase text-sm">
                                            No KT declared for this cycle
                                        </div>
                                    ) : (
                                        <>
                                            {/* Bar Chart (Left) */}
                                            <div className="flex-1 p-8 border-b xl:border-b-0 xl:border-r border-white/[0.06] relative flex flex-col justify-end h-full">
                                                <div className="absolute top-8 left-8 text-xs uppercase tracking-widest text-muted">Section Volume</div>

                                                <div className="flex items-end justify-around h-[250px] w-full gap-2 mt-auto">
                                                    <AnimatePresence>
                                                        {selectedData?.categories.map((cat) => {
                                                            const maxOverall = Math.max(...selectedData.categories.map(c => c.total_kt));
                                                            const heightPercent = maxOverall > 0 ? (cat.total_kt / maxOverall) * 100 : 0;
                                                            return (
                                                                <div key={cat.name} className="flex flex-col justify-end items-center group relative flex-1 max-w-[60px] h-full">

                                                                    {/* Custom Tooltip */}
                                                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background border border-border rounded-lg px-3 py-2 text-center pointer-events-none z-10 shadow-xl">
                                                                        <div className="text-white text-xs font-bold mb-1">{cat.name}</div>
                                                                        <div className="text-muted text-[10px] uppercase tracking-widest mb-1">{cat.category_type}</div>
                                                                        <div className="text-accent-blue font-mono text-sm">{cat.total_kt} KT</div>
                                                                    </div>

                                                                    <motion.div
                                                                        initial={{ height: 0 }}
                                                                        animate={{ height: `${heightPercent}%` }}
                                                                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                                                        className="w-full rounded-t-sm transition-all hover:brightness-125 min-h-[4px]"
                                                                        style={{ backgroundColor: getCategoryColor(cat.category_type) }}
                                                                    />
                                                                    <div className="mt-4 text-2xl">{cat.emoji}</div>
                                                                </div>
                                                            )
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Donut Chart (Right) */}
                                            <div className="flex-1 p-8 relative flex items-center justify-center h-full">
                                                <div className="absolute top-8 left-8 text-xs uppercase tracking-widest text-muted">Yield Distribution</div>
                                                <CustomDonut categories={selectedData?.categories || []} total={stats.total} />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* TOP SECTIONS PANEL */}
                                {topSections.length > 0 && (
                                    <div className="mt-6 glass-data rounded-3xl overflow-hidden p-8">
                                        <div className="text-xs uppercase tracking-widest text-muted mb-6">Top Sections</div>
                                        <div className="space-y-6">
                                            {topSections.map((section, idx) => {
                                                const maxKT = topSections[0].total_kt;
                                                const progressPercentage = maxKT > 0 ? (section.total_kt / maxKT) * 100 : 0;
                                                const barColor = getCategoryColor(section.category_type);

                                                return (
                                                    <div key={section.name} className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl">{section.emoji}</span>
                                                                <span className="text-white font-bold">{section.name}</span>
                                                                <span
                                                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border"
                                                                    style={{
                                                                        color: barColor,
                                                                        backgroundColor: `${barColor}1a`,
                                                                        borderColor: `${barColor}4d`
                                                                    }}
                                                                >
                                                                    {section.category_type}
                                                                </span>
                                                            </div>
                                                            <div className="text-accent-blue font-mono font-bold">
                                                                {section.total_kt} KT
                                                            </div>
                                                        </div>
                                                        <div className="h-[3px] w-full bg-[#152030] rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${progressPercentage}%` }}
                                                                transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: barColor }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </section>


                            {/* SECTION 3: SOVEREIGN STATS ROW */}
                            <section>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <TiltCard className="w-full">
                                        <div className="glass-data rounded-3xl p-6 h-full">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted/50 mb-4">KT Rendered</div>
                                            <div className="text-3xl font-mono text-white tracking-tight"><AnimatedNumber value={stats.total} /> <span className="text-muted/40 text-xl">/ 1440</span></div>
                                        </div>
                                    </TiltCard>

                                    <TiltCard className="w-full">
                                        <div className="glass-data rounded-3xl p-6 h-full">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted/50 mb-4">Sovereignty Score</div>
                                            <div className="text-3xl font-mono font-bold" style={{ color: stats.total > 0 ? getHeatmapColor(stats.primary, stats.scattered, stats.total) : '#64748b' }}>
                                                {stats.primary + stats.scattered > 0 ? `${scoreFormatted}%` : '---'}
                                            </div>
                                        </div>
                                    </TiltCard>

                                    <TiltCard className="w-full">
                                        <div className="glass-data rounded-3xl p-6 h-full">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted/50 mb-4">Primary Dominance</div>
                                            <div className="text-3xl font-mono text-white">
                                                {stats.total > 0 ? `${((stats.primary / stats.total) * 100).toFixed(1)}%` : '---'}
                                            </div>
                                        </div>
                                    </TiltCard>

                                    <TiltCard className="w-full">
                                        <div className="glass-data rounded-3xl p-6 h-full">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted/50 mb-4">Drift Rate</div>
                                            <div className="text-3xl font-mono text-white">
                                                {stats.total > 0 ? `${((stats.scattered / stats.total) * 100).toFixed(1)}%` : '---'}
                                            </div>
                                        </div>
                                    </TiltCard>

                                    <TiltCard className="w-full">
                                        <div className="glass-data rounded-3xl p-6 relative overflow-hidden h-full">
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted/50 mb-4 relative z-10">Top Section</div>
                                            {stats.topSection ? (
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <span className="text-4xl">{stats.topSection.emoji}</span>
                                                    <span className="text-lg font-bold uppercase tracking-widest truncate" style={{ color: getCategoryColor(stats.topSection.category_type) }}>
                                                        {stats.topSection.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-xl font-mono text-muted relative z-10">---</div>
                                            )}
                                            {stats.topSection && (
                                                <div className="absolute -right-4 -bottom-8 opacity-5 text-9xl pointer-events-none">{stats.topSection.emoji}</div>
                                            )}
                                        </div>
                                    </TiltCard>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* SECTION 4: SOVEREIGNTY REPORT (ALWAYS VISIBLE) */}
                    <section className="mt-12 xl:mt-16">
                        <div className="text-xs uppercase tracking-widest text-muted mb-6 font-bold">SOVEREIGNTY REPORT</div>

                        {isReportLoading || !reportData ? (
                            <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-t-2 border-accent-blue animate-spin" /></div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <ReportCard title="THIS WEEK" stats={reportData.weekly} daysLabel={`${reportData.weekly.sovereignDays} of ${reportData.weekly.daysAnalyzed} days`} />
                                <ReportCard title="THIS MONTH" stats={reportData.monthly} daysLabel={`${reportData.monthly.sovereignDays} of ${reportData.monthly.daysAnalyzed} days`} />
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

// Sub-component for strict SVG Animated Donut Chart
function CustomDonut({ categories, total }: { categories: CycleCategory[], total: number }) {
    const size = 280;
    const strokeWidth = 35;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className="text-4xl font-mono font-bold text-white tabular-nums">{total}</span>
                <span className="text-xs text-muted uppercase tracking-widest mt-1">KT</span>
            </div>

            <svg width={size} height={size} className="-rotate-90 origin-center absolute inset-0">
                {categories.map((cat, i) => {
                    const ratio = cat.total_kt / total;
                    const dashLength = ratio * circumference;
                    const dashOffset = -currentOffset;

                    // Adjust current offset for next slice
                    currentOffset += dashLength;

                    // Simple mathematical midpoint for tooltip placement could be done here, 
                    // but for brevity and resilience we keep it as a clean visual SVG and use CSS tooltips over paths.

                    return (
                        <motion.circle
                            key={cat.name}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{ strokeDasharray: `${dashLength} ${circumference}` }}
                            transition={{ duration: 1, type: "spring", bounce: 0, delay: i * 0.1 }}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={getCategoryColor(cat.category_type)}
                            strokeWidth={strokeWidth}
                            strokeDashoffset={dashOffset}
                            className="cursor-pointer hover:stroke-[40px] transition-all origin-center"
                            style={{ transformOrigin: 'center' }}
                        >
                            <title>{`${cat.name} • ${cat.category_type.toUpperCase()} • ${cat.total_kt} KT (${(ratio * 100).toFixed(1)}%)`}</title>
                        </motion.circle>
                    );
                })}
            </svg>
        </div>
    )
}
