'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import { Sidebar, Topbar, MobileSidebar } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { getMilestone, MILESTONES } from '@/lib/utils/milestone';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

/* ── Milestone colors ── */
const MILESTONE_COLORS: Record<string, string> = {
    'Awakened': '#5483B3',
    'Contender': '#4a9eff',
    'Sovereign': '#22c55e',
    'Architect': '#ffd700',
    'Chronarch': '#ff6b35',
    'Sovereign Prime': '#ff4444',
};

/* ── Floating particles for hero banner ── */
function ParticleField() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const particles = useMemo(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 2.5,
            duration: 4 + Math.random() * 6,
            delay: Math.random() * 4,
            opacity: 0.15 + Math.random() * 0.35,
        })), []
    );

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-[#4a9eff]"
                    style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
                    animate={{ opacity: [0, p.opacity, 0], y: [0, -20, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

/* ── Enhanced TiltCard with Inner Glow Pulse ── */
function EnhancedTiltCard({ children }: { children: React.ReactNode }) {
    const [style, setStyle] = useState({ rotateX: 0, rotateY: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = -((y - centerY) / centerY) * 4;
        const rotateY = ((x - centerX) / centerX) * 4;

        setStyle({ rotateX, rotateY });

        const shine = e.currentTarget.querySelector('.tilt-shine') as HTMLElement;
        if (shine) {
            shine.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(74,158,255,0.08), transparent 40%)`;
            shine.style.opacity = '1';
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        setStyle({ rotateX: 0, rotateY: 0 });
        const shine = e.currentTarget.querySelector('.tilt-shine') as HTMLElement;
        if (shine) shine.style.opacity = '0';
    };

    return (
        <motion.div
            style={{ perspective: 1000 }}
            className="w-full relative group"
            animate={{
                transform: `rotateX(${style.rotateX}deg) rotateY(${style.rotateY}deg)`,
                scale: style.rotateX !== 0 ? 1.01 : 1
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Breathing inner glow pulse beneath the card */}
            <motion.div 
                className="absolute -inset-[1px] rounded-2xl pointer-events-none opacity-50 block"
                animate={{ boxShadow: ['0 0 15px rgba(74,158,255,0.05)', '0 0 35px rgba(74,158,255,0.15)', '0 0 15px rgba(74,158,255,0.05)'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ borderRadius: '16px' }}
            />
            
            <div className="relative rounded-2xl overflow-hidden glass-data h-full border border-white/5 transition-colors duration-300 group-hover:border-[#4a9eff]/20">
                {/* Shine layer */}
                <div className="tilt-shine absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 z-10 mix-blend-screen" />
                <div className="relative z-20 h-full">{children}</div>
            </div>
        </motion.div>
    );
}

/* ── Custom Term Tooltip Wrapper ── */
function TooltipTerm({ term, definition }: { term: string; definition: string }) {
    return (
        <span className="relative group inline-block cursor-help font-semibold text-[#4a9eff] hover:text-[#7DA0CA] transition-colors duration-200 border-b border-dashed border-[#4a9eff]/50">
            {term}
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 block">
                <span className="relative bg-[#021024] border border-[#4a9eff]/30 p-3 rounded-lg shadow-[0_0_20px_rgba(74,158,255,0.2)] block">
                    <span className="text-xs text-white/90 font-mono leading-relaxed block" style={{ letterSpacing: '0.02em' }}>{definition}</span>
                    <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#021024] border-b border-r border-[#4a9eff]/30 rotate-45 block" />
                </span>
            </span>
        </span>
    );
}

const terms = {
    sovereign: "The absolute authority over one's own existence. A state of uncompromised intentionality.",
    cycle: "A 24-hour container of intention, beginning exactly when you declare it.",
    min1440: "The exact number of minutes in a day. The universal, unalterable budget of human existence.",
    primary: "The mission. Work that justifies your presence in the cycle.",
    scattered: "Ungoverned time. Not evil, simply devoid of sovereign declaration."
};

/* ── Section wrapper with Z-axis zoom & scroll-triggered fade-in ── */
function ScrollSection({ children, delay = 0, id }: { children: React.ReactNode; delay?: number; id?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); } },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div ref={ref} id={id} className="relative z-20">
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.96 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.div>
        </div>
    );
}

/* ── System Scan Line Overlay (Runs once on mount) ── */
function SystemScanOverlay() {
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setScanned(true), 1500);
        return () => clearTimeout(t);
    }, []);

    if (scanned) return null;

    return (
        <motion.div 
            className="fixed inset-0 pointer-events-none z-[100]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.3 }}
        >
            <motion.div 
                className="w-full h-1 bg-[#4a9eff] shadow-[0_0_30px_#4a9eff]"
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.2, ease: 'linear' }}
                style={{ position: 'absolute' }}
            />
            {/* Dark overlay behind scan line fading out */}
            <motion.div 
                className="w-full h-full bg-[#021024]/80 backdrop-blur-sm"
            />
        </motion.div>
    );
}

/* ── Section title styling ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-lg md:text-xl font-bold uppercase mb-8"
            style={{ letterSpacing: '3px', color: '#4a9eff', textShadow: '0 0 20px rgba(74,158,255,0.3)' }}
        >
            {children}
        </h2>
    );
}

/* ── The Sovereign Creed (Interactive Accept Button) ── */
function SovereignCreed() {
    const [accepted, setAccepted] = useState(false);

    if (accepted) {
        return (
            <motion.div 
                className="glass-data rounded-2xl p-12 text-center relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-[#4a9eff]/20 to-transparent" />
                <motion.div className="absolute inset-0" 
                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ backgroundImage: 'url("/noise.png")', opacity: 0.05 }}
                />
                
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full border-2 border-[#4a9eff] shadow-[0_0_40px_rgba(74,158,255,0.4)]"
                >
                    <Shield size={40} className="text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-white uppercase tracking-[0.2em] mb-3">Sovereignty Acknowledged</h3>
                <p className="text-[#4a9eff] font-mono text-sm tracking-widest uppercase mb-8">The cycle witnesses your intent.</p>
                
                {/* Dissolving particles coming from center */}
                <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-[#4a9eff]"
                            style={{ left: '50%', top: '50%' }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{ x: (Math.random() - 0.5) * 800, y: (Math.random() - 0.5) * 600, opacity: 0, scale: 0 }}
                            transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
                        />
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <EnhancedTiltCard>
            <div className="glass-data rounded-2xl p-12 text-center">
                <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] mb-6 font-mono">The Final Declaration</h3>
                <div className="text-white/70 italic text-sm mb-10 max-w-lg mx-auto leading-relaxed">
                    By reading this, you have witnessed the truth. Ungoverned time is lost. <br/>
                    Do you accept the burden and glory of the 1,440?
                </div>
                <button 
                    onClick={() => setAccepted(true)}
                    className="relative group px-12 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-white overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(74,158,255,0.4)]"
                    style={{ background: 'linear-gradient(135deg, #1a6fd4 0%, #4a9eff 100%)' }}
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <span className="relative z-10 flex items-center gap-3">
                        <Shield size={18} /> I ACCEPT
                    </span>
                </button>
            </div>
        </EnhancedTiltCard>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN ABOUT PAGE
═══════════════════════════════════════════════════ */
export default function AboutPage() {
    const router = useRouter();
    const [totalKT, setTotalKT] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    // For Dynamic Background Aura & Parallax Watermarks
    const { scrollYProgress } = useScroll();
    
    // As you scroll, aura color slowly shifts from #021024 deep blue to slightly more intense #0a1b3f blue to #171c12 gold-tinged dark for milestones
    const auraColor = useTransform(scrollYProgress, 
        [0, 0.5, 1], 
        ['radial-gradient(ellipse at 50% 50%, rgba(74,158,255,0.06) 0%, #021024 100%)', 
         'radial-gradient(ellipse at 50% 50%, rgba(74,158,255,0.12) 0%, #021024 100%)', 
         'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.06) 0%, #021024 100%)']
    );

    // Parallax movements
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
    const y2 = useTransform(scrollYProgress, [0, 1], [100, -500]);
    const y3 = useTransform(scrollYProgress, [0, 1], [300, -700]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchWithAuth('/api/profile/stats');
                if (res.status === 401) return router.push('/login');
                const data = await res.json();
                setTotalKT(data.totalKT || 0);
            } catch { /* ignore */ }
            setIsLoading(false);
        };
        load();
    }, [router]);

    const milestone = getMilestone(totalKT);
    const milestoneIndex = MILESTONES.findIndex(m => m.name === milestone.name);
    const milestoneColor = MILESTONE_COLORS[milestone.name] || '#5483B3';

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#021024' }}>
                <div className="w-8 h-8 border-2 border-[#4a9eff]/30 border-t-[#4a9eff] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex text-white" style={{ background: '#021024' }}>
            {/* Global CSS for the Manuscript Drop-Cap */}
            <style jsx global>{`
                .manifesto-prose > div:first-of-type::first-letter {
                    float: left;
                    font-size: 4rem;
                    line-height: 0.8;
                    padding-top: 6px;
                    padding-right: 12px;
                    padding-left: 2px;
                    font-family: 'Syne', 'Inter', sans-serif;
                    color: #4a9eff;
                    text-shadow: 0 0 25px rgba(74,158,255,0.6);
                    font-weight: 800;
                }
                .manifesto-prose {
                    color: rgba(255,255,255,0.85);
                    font-size: 16px;
                    line-height: 1.8;
                }
            `}</style>
            
            <SystemScanOverlay />

            <Sidebar />
            <div className="flex-1 min-h-screen flex flex-col relative">
                <Topbar />
                <MobileSidebar />

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative" id="about-scroll-container">
                    {/* Dynamic Aura */}
                    <motion.div className="fixed inset-0 pointer-events-none z-0 transition-colors duration-1000" style={{ background: auraColor }} />
                    
                    {/* Parallax Watermarks */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <motion.div style={{ y: y1 }} className="absolute top-[20%] left-[-5%] text-[15rem] font-black opacity-[0.02] tracking-widest uppercase rotate-[-90deg] origin-left select-none break-keep w-[3000px]">SOVEREIGN</motion.div>
                        <motion.div style={{ y: y2 }} className="absolute top-[50%] right-[-5%] text-[18rem] font-black opacity-[0.015] tracking-widest uppercase rotate-[90deg] origin-right select-none break-keep text-right w-[3000px]">1440</motion.div>
                        <motion.div style={{ y: y3 }} className="absolute top-[80%] left-[10%] text-[12rem] font-black opacity-[0.02] tracking-widest uppercase select-none break-keep">TRUTH</motion.div>
                    </div>

                    {/* Vertical Time-Stream Line */}
                    <div className="hidden lg:block absolute top-[400px] bottom-0 left-[max(5%,_4rem)] w-[1px] bg-gradient-to-b from-transparent via-[#4a9eff]/20 to-transparent z-10" />
                    <div className="hidden lg:block absolute top-[400px] bottom-0 left-[max(5%,_4rem)] w-[1px] z-10 overflow-hidden">
                        <motion.div 
                            className="w-full h-32 bg-gradient-to-b from-transparent via-[#4a9eff] to-transparent shadow-[0_0_15px_#4a9eff]"
                            animate={{ top: ['-10%', '110%'] }}
                            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                            style={{ position: 'relative' }}
                        />
                    </div>

                    <PageTransition>
                        {/* ══════════════════════════════════════════════════
                            HERO BANNER
                        ══════════════════════════════════════════════════ */}
                        <div className="relative overflow-hidden z-20" style={{ minHeight: '380px', background: 'linear-gradient(180deg, #010a18 0%, transparent 100%)' }}>
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(74,158,255,0.06)_0%,transparent_60%)]" />
                            <ParticleField />
                            <div className="absolute inset-0 opacity-[0.012] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(74,158,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                            <div className="relative z-10 flex flex-col items-center justify-center text-center py-20 md:py-32 px-6">
                                <motion.h1
                                    initial={{ opacity: 0, letterSpacing: '0.8em', y: -20 }}
                                    animate={{ opacity: 1, letterSpacing: '0.2em', y: 0 }}
                                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="text-3xl md:text-6xl font-extrabold uppercase text-white mb-6"
                                    style={{ fontFamily: "'Syne', 'Inter', sans-serif", textShadow: '0 0 50px rgba(74,158,255,0.4)', letterSpacing: '0.2em' }}
                                >
                                    About KalanTark
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    transition={{ delay: 1, duration: 1.2 }}
                                    className="text-xs md:text-lg italic tracking-[0.2em] text-[#4a9eff] max-w-lg font-mono uppercase"
                                >
                                    Time only exists when declared.
                                </motion.p>
                                
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    transition={{ delay: 1.5, duration: 1.2 }}
                                    className="text-[10px] md:text-sm italic tracking-[0.2em] text-white mt-3 font-mono uppercase"
                                >
                                    Govern yours.
                                </motion.p>

                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 1.8, duration: 1.2, ease: "easeOut" }}
                                    className="w-32 md:w-48 h-px mt-8 md:mt-10 bg-gradient-to-r from-transparent via-[#4a9eff]/50 to-transparent"
                                />
                            </div>
                        </div>

                        {/* ══════════════════════════════════════════════════
                            CONTENT SECTIONS
                        ══════════════════════════════════════════════════ */}
                        <div className="max-w-4xl mx-auto px-4 md:px-12 lg:px-16 py-12 md:py-16 space-y-12 md:space-y-20 relative z-20">

                            {/* ─── Section 1: What is KalanTark ─── */}
                            <ScrollSection>
                                <EnhancedTiltCard>
                                    <div className="p-8 md:p-14">
                                        <SectionTitle>What is KalanTark</SectionTitle>
                                        <div className="space-y-6 manifesto-prose">
                                            <div className="mb-4">
                                                KalanTark is not a productivity app. It is not a habit tracker, a to-do list, or a time logger. It is a <TooltipTerm term="sovereign" definition={terms.sovereign} /> time economy — a system built on the belief that time is not something to be managed like a resource, but governed like a territory. Most apps treat the user as an employee of their own life, clocking in and out, measuring output, chasing streaks. KalanTark treats the user as a sovereign — the absolute authority over every minute of their existence.
                                            </div>
                                            <div className="mb-4">
                                                The word &ldquo;sovereign&rdquo; is not decorative. It carries its full meaning here. A sovereign does not ask permission to spend their time. A sovereign does not react to the day — they declare it. KalanTark is built on the premise that ungoverned time is not neutral — it is lost. Every minute that passes without a conscious declaration is a minute that belonged to no intention, no mission, no life. KalanTark exists to end that.
                                            </div>
                                            <div className="mb-4">
                                                What makes KalanTark fundamentally different from everything else is a single philosophical premise: time only exists when consciously declared. You do not log what you did. You declare what your time belongs to, in real time, and the system witnesses it. There is no retroactive editing of your sovereign record. There is no &ldquo;I&apos;ll track it later.&rdquo; There is only now, and what you declare now.
                                            </div>
                                        </div>
                                    </div>
                                </EnhancedTiltCard>
                            </ScrollSection>

                            {/* ─── Section 2: The KT Token ─── */}
                            <ScrollSection delay={0.1}>
                                <EnhancedTiltCard>
                                    <div className="p-8 md:p-14">
                                        <SectionTitle>The KT Token</SectionTitle>
                                        <div className="space-y-6 manifesto-prose">
                                            <div className="mb-4">
                                                KT — the KalanTark Token — is the atomic unit of sovereign time. One minute equals one KT. This is not a metaphor. It is an exact conversion. Every sixty seconds that passes in your life is one KT spent, whether you declare it or not. The question KalanTark asks, every moment, is not whether you are spending KT — you always are — but whether you are governing where it goes.
                                            </div>
                                            <div className="mb-4">
                                                The number <TooltipTerm term="1,440" definition={terms.min1440} /> is sacred in KalanTark. It is the exact number of minutes in a day. It is your daily budget — fixed, non-negotiable, and identical for every person alive regardless of wealth, status, or circumstance. A billionaire has 1,440 KT today. So do you. What separates people is not how much time they have, but how consciously they declare it. KalanTark makes that declaration visible, permanent, and honest.
                                            </div>
                                            <div className="mb-4">
                                                There is an important distinction in KalanTark&apos;s philosophy: KT is not earned, it is declared. You do not earn time by working hard or being productive. Time is already yours — all 1,440 KT of it, every cycle. The act of governance is not earning more time. It is declaring, with full consciousness, what each minute belongs to. When you declare a minute to your <TooltipTerm term="primary" definition={terms.primary} /> mission, that minute becomes sovereign. When you let it pass undeclared, it becomes <TooltipTerm term="scattered" definition={terms.scattered} /> — not wasted in a moral sense, but ungoverned in a sovereign sense.
                                            </div>
                                        </div>
                                    </div>
                                </EnhancedTiltCard>
                            </ScrollSection>

                            {/* ─── Section 3: The Cycle System ─── */}
                            <ScrollSection delay={0.1}>
                                <EnhancedTiltCard>
                                    <div className="p-8 md:p-14">
                                        <SectionTitle>The Cycle System</SectionTitle>
                                        <div className="space-y-6 manifesto-prose">
                                            <div className="mb-4">
                                                KalanTark does not organize your time around the calendar day. It organizes it around the <TooltipTerm term="cycle" definition={terms.cycle} /> — your personal 24-hour sovereign period that begins and ends at the time you declare as your start. This is not a small distinction. The world decided that a new day begins at midnight. KalanTark asks: who gave the world that authority over your sovereignty? If your most intentional hour is 6:00 AM, then your cycle begins at 6:00 AM. Your sovereign day is yours to define.
                                            </div>
                                            <div className="mb-4">
                                                A cycle is more than a time range. It is a container of intention. When a cycle opens, it opens with a declaration — what section is active, what the time belongs to. When a cycle closes, it closes with a record — an honest, uneditable account of exactly how every minute was declared. The cycle does not forgive retroactive changes. It does not allow you to go back and fix how you spent Tuesday at 2:00 PM. It only records what was declared at the time it was declared.
                                            </div>
                                            <div className="mb-4">
                                                The cycle resets everything except the truth. Your streak, your daily KT, your cycle progress — all reset when a new cycle begins. But your total lifetime KT, your milestone level, your sovereign record — these never reset. They accumulate across every cycle you have ever lived in KalanTark. Every cycle you complete adds permanently to who you are becoming as a sovereign.
                                            </div>
                                        </div>
                                    </div>
                                </EnhancedTiltCard>
                            </ScrollSection>

                            {/* ─── Section 4: KT Sections ─── */}
                            <ScrollSection delay={0.1}>
                                <EnhancedTiltCard>
                                    <div className="p-8 md:p-14">
                                        <SectionTitle>KT Sections</SectionTitle>
                                        <div className="space-y-6 manifesto-prose">
                                            <div className="mb-4">
                                                A KT Section is how you declare what your time belongs to. When you activate a section, you are making a sovereign statement: &ldquo;This minute, and every minute until I switch, belongs to this.&rdquo; Sections are the fundamental unit of declaration in KalanTark. You create them, name them, assign them a category, and switch between them as your life moves through its different modes.
                                            </div>
                                            <div className="mb-4">
                                                Every section belongs to one of three categories — Primary, Essential, or Scattered. Primary is your mission. It is the work that defines why you are alive in this cycle — building, creating, learning, practicing whatever your sovereign purpose is. Essential is what life requires of you to continue functioning — sleep, food, health, maintenance. Essential is not sovereign work, but it is not scattered either. It is the cost of being alive, and KalanTark respects that cost by acknowledging it separately. Scattered is everything else — ungoverned time, distraction, idle existence. Scattered is not evil. It simply means that during those minutes, you were not governing. The system records it honestly.
                                            </div>
                                            <div className="mb-4">
                                                The reason these three categories exist — and not more, not fewer — is philosophical precision. Primary and Scattered are the two poles of sovereign existence. You are either building your mission or you are not. Essential sits between them not as a compromise but as an honest acknowledgment that a sovereign is still a human being with biological and logistical needs. The Sovereignty Score — explained in the next section — is calculated only from Primary and Scattered because only those two categories represent the pure question of sovereignty.
                                            </div>
                                            <div className="mb-4">
                                                The Switch Rule is perhaps the most important rule in KalanTark, and the most intentional. There is no pause button. There is no stop. Once a section is active, time flows into it until you switch to another section. This is not a limitation — it is a philosophical statement. Time does not pause when you look away. Time does not stop when you get distracted. Time flows, always, whether you are governing it or not. The Switch Rule makes KalanTark honest in a way that no pause button ever could. If you walked away from your desk for 45 minutes without switching sections, those 45 minutes are recorded exactly as they were — ungoverned, or declared to whatever section was active. The record is the truth.
                                            </div>
                                        </div>
                                    </div>
                                </EnhancedTiltCard>
                            </ScrollSection>

                            {/* ─── Section 5: Sovereignty Score ─── */}
                            <ScrollSection delay={0.1}>
                                <EnhancedTiltCard>
                                    <div className="p-8 md:p-14">
                                        <SectionTitle>Sovereignty Score</SectionTitle>
                                        <div className="space-y-6 manifesto-prose">
                                            <div className="mb-4">
                                                The Sovereignty Score is a single number between 0 and 100 that answers one question with complete honesty: of all the time you declared to either your mission or to scattered existence, what percentage went to your mission? The formula is exact — Primary KT divided by the sum of Primary KT and Scattered KT, multiplied by 100. Essential KT is excluded entirely. It does not help your score and it does not hurt it. It simply exists outside the sovereignty calculation because sovereignty is not about whether you slept — it is about what you did when you were awake and ungoverned.
                                            </div>
                                            <div className="mb-4">
                                                A score of 100% means every minute you declared was Primary. In practice, over a full cycle, this is nearly impossible for most humans living real lives. A score of 70–80% represents genuine sovereignty — the majority of your declared time served your mission. A score below 50% means Scattered time dominated your cycle. The score does not measure effort, mood, intention, or circumstances. It measures only one thing: what you declared.
                                            </div>
                                            <div className="mb-4">
                                                The ruthless honesty of the Sovereignty Score is its most important feature. It cannot be argued with. It cannot be reasoned away. You either declared your time to your primary mission or you did not. No amount of feeling busy, feeling tired, or feeling like you tried makes the score move. Only declarations move the score. This is why KalanTark calls it a sovereign score and not a productivity score — productivity can be faked, gamed, and rationalized. Sovereignty cannot.
                                            </div>
                                        </div>
                                    </div>
                                </EnhancedTiltCard>
                            </ScrollSection>

                            {/* ─── Section 6: The Milestone System ─── */}
                            <ScrollSection delay={0.1}>
                                <EnhancedTiltCard>
                                    <div className="p-8 md:p-14">
                                        <SectionTitle>The Milestone System</SectionTitle>
                                        <div className="space-y-6 manifesto-prose">
                                            <div className="mb-4">
                                                Milestones in KalanTark are not rewards for streaks or badges for consistency. They are identity markers — permanent thresholds that reflect the total volume of sovereign existence you have accumulated across your entire time in KalanTark. Once reached, a milestone cannot be lost. It is part of your sovereign record forever. There are six milestones, each representing not just a KT number but a transformation in who you are as a sovereign.
                                            </div>
                                            <div className="space-y-4 pt-4">
                                                <div className="mb-4">
                                                    <strong className="text-[#5483B3] mr-2">Awakened (0 KT)</strong> Every sovereign begins here. Awakened is not an achievement — it is a beginning. You have entered the system. You have made the first declaration. The significance of Awakened is not what you have done but what you have chosen to become. Most people who ever think about governing their time never take the first step. You did.
                                                </div>
                                                <div className="mb-4">
                                                    <strong className="text-[#4a9eff] mr-2">Contender (1,440 KT)</strong> You have declared one full cycle&apos;s worth of time — 1,440 KT, the exact number of minutes in one sovereign day. Contender means you have proven that the practice is real for you. The first cycle is the hardest. It requires building the habit of switching, the discipline of declaring, and the honesty of letting the record be what it is. At 1,440 KT, you are no longer just beginning — you are contending for your sovereignty.
                                                </div>
                                                <div className="mb-4">
                                                    <strong className="text-[#22c55e] mr-2">Sovereign (7,200 KT)</strong> Five full cycles of declared time. At Sovereign, the practice has become something more than an experiment. You have shown up across multiple cycles, declared your time across multiple days, and built a record that spans real life — with its interruptions, its failures, and its recoveries. Sovereign is the first milestone that feels earned in a deep sense. It is the first time you can honestly say: I govern my time.
                                                </div>
                                                <div className="mb-4">
                                                    <strong className="text-[#ffd700] mr-2">Architect (21,600 KT)</strong> Fifteen cycles. You are no longer just governing your time — you are building something with it. At Architect, patterns have emerged in your sovereign record. You can see what your Primary sections are accumulating. You can see where your Scattered time lives. You have enough data and enough practice to begin designing your cycles with intention, not just reacting to them. You are an architect of your own sovereign existence.
                                                </div>
                                                <div className="mb-4">
                                                    <strong className="text-[#ff6b35] mr-2">Chronarch (72,000 KT)</strong> Fifty cycles of declared sovereign existence. The word Chronarch means ruler of time — and at this threshold, that is not hyperbole. Fifty cycles means fifty personal days of full declaration. Your relationship with time has fundamentally changed. Where most people experience time as something that happens to them, you experience it as something you govern. The Chronarch does not chase time. Time follows the Chronarch.
                                                </div>
                                                <div className="mb-4">
                                                    <strong className="text-[#ff4444] mr-2">Sovereign Prime (216,000 KT)</strong> One hundred and fifty cycles. This is the apex of the KalanTark milestone system — not because there is nothing beyond it, but because what lies beyond it is simply more of what you already are. At Sovereign Prime, you have lived 150 declared days inside a system that demanded honesty from you every minute. You have built a sovereign record that very few humans on earth will ever build. Sovereign Prime is not a finish line. It is proof of what consistent governance of time can produce over a lifetime.
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Milestone Journey - Responsive */}
                                        <div className="mt-16 pt-10" style={{ borderTop: '1px border border-[#ffffff0a]' }}>
                                            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5483B3] mb-12 text-center">
                                                The Sovereign Sequence
                                            </div>
                                            
                                            <div className="relative px-4">
                                                {/* Desktop View */}
                                                <div className="hidden md:block relative pb-2 overflow-x-auto scrollbar-hide">
                                                    {/* Track line */}
                                                    <div className="absolute top-6 left-0 right-0 h-[2px] bg-white/[0.04] rounded-full" />
                                                    <motion.div
                                                        className="absolute top-6 left-0 h-[2px] rounded-full"
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${(milestoneIndex / (MILESTONES.length - 1)) * 100}%` }}
                                                        viewport={{ once: true, margin: "-100px" }}
                                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                                        style={{
                                                            background: `linear-gradient(90deg, #5483B3, ${milestoneColor})`,
                                                            boxShadow: `0 0 12px ${milestoneColor}60`,
                                                        }}
                                                    />

                                                    <div className="flex justify-between items-start relative z-10">
                                                        {MILESTONES.map((m, i) => {
                                                            const isReached = totalKT >= m.threshold;
                                                            const isCurrent = milestone.name === m.name;
                                                            const mColor = MILESTONE_COLORS[m.name] || '#5483B3';
                                                            return (
                                                                <div key={m.name} className="flex flex-col items-center min-w-[100px] flex-1">
                                                                    <motion.div
                                                                        initial={{ scale: 0, rotateY: 90, opacity: 0 }}
                                                                        whileInView={{ scale: 1, rotateY: 0, opacity: 1 }}
                                                                        viewport={{ once: true, margin: "-50px" }}
                                                                        transition={{ delay: 0.2 * i + 0.8, type: 'spring', stiffness: 200, damping: 20 }}
                                                                        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 mb-4 relative z-10 transform-gpu"
                                                                        style={{
                                                                            borderColor: isReached ? mColor : 'rgba(255,255,255,0.06)',
                                                                            backgroundColor: isReached ? `${mColor}15` : '#0a1628',
                                                                            boxShadow: isCurrent ? `0 0 24px ${mColor}60` : 'none',
                                                                        }}
                                                                    >
                                                                        <Shield size={18} style={{ color: isReached ? mColor : '#334155' }} />
                                                                    </motion.div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-center" style={{ color: isReached ? mColor : '#334155' }}>{m.name}</span>
                                                                    <span className="text-[10px] mt-1 font-mono" style={{ color: isReached ? `${mColor}90` : '#252f3f' }}>{m.threshold.toLocaleString()}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Mobile View */}
                                                <div className="md:hidden relative space-y-12 pl-6 pb-4">
                                                    {/* Vertical Track Line */}
                                                    <div className="absolute left-[31px] top-0 bottom-0 w-[2px] bg-white/[0.04]" />
                                                    <div
                                                        className="absolute left-[31px] top-0 w-[2px]"
                                                        style={{
                                                            height: `${(milestoneIndex / (MILESTONES.length - 1)) * 100}%`,
                                                            background: `linear-gradient(180deg, #5483B3, ${milestoneColor})`,
                                                            boxShadow: `0 0 10px ${milestoneColor}40`,
                                                        }}
                                                    />

                                                    {MILESTONES.map((m, i) => {
                                                        const isReached = totalKT >= m.threshold;
                                                        const isCurrent = milestone.name === m.name;
                                                        const mColor = MILESTONE_COLORS[m.name] || '#5483B3';
                                                        return (
                                                            <div key={m.name} className="relative flex items-center gap-6">
                                                                <motion.div
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    whileInView={{ scale: 1, opacity: 1 }}
                                                                    viewport={{ once: true }}
                                                                    className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0 relative z-10"
                                                                    style={{
                                                                        borderColor: isReached ? mColor : 'rgba(255,255,255,0.06)',
                                                                        backgroundColor: isReached ? `${mColor}15` : '#0a1628',
                                                                        boxShadow: isCurrent ? `0 0 20px ${mColor}50` : 'none',
                                                                    }}
                                                                >
                                                                    <Shield size={18} style={{ color: isReached ? mColor : '#334155' }} />
                                                                </motion.div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: isReached ? mColor : '#334155' }}>{m.name}</span>
                                                                    <span className="text-[10px] mt-1 font-mono" style={{ color: isReached ? `${mColor}90` : '#252f3f' }}>{m.threshold.toLocaleString()} KT</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </EnhancedTiltCard>
                            </ScrollSection>

                            {/* ─── Sovereign Creed End Card ─── */}
                            <ScrollSection delay={0.2}>
                                <SovereignCreed />
                            </ScrollSection>

                            {/* Bottom spacer for breathing room */}
                            <div className="h-16" />

                        </div>
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
