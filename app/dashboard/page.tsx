'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, getToken } from '@/lib/api';
import { Sidebar, Topbar, MobileSidebar } from '@/components/Layout';
import { ProtocolPanel } from '@/components/ProtocolPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardSkeleton } from '@/components/SkeletonBlock';
import { PageTransition } from '@/components/PageTransition';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TiltCard } from '@/components/TiltCard';
import { Zap, CalendarDays, Rocket, PowerOff, Trash2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';

type CategoryType = 'primary' | 'essential' | 'scattered';
type Category = { id: string; name: string; emoji: string; color: string; category_type: CategoryType; is_default: boolean };
type Session = { id: string; category_id: string; start_time: string };

export default function DashboardPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [allocatedKT, setAllocatedKT] = useState(0);
    const [cycleData, setCycleData] = useState<{ start: string; end: string } | null>(null);

    // Live ticking timer for the active session
    const [liveSessionMinutes, setLiveSessionMinutes] = useState(0);
    const [liveSessionSeconds, setLiveSessionSeconds] = useState(0);

    const [distribution, setDistribution] = useState<Record<string, number>>({});
    const [totalLifetimeKT, setTotalLifetimeKT] = useState(0);

    // UI States
    const [isInitiated, setIsInitiated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal States
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmoji, setEditEmoji] = useState('');
    const [editCategoryType, setEditCategoryType] = useState<CategoryType>('primary');
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    const router = useRouter();

    const loadData = async () => {
        const token = getToken();
        if (!token) return router.push('/login');

        const catRes = await fetchWithAuth('/api/categories');
        if (catRes.ok) {
            const data = await catRes.json();
            setCategories(data.categories || []);
        }

        const liveRes = await fetchWithAuth('/api/sessions/live');
        if (liveRes.ok) {
            const liveData = await liveRes.json();
            setActiveSession(liveData.activeSession || null);
            setAllocatedKT(liveData.allocated_kt || 0); // ONLY completed sessions — liveSessionMinutes adds active ticking separately
            setCycleData(liveData.cycle || null);
            setTotalLifetimeKT(liveData.total_lifetime_kt || 0);
        }

        // Fetch distribution from stats
        const statsRes = await fetchWithAuth('/api/dashboard/stats');
        if (statsRes.ok) {
            const stats = await statsRes.json();
            setDistribution(stats.distribution || {});
        }

        setIsLoading(false);
    };

    useEffect(() => { loadData(); }, [router]);

    // Live Timer Engine
    useEffect(() => {
        if (!activeSession) {
            setLiveSessionMinutes(0);
            setLiveSessionSeconds(0);
            return;
        }

        const updateTimer = () => {
            let start = new Date(activeSession.start_time).getTime();
            if (cycleData?.start) {
                const cycleStartMs = new Date(cycleData.start).getTime();
                if (start < cycleStartMs) {
                    start = cycleStartMs; // Floor it to cycle boundary
                }
            }

            const now = new Date().getTime();
            const diffMs = Math.max(0, now - start);
            setLiveSessionMinutes(Math.floor(diffMs / 60000));
            setLiveSessionSeconds(Math.floor((diffMs % 60000) / 1000));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeSession, cycleData]);

    const handleSwitchCategory = async (categoryId: string) => {
        if (activeSession?.category_id === categoryId) return; // Already active

        const res = await fetchWithAuth('/api/sessions/switch', {
            method: 'POST', body: JSON.stringify({ category_id: categoryId }),
        });

        if (res.ok) {
            toast.success(`Switched to ${categories.find(c => c.id === categoryId)?.name || 'Section'}`);
            loadData();
        } else {
            toast.error("Failed to switch section");
        }
    };

    const openEditModal = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation();
        setEditingCategory(cat);
        setEditName(cat.name);
        setEditEmoji(cat.emoji);
        setEditCategoryType(cat.category_type);
    };

    const handleSaveCategory = async () => {
        if (!editingCategory) return;
        if (!editName.trim() || !editEmoji.trim()) return;

        setIsSavingCategory(true);
        const res = await fetchWithAuth(`/api/categories/${editingCategory.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                name: editName,
                emoji: editEmoji,
                category_type: editingCategory.is_default ? editingCategory.category_type : editCategoryType
            })
        });

        if (res.ok) {
            toast.success("Section updated");
            setEditingCategory(null);
            loadData();
        } else {
            toast.error("Failed to update section");
        }
        setIsSavingCategory(false);
    };

    const handleDeleteCategory = async (e: React.MouseEvent, categoryId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this KT Section and all its history?')) return;

        const res = await fetchWithAuth(`/api/categories/${categoryId}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success("Section deleted");
            loadData();
        } else {
            toast.error("Failed to delete section");
        }
    };

    const activeCategory = categories.find(c => c.id === activeSession?.category_id);
    // Since the server now provides a hard-capped total_cycle_kt, we can trust allocatedKT directly.
    // We only add liveSessionMinutes if it has drifted past the last server pulse.
    const totalElapsedKT = Math.min(allocatedKT + liveSessionMinutes, 1440);
    const totalCapacity = 1440;

    const formatTimeStr = (isoStr: string) => {
        return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (mins: number, secs: number) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        const s = secs.toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    if (isLoading) return <div className="flex min-h-screen text-foreground font-sans selection:bg-accent-blue/30 selection:text-white"><Sidebar /><Topbar /><main className="flex-1 md:ml-64 pt-20 px-6 pb-24 md:pb-6 overflow-y-auto w-full"><div className="max-w-6xl mx-auto py-8"><DashboardSkeleton /></div></main></div>;

    const isEngineDormant = categories.length === 0;

    return (
        <div className="flex min-h-screen text-foreground font-sans selection:bg-accent-blue/30 selection:text-white">
            <Sidebar />
            <Topbar />
            <MobileSidebar />

            <main className="flex-1 md:ml-64 pt-20 px-6 pb-32 md:pb-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto py-8">

                    {isEngineDormant ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                            <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-4 relative">
                                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
                                <PowerOff size={40} className="text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-widest uppercase mb-4 text-white">Engine Dormant</h1>
                                <p className="text-muted tracking-wide max-w-md mx-auto">Create your first KT Section to activate the Sovereign Time Engine and begin the 1440-minute cycle.</p>
                            </div>

                            <AnimatePresence mode="wait">
                                {isInitiated ? (
                                    <motion.div
                                        key="protocol-form"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full max-w-3xl"
                                    >
                                        <ProtocolPanel onClose={() => setIsInitiated(false)} onEntryCreated={loadData} />
                                    </motion.div>
                                ) : (
                                    <button
                                        onClick={() => setIsInitiated(true)}
                                        className="relative group bg-accent-blue/10 border border-accent-blue/30 hover:border-accent-blue text-white font-bold py-6 px-12 rounded-full uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center gap-4 text-xl shadow-glow-blue"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-accent-blue/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                                        <Rocket size={24} className="text-accent-blue group-hover:rotate-12 transition-transform" />
                                        <span>Initiate Switch</span>
                                    </button>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* LEFT COLUMN: Main Radar */}
                            <div className="lg:col-span-2 space-y-8">
                                <AnimatePresence mode="wait">
                                    {isInitiated ? (
                                        <motion.div key="protocol-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                            <ProtocolPanel onClose={() => setIsInitiated(false)} onEntryCreated={loadData} />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="active-kt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                        <TiltCard>
                                        <div className="flex flex-col items-center justify-center py-12 px-4 glass-hero rounded-3xl relative overflow-hidden group">
                                            {activeCategory ? (() => {
                                                const ringSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : 300;
                                                const strokeW = typeof window !== 'undefined' && window.innerWidth < 768 ? 5 : 6;
                                                const center = ringSize / 2;
                                                const radius = center - strokeW - 20;
                                                const circumference = 2 * Math.PI * radius;
                                                const cycleProgress = Math.min(totalElapsedKT / totalCapacity, 1);
                                                const dashLen = cycleProgress * circumference;
                                                const h = Math.floor(liveSessionMinutes / 60).toString().padStart(2, '0');
                                                const m = (liveSessionMinutes % 60).toString().padStart(2, '0');
                                                const s = liveSessionSeconds.toString().padStart(2, '0');

                                                return (
                                                    <div className="relative z-10 flex flex-col items-center">
                                                        {/* Blurred glow behind ring */}
                                                        <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
                                                            <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full bg-accent-blue/8 blur-[60px] md:blur-[80px] animate-glow-pulse" />
                                                        </div>

                                                        {/* Cycle range label */}
                                                        {cycleData && (
                                                            <div className="mb-4 text-center">
                                                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted/50 glass-data px-3 py-1 rounded-full">
                                                                    Cycle: {formatTimeStr(cycleData.start)} → {formatTimeStr(cycleData.end)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* SVG Progress Ring */}
                                                        <div className="relative" style={{ width: ringSize, height: ringSize }}>
                                                            {/* Emoji at 12-o'clock */}
                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 text-4xl filter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-float">
                                                                {activeCategory.emoji}
                                                            </div>

                                                            <svg width={ringSize} height={ringSize} className="absolute inset-0 -rotate-90">
                                                                {/* Track ring */}
                                                                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
                                                                {/* Glow ring (blurred duplicate) */}
                                                                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(47,128,237,0.15)" strokeWidth={strokeW + 8} strokeDasharray={`${dashLen} ${circumference}`} strokeLinecap="round" style={{ filter: 'blur(8px)' }} />
                                                                {/* Progress ring */}
                                                                <motion.circle
                                                                    cx={center} cy={center} r={radius} fill="none"
                                                                    stroke="url(#progressGrad)" strokeWidth={strokeW}
                                                                    strokeDasharray={`${dashLen} ${circumference}`}
                                                                    strokeLinecap="round"
                                                                    initial={{ strokeDasharray: `0 ${circumference}` }}
                                                                    animate={{ strokeDasharray: `${dashLen} ${circumference}` }}
                                                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                                                />
                                                                <defs>
                                                                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                        <stop offset="0%" stopColor="#2F80ED" />
                                                                        <stop offset="100%" stopColor="#14B8A6" />
                                                                    </linearGradient>
                                                                </defs>
                                                            </svg>

                                                            {/* Center content — digits + label */}
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                {/* Glass digit pills */}
                                                                <div className="flex items-center gap-1 md:gap-1.5 mb-3">
                                                                    <div className="glass-data rounded-lg px-2 py-1 md:px-3 md:py-1.5">
                                                                        <span className="text-white font-mono text-4xl md:text-5xl font-bold tabular-nums tracking-tight">{h}</span>
                                                                    </div>
                                                                    <span className="text-accent-blue/60 text-2xl md:text-3xl font-bold animate-pulse font-mono">:</span>
                                                                    <div className="glass-data rounded-lg px-2 py-1 md:px-3 md:py-1.5">
                                                                        <span className="text-white font-mono text-4xl md:text-5xl font-bold tabular-nums tracking-tight">{m}</span>
                                                                    </div>
                                                                    <span className="text-accent-blue/60 text-2xl md:text-3xl font-bold animate-pulse font-mono">:</span>
                                                                    <div className="glass-data rounded-lg px-2 py-1 md:px-3 md:py-1.5">
                                                                        <span className="text-white font-mono text-4xl md:text-5xl font-bold tabular-nums tracking-tight">{s}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Active section label inside ring */}
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse shadow-[0_0_8px_rgba(47,128,237,0.8)]" />
                                                                    <span className="text-sm uppercase tracking-[0.2em] font-bold text-accent-blue">
                                                                        {activeCategory.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                <div className="text-center py-12 z-10 relative flex flex-col items-center">
                                                    {/* Dashed ring idle state */}
                                                    <div className="relative w-[280px] h-[280px] mb-4">
                                                        <svg width={280} height={280} className="absolute inset-0 -rotate-90 animate-[spin_30s_linear_infinite]">
                                                            <circle cx={140} cy={140} r={120} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} strokeDasharray="12 8" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <Zap size={40} className="text-muted/30 mb-4" />
                                                            <p className="text-lg text-muted/50 font-light uppercase tracking-[0.2em]">No Active Section</p>
                                                            <p className="text-xs mt-2 text-muted/30 tracking-widest uppercase">Select below to begin</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        </TiltCard>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 2. SWITCHING SYSTEM BUTTON */}
                                <button onClick={() => setIsInitiated(true)} className="w-full relative group bg-accent-blue/10 border border-accent-blue/30 hover:border-accent-blue text-white font-bold py-8 rounded-3xl uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center gap-4 text-2xl shadow-glow-blue">
                                    <div className="absolute inset-0 w-full h-full bg-accent-blue/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                                    <Rocket size={28} className="text-accent-blue group-hover:rotate-12 transition-transform" />
                                    <span>Create KT Section</span>
                                </button>

                                {/* 3. ALLOCATED DOMAINS / SWITCH TRIGGERS */}
                                <div>
                                    <h2 className="text-[10px] text-muted/50 uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
                                        <CalendarDays size={14} /> Active Switchboard
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {categories.map(cat => {
                                            const catKT = (distribution[cat.id] || 0) + (activeSession?.category_id === cat.id ? liveSessionMinutes : 0);
                                            const ktPct = totalElapsedKT > 0 ? (catKT / totalElapsedKT) * 100 : 0;
                                            const isActive = activeSession?.category_id === cat.id;
                                            const catColor = cat.category_type === 'primary' ? '#22c55e' : cat.category_type === 'essential' ? '#f59e0b' : '#f87171';

                                            return (
                                                <TiltCard key={cat.id}>
                                                    <button
                                                        onClick={() => handleSwitchCategory(cat.id)}
                                                        className={`w-full relative rounded-xl flex flex-col items-start group overflow-hidden glass-interactive transition-all duration-300 ${isActive ? 'shadow-lg scale-[1.02]' : ''}`}
                                                        style={{
                                                            borderLeft: `3px solid ${catColor}`,
                                                            border: isActive ? `1px solid ${catColor}` : undefined,
                                                            boxShadow: isActive ? `0 0 16px ${catColor}66` : undefined, // 66 hex = ~40% opacity
                                                        }}
                                                    >
                                                        {/* Active pulsing bg glow */}
                                                        {isActive && (
                                                            <div className="absolute inset-0 animate-glow-pulse pointer-events-none" style={{ background: `radial-gradient(circle at 30% 50%, ${catColor}10 0%, transparent 70%)` }} />
                                                        )}

                                                        <div className="p-4 pb-2 w-full relative z-10">
                                                            <div
                                                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-md z-20"
                                                                onClick={(e) => openEditModal(e, cat)}
                                                            >
                                                                <Pencil size={14} className="text-muted hover:text-white transition-colors" />
                                                            </div>

                                                            <div
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-md z-20"
                                                                onClick={(e) => handleDeleteCategory(e, cat.id)}
                                                            >
                                                                <Trash2 size={14} className="text-red-500 hover:text-red-400 transition-colors" />
                                                            </div>

                                                            <div className="flex justify-between items-center w-full mb-2 mt-4">
                                                                <span className="text-2xl">{cat.emoji}</span>
                                                                {isActive && (
                                                                    <div className="relative">
                                                                        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: catColor, boxShadow: `0 0 8px ${catColor}` }} />
                                                                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-30" style={{ backgroundColor: catColor }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`text-sm font-bold truncate ${isActive ? '' : 'text-muted group-hover:text-white transition-colors'}`} style={isActive ? { color: catColor } : {}}>
                                                                {cat.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 rounded border" style={{ color: catColor, borderColor: `${catColor}40`, backgroundColor: `${catColor}10` }}>
                                                                    {cat.category_type}
                                                                </span>
                                                            </div>
                                                            <div className="font-mono text-xl font-bold mt-2 text-white">
                                                                {catKT} <span className="text-xs text-muted/40">KT</span>
                                                            </div>
                                                        </div>

                                                        {/* Mini progress bar */}
                                                        <div className="w-full h-1 bg-white/[0.04] mt-auto">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${ktPct}%` }}
                                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                                className="h-full"
                                                                style={{ backgroundColor: catColor }}
                                                            />
                                                        </div>
                                                    </button>
                                                </TiltCard>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Engine Cycle Status */}
                            <div className="space-y-6">
                                {/* CYCLE PROGRESSION */}
                                <TiltCard>
                                <div className="glass-hero rounded-3xl p-8 flex flex-col justify-center items-center relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-accent-blue/80 to-accent-teal/40 transition-all duration-1000" style={{ width: `${Math.min((totalElapsedKT / totalCapacity) * 100, 100)}%` }} />
                                    <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted/60 mb-3 text-center">Total Cycle Progress</div>
                                    <div className="text-4xl md:text-6xl font-mono font-bold text-white tabular-nums mb-2">
                                        <AnimatedNumber value={totalElapsedKT} className="text-4xl md:text-6xl font-mono font-bold text-white tabular-nums" /> <span className="text-2xl md:text-3xl text-muted/40 font-light">/ {totalCapacity}</span>
                                    </div>
                                    <div className="text-[10px] text-muted/50 uppercase tracking-[0.2em] font-bold">Elapsed KT</div>
                                </div>
                                </TiltCard>
                            </div>

                        </div>
                    )}

                </div>
            </main>

            {/* Edit Category Modal */}
            <AnimatePresence>
                {editingCategory && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                        onClick={() => setEditingCategory(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-border/80 rounded-2xl p-6 md:p-8 max-w-md w-full relative shadow-2xl"
                        >
                            <button
                                onClick={() => setEditingCategory(null)}
                                className="absolute top-5 right-5 text-muted hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Edit KT Section</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-muted mb-2">Section Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors font-bold"
                                        placeholder="e.g. Deep Work"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-muted mb-2">Emoji</label>
                                    <input
                                        type="text"
                                        value={editEmoji}
                                        onChange={(e) => setEditEmoji(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-2xl focus:outline-none focus:border-accent-blue transition-colors text-center"
                                        placeholder="🔥"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-muted mb-2">Category Type</label>
                                    {editingCategory.is_default ? (
                                        <div className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-muted cursor-not-allowed">
                                            <span className="capitalize">{editingCategory.category_type}</span>
                                            <div className="text-[10px] mt-1 text-muted opacity-70">Default section type cannot be changed</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['primary', 'essential', 'scattered'] as CategoryType[]).map((type) => {
                                                    const isSelected = editCategoryType === type;
                                                    let colorClass = 'text-muted border-border hover:border-white/20';
                                                    if (isSelected) {
                                                        if (type === 'primary') colorClass = 'text-green-500 border-green-500/50 bg-green-500/10 ring-1 ring-green-500';
                                                        if (type === 'essential') colorClass = 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10 ring-1 ring-yellow-500';
                                                        if (type === 'scattered') colorClass = 'text-red-500 border-red-500/50 bg-red-500/10 ring-1 ring-red-500';
                                                    }

                                                    return (
                                                        <button
                                                            key={type}
                                                            onClick={() => setEditCategoryType(type)}
                                                            className={`p-3 rounded-xl border text-xs uppercase tracking-widest font-bold transition-all ${colorClass}`}
                                                        >
                                                            {type}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {editCategoryType !== editingCategory.category_type && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-3 text-xs text-muted italic bg-white/5 p-3 rounded-lg border border-white/5"
                                                >
                                                    Past sessions remain as originally recorded. This applies to future sessions only.
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingCategory(null)}
                                    className="px-6 py-2.5 rounded-xl border border-border text-muted hover:text-white hover:bg-white/5 uppercase tracking-widest text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCategory}
                                    disabled={isSavingCategory || !editName.trim() || !editEmoji.trim()}
                                    className="px-6 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingCategory ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
