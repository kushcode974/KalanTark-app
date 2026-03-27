'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Shield, ArrowRight, UserPlus, Mail, Lock, User, Volume2, VolumeX } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   PARTICLE FIELD + CONSTELLATION LINES
═══════════════════════════════════════════════════ */
function ParticleField({ withConstellations = false }: { withConstellations?: boolean }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const particles = useMemo(() =>
        Array.from({ length: 45 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 2.5,
            duration: 4 + Math.random() * 6,
            delay: Math.random() * 4,
            opacity: 0.15 + Math.random() * 0.35,
        })), []
    );

    const lines = useMemo(() => {
        if (!withConstellations) return [];
        const result: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 18 && result.length < 15) {
                    result.push({
                        x1: particles[i].x, y1: particles[i].y,
                        x2: particles[j].x, y2: particles[j].y,
                        delay: Math.random() * 6,
                    });
                }
            }
        }
        return result;
    }, [particles, withConstellations]);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {withConstellations && (
                <svg className="absolute inset-0 w-full h-full">
                    {lines.map((l, i) => (
                        <motion.line
                            key={`line-${i}`}
                            x1={`${l.x1}%`} y1={`${l.y1}%`}
                            x2={`${l.x2}%`} y2={`${l.y2}%`}
                            stroke="rgba(74,158,255,0.12)" strokeWidth="0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.4, 0] }}
                            transition={{ duration: 5, repeat: Infinity, delay: l.delay }}
                        />
                    ))}
                </svg>
            )}
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-[#4a9eff]"
                    style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
                    animate={{ opacity: [0, p.opacity, 0], y: [0, -30, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   TYPEWRITER TITLE
═══════════════════════════════════════════════════ */
function TypewriterTitle({ text }: { text: string }) {
    const [displayed, setDisplayed] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
                setTimeout(() => setShowCursor(false), 2000);
            }
        }, 100);
        return () => clearInterval(timer);
    }, [text]);

    return (
        <span>
            {displayed}
            {showCursor && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="inline-block w-[3px] h-[1.1em] bg-[#4a9eff] ml-1 align-middle"
                />
            )}
        </span>
    );
}

/* ═══════════════════════════════════════════════════
   KT COUNTER
═══════════════════════════════════════════════════ */
function KTCounter() {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setCount(prev => (prev + 1) % 1000000), 50);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="text-[12rem] xl:text-[16rem] font-mono font-black tabular-nums" style={{ color: 'rgba(74,158,255,0.025)' }}>
                {count.toString().padStart(6, '0')}
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   ROTATING MILESTONE BADGE — Larger, more premium
═══════════════════════════════════════════════════ */
function RotatingBadge() {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ bottom: '12%', left: '50%', x: '-50%', perspective: '800px' }}
        >
            <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Outer glow ring */}
                <motion.div
                    className="absolute -inset-3 rounded-3xl"
                    style={{ border: '1px solid rgba(74,158,255,0.1)' }}
                    animate={{ boxShadow: ['0 0 20px rgba(74,158,255,0.05)', '0 0 40px rgba(74,158,255,0.15)', '0 0 20px rgba(74,158,255,0.05)'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Shield container */}
                <div className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
                    style={{
                        background: 'linear-gradient(135deg, rgba(74,158,255,0.1) 0%, rgba(10,22,40,0.8) 50%, rgba(74,158,255,0.05) 100%)',
                        border: '1px solid rgba(74,158,255,0.18)',
                        boxShadow: 'inset 0 0 30px rgba(74,158,255,0.05)',
                    }}
                >
                    {/* Background shield (larger, faded) */}
                    <Shield size={52} className="absolute text-[#4a9eff]" style={{ opacity: 0.06 }} />
                    {/* Main shield */}
                    <Shield size={40} className="text-[#4a9eff] relative" style={{ opacity: 0.3, filter: 'drop-shadow(0 0 12px rgba(74,158,255,0.3))' }} />
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════
   PASSWORD STRENGTH INDICATOR
═══════════════════════════════════════════════════ */
function PasswordStrength({ password }: { password: string }) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const level = score <= 1 ? 'Weak' : score <= 3 ? 'Moderate' : 'Sovereign';
    const color = score <= 1 ? '#ff4444' : score <= 3 ? '#ffd700' : '#22c55e';
    const pct = (score / 5) * 100;
    if (!password) return null;

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 overflow-hidden">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] font-bold mt-1.5" style={{ color }}>{level}</div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════
   FLOATING LABEL INPUT
═══════════════════════════════════════════════════ */
function FloatingInput({
    type, value, onChange, icon: Icon, label, autoComplete, onKeyDown,
}: {
    type: string; value: string; onChange: (v: string) => void;
    icon: React.ElementType; label: string; autoComplete?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
    const [focused, setFocused] = useState(false);
    const [ripple, setRipple] = useState(false);
    const hasValue = value.length > 0;
    const isFloating = focused || hasValue;

    // First-character ripple
    useEffect(() => {
        if (value.length === 1) {
            setRipple(true);
            const t = setTimeout(() => setRipple(false), 600);
            return () => clearTimeout(t);
        }
    }, [value]);

    return (
        <div className="relative">
            {/* Icon */}
            <Icon
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10"
                style={{ color: focused ? '#4a9eff' : '#334155' }}
            />

            {/* Ripple from icon on first char */}
            <AnimatePresence>
                {ripple && (
                    <motion.div
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-0"
                        style={{ background: 'rgba(74,158,255,0.15)' }}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    />
                )}
            </AnimatePresence>

            {/* Floating label */}
            <label
                className="absolute left-11 transition-all duration-200 pointer-events-none font-mono"
                style={{
                    top: isFloating ? '4px' : '50%',
                    transform: isFloating ? 'none' : 'translateY(-50%)',
                    fontSize: isFloating ? '8px' : '13px',
                    color: isFloating ? 'rgba(74,158,255,0.7)' : '#334155',
                    letterSpacing: isFloating ? '0.2em' : '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: isFloating ? 700 : 400,
                    fontFamily: isFloating ? 'inherit' : 'ui-monospace, monospace',
                }}
            >
                {label}
            </label>

            {/* Input */}
            <input
                type={type}
                required
                autoComplete={autoComplete || 'off'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full rounded-xl pl-11 pr-4 text-white text-sm font-mono outline-none transition-all duration-200"
                style={{
                    backgroundColor: '#0a1628',
                    border: `1px solid ${focused ? '#4a9eff' : 'rgba(74, 158, 255, 0.2)'}`,
                    boxShadow: focused ? '0 0 16px rgba(74,158,255,0.15)' : 'none',
                    paddingTop: isFloating ? '20px' : '14px',
                    paddingBottom: isFloating ? '8px' : '14px',
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   KEYSTROKE DOTS (password field)
═══════════════════════════════════════════════════ */
function KeystrokeDots({ count }: { count: number }) {
    const [dots, setDots] = useState<number[]>([]);
    useEffect(() => {
        if (count > 0) {
            setDots(prev => [...prev, Date.now()]);
            const t = setTimeout(() => setDots(prev => prev.slice(1)), 400);
            return () => clearTimeout(t);
        }
    }, [count]);

    return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
            {dots.slice(-3).map((id) => (
                <motion.div
                    key={id}
                    className="w-1.5 h-1.5 rounded-full bg-[#4a9eff]"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                />
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   AMBIENT SOUND (Web Audio API — low hum)
═══════════════════════════════════════════════════ */
function useAmbientSound() {
    const ctxRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const [enabled, setEnabled] = useState(false);

    const toggle = useCallback(() => {
        if (!enabled) {
            const ctx = new AudioContext();
            const gain = ctx.createGain();
            gain.gain.value = 0.015;
            gain.connect(ctx.destination);

            // Low drone
            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = 60;
            osc1.connect(gain);
            osc1.start();

            // Slight harmonic
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = 90;
            const g2 = ctx.createGain();
            g2.gain.value = 0.008;
            osc2.connect(g2);
            g2.connect(ctx.destination);
            osc2.start();

            ctxRef.current = ctx;
            gainRef.current = gain;
            setEnabled(true);
        } else {
            ctxRef.current?.close();
            ctxRef.current = null;
            setEnabled(false);
        }
    }, [enabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { ctxRef.current?.close(); };
    }, []);

    return { enabled, toggle };
}

/* ═══════════════════════════════════════════════════
   ANIMATED GRADIENT DIVIDER
═══════════════════════════════════════════════════ */
function AnimatedDivider() {
    return (
        <div className="relative h-px my-1 overflow-hidden">
            <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(74,158,255,0.3), transparent)', backgroundSize: '200% 100%' }}
                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   PHILOSOPHY LINES
═══════════════════════════════════════════════════ */
const PHILOSOPHY = [
    "1 minute = 1 KT",
    "Time only exists when declared",
    "Govern your time. Govern yourself.",
];

/* ═══════════════════════════════════════════════════
   MAIN LOGIN PAGE
═══════════════════════════════════════════════════ */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [shake, setShake] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [pwKeystrokeCount, setPwKeystrokeCount] = useState(0);
    const router = useRouter();
    const { enabled: soundEnabled, toggle: toggleSound } = useAmbientSound();

    // Mouse tracking for parallax orbs
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const orb1X = useTransform(mouseX, [0, 1], [-20, 20]);
    const orb1Y = useTransform(mouseY, [0, 1], [-15, 15]);
    const orb2X = useTransform(mouseX, [0, 1], [15, -15]);
    const orb2Y = useTransform(mouseY, [0, 1], [10, -10]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };

    useEffect(() => { setError(''); }, [isLogin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        setScanning(true);

        // Client-side validation
        if (!isLogin) {
            if (name.length < 3) {
                setError('Identity designation too short (min 3 chars)');
                setIsSubmitting(false);
                setScanning(false);
                setShake(true);
                setTimeout(() => setShake(false), 600);
                return;
            }
            if (password.length < 6) {
                setError('Security encryption too weak (min 6 chars)');
                setIsSubmitting(false);
                setScanning(false);
                setShake(true);
                setTimeout(() => setShake(false), 600);
                return;
            }
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Invalid endpoint designation (email format)');
            setIsSubmitting(false);
            setScanning(false);
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

        // Show fingerprint scan for 1s before actual request
        await new Promise(r => setTimeout(r, 1000));
        setScanning(false);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin ? { email, password } : { name, email, password };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('kalantark_token', data.token);
                document.cookie = `kalantark_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
                console.log('LOGIN — token saved to localStorage:', localStorage.getItem('kalantark_token') ? 'YES' : 'NO');
                console.log('LOGIN — cookie set:', document.cookie.includes('kalantark_token') ? 'YES' : 'NO');
                setLoginSuccess(true);
                setTimeout(() => router.push('/dashboard'), 1200);
            } else {
                setError(data.error || 'Authentication failed');
                setShake(true);
                setTimeout(() => setShake(false), 600);
            }
        } catch {
            setError('Network error. Try again.');
            setShake(true);
            setTimeout(() => setShake(false), 600);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Global autofill fix + morphing blob keyframes */}
            <style jsx global>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0px 1000px #0a1628 inset !important;
                    -webkit-text-fill-color: #ffffff !important;
                    transition: background-color 5000s ease-in-out 0s;
                    caret-color: white;
                }
                @keyframes morphBlob1 {
                    0%, 100% { border-radius: 42% 58% 50% 50% / 45% 45% 55% 55%; transform: translate(0, 0) rotate(0deg); }
                    25% { border-radius: 55% 45% 60% 40% / 50% 60% 40% 50%; transform: translate(10px, -15px) rotate(5deg); }
                    50% { border-radius: 45% 55% 40% 60% / 60% 40% 55% 45%; transform: translate(-5px, 10px) rotate(-3deg); }
                    75% { border-radius: 50% 50% 55% 45% / 40% 55% 45% 60%; transform: translate(8px, 5px) rotate(4deg); }
                }
                @keyframes morphBlob2 {
                    0%, 100% { border-radius: 50% 50% 45% 55% / 55% 45% 50% 50%; transform: translate(0, 0) rotate(0deg); }
                    33% { border-radius: 40% 60% 55% 45% / 45% 55% 50% 50%; transform: translate(-12px, 8px) rotate(-4deg); }
                    66% { border-radius: 55% 45% 50% 50% / 50% 50% 45% 55%; transform: translate(8px, -10px) rotate(6deg); }
                }
                @keyframes scanLine {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>

            {/* Success overlay */}
            <AnimatePresence>
                {loginSuccess && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                        style={{ backgroundColor: '#021024' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                    >
                        <motion.div className="absolute rounded-full border-2 border-[#4a9eff]"
                            initial={{ width: 0, height: 0, opacity: 1 }}
                            animate={{ width: 3000, height: 3000, opacity: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{ boxShadow: '0 0 60px rgba(74,158,255,0.4)' }}
                        />
                        <motion.div className="absolute rounded-full border border-[#4a9eff]/40"
                            initial={{ width: 0, height: 0, opacity: 1 }}
                            animate={{ width: 2000, height: 2000, opacity: 0 }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
                        />
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }} className="relative z-10 text-center"
                        >
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: 'linear' }}
                                className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                            >
                                <Shield size={32} className="text-[#4a9eff]" style={{ filter: 'drop-shadow(0 0 20px rgba(74,158,255,0.6))' }} />
                            </motion.div>
                            <p className="text-sm uppercase tracking-[0.3em] text-[#4a9eff] font-bold">Entering the Cycle</p>
                        </motion.div>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-[#4a9eff]"
                                initial={{ x: 0, y: 0, opacity: 0.8 }}
                                animate={{ x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600, opacity: 0, scale: 0 }}
                                transition={{ duration: 1 + Math.random(), delay: 0.1 + Math.random() * 0.3 }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex min-h-screen relative overflow-hidden" onMouseMove={handleMouseMove}>

                {/* ═══════════════════════════════════════════════════
                    LEFT PANEL
                ═══════════════════════════════════════════════════ */}
                <div className="hidden lg:flex w-[55%] relative items-center justify-center flex-col" style={{ backgroundColor: '#021024' }}>
                    <div className="absolute inset-0">
                        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_30%_50%,rgba(74,158,255,0.08)_0%,transparent_60%)]" />
                        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_70%_30%,rgba(139,92,246,0.05)_0%,transparent_50%)]" />
                        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_50%_80%,rgba(74,158,255,0.06)_0%,transparent_40%)]" />
                    </div>
                    <KTCounter />
                    <ParticleField withConstellations />
                    <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                        style={{ backgroundImage: `linear-gradient(rgba(74,158,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,1) 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
                    />
                    <RotatingBadge />
                    <div className="relative z-10 flex flex-col items-center text-center px-8">
                        <motion.h1 initial={{ opacity: 0, letterSpacing: '0.5em' }} animate={{ opacity: 1, letterSpacing: '0.25em' }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="text-5xl xl:text-6xl font-extrabold uppercase text-white mb-4"
                            style={{ fontFamily: "'Syne', 'Inter', sans-serif", textShadow: '0 0 40px rgba(74,158,255,0.3)' }}
                        >KALANTARK</motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-xs uppercase tracking-[0.4em] text-white font-medium"
                        >Sovereign Time Economy</motion.p>
                        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }}
                            className="w-24 h-px bg-gradient-to-r from-transparent via-[#4a9eff]/40 to-transparent mt-10 mb-10" />
                        <div className="space-y-3">
                            {PHILOSOPHY.map((line, i) => (
                                <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.35 }}
                                    transition={{ delay: 1.2 + i * 0.5, duration: 0.6 }}
                                    className="text-sm text-white italic tracking-wide"
                                >&ldquo;{line}&rdquo;</motion.p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════
                    RIGHT PANEL
                ═══════════════════════════════════════════════════ */}
                <div className="flex-1 flex items-center justify-center relative flex-col" style={{ backgroundColor: '#010a18' }}>
                    {/* Mobile particles */}
                    <div className="lg:hidden"><ParticleField /><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(74,158,255,0.08)_0%,transparent_60%)]" /></div>

                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_30%,rgba(74,158,255,0.04)_0%,transparent_60%)]" />

                    {/* Morphing blobs */}
                    <div className="absolute w-[280px] h-[280px] pointer-events-none" style={{
                        top: '8%', right: '5%',
                        background: 'radial-gradient(circle, rgba(74,158,255,0.06) 0%, transparent 70%)',
                        animation: 'morphBlob1 12s ease-in-out infinite',
                    }} />
                    <div className="absolute w-[220px] h-[220px] pointer-events-none" style={{
                        bottom: '12%', left: '8%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
                        animation: 'morphBlob2 10s ease-in-out infinite',
                    }} />

                    {/* Parallax orbs */}
                    <motion.div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(74,158,255,0.05) 0%, transparent 70%)', x: orb1X, y: orb1Y, top: '15%', right: '10%' }} />
                    <motion.div className="absolute w-[250px] h-[250px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)', x: orb2X, y: orb2Y, bottom: '20%', left: '15%' }} />

                    {/* Left edge glow */}
                    <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-32 pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, rgba(74,158,255,0.04) 0%, transparent 100%)' }} />

                    {/* Ambient sound toggle */}
                    <button
                        onClick={toggleSound}
                        className="absolute top-6 right-6 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[#334155] hover:text-[#4a9eff] hover:bg-[#4a9eff]/10"
                        title={soundEnabled ? 'Mute ambient' : 'Enable ambient'}
                    >
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>

                    {/* Form container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                        className="relative z-10 w-full max-w-sm mx-8 lg:mx-0 flex-1 flex flex-col items-center justify-center"
                    >
                        {/* Mobile branding */}
                        <div className="lg:hidden flex flex-col items-center mb-8">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="mb-4 p-3 rounded-2xl bg-[#4a9eff]/10 border border-[#4a9eff]/20"
                            >
                                <Shield size={32} className="text-[#4a9eff]" />
                            </motion.div>
                            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="text-3xl font-extrabold tracking-[0.3em] uppercase text-white mb-2"
                                style={{ textShadow: '0 0 20px rgba(74,158,255,0.4)' }}
                            >KALANTARK</motion.h1>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Time exists when declared</p>
                        </div>

                        {/* ── Card with animated gradient border + breathing glow ── */}
                        <motion.div
                            animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                            transition={{ duration: 0.5 }}
                            className="relative rounded-2xl w-full"
                        >
                            {/* Rotating gradient border */}
                            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                                <motion.div className="absolute inset-[-50%]"
                                    style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(74,158,255,0.4) 25%, transparent 50%, rgba(74,158,255,0.2) 75%, transparent 100%)' }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>

                            {/* Breathing glow overlay */}
                            <motion.div
                                className="absolute -inset-[1px] rounded-2xl pointer-events-none"
                                style={{ border: '1px solid rgba(74,158,255,0.15)' }}
                                animate={{ boxShadow: ['0 0 15px rgba(74,158,255,0.05)', '0 0 25px rgba(74,158,255,0.12)', '0 0 15px rgba(74,158,255,0.05)'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            {/* Card inner with cursor shine */}
                            <div
                                className="relative rounded-2xl p-8 overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(5,38,89,0.5) 0%, rgba(2,16,36,0.9) 100%)',
                                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                                }}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    const shine = e.currentTarget.querySelector('[data-shine]') as HTMLElement;
                                    if (shine) {
                                        shine.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(74,158,255,0.12), transparent 60%)`;
                                        shine.style.opacity = '1';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const shine = e.currentTarget.querySelector('[data-shine]') as HTMLElement;
                                    if (shine) shine.style.opacity = '0';
                                }}
                            >
                                {/* Cursor shine layer */}
                                <div data-shine="" className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300 opacity-0" />
                                {/* Shield icon */}
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.4 }} className="flex justify-center mb-5"
                                >
                                    <Shield size={20} className="text-[#4a9eff]" style={{ filter: 'drop-shadow(0 0 10px rgba(74,158,255,0.35))' }} />
                                </motion.div>

                                {/* Typewriter title */}
                                <AnimatePresence mode="wait">
                                    <motion.div key={isLogin ? 'login' : 'register'}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
                                        className="text-center mb-8"
                                    >
                                        <h2 className="text-3xl font-bold text-white uppercase tracking-[0.15em]"
                                            style={{ fontFamily: "'Syne', 'Inter', sans-serif" }}
                                        >
                                            <TypewriterTitle text={isLogin ? 'ENTER' : 'INITIALIZE'} />
                                        </h2>
                                        <p className="text-xs uppercase tracking-[0.2em] mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {isLogin ? 'Your sovereign cycle awaits' : 'Begin your 1440 journey'}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden"
                                        >
                                            <motion.div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-xl px-4 py-3 text-[#ff4444] text-xs font-medium text-center"
                                                animate={{ borderColor: ['rgba(255,68,68,0.5)', 'rgba(255,68,68,0.2)'] }}
                                                transition={{ duration: 0.5 }}
                                            >{error}</motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                                    <input type="password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />

                                    {/* Username (register only) */}
                                    <AnimatePresence mode="popLayout">
                                        {!isLogin && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                                            >
                                                <div className="pb-1">
                                                    <FloatingInput type="text" value={name} onChange={setName} icon={User} label="Username" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Email */}
                                    <FloatingInput type="email" value={email} onChange={setEmail} icon={Mail} label="Email" />

                                    {/* Animated divider */}
                                    <AnimatedDivider />

                                    {/* Password */}
                                    <div className="relative">
                                        <FloatingInput
                                            type="password" value={password}
                                            onChange={(v) => { setPassword(v); setPwKeystrokeCount(c => c + 1); }}
                                            icon={Lock} label="Password" autoComplete="new-password"
                                        />
                                        <KeystrokeDots count={pwKeystrokeCount} />
                                        {!isLogin && <PasswordStrength password={password} />}
                                    </div>

                                    {/* Remember me toggle */}
                                    {isLogin && (
                                        <label className="flex items-center gap-3 cursor-pointer group pt-1">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                                <div className="block w-9 h-5 rounded-full transition-all duration-300"
                                                    style={{
                                                        background: rememberMe ? 'linear-gradient(135deg, #4a9eff, #2F80ED)' : '#1a2744',
                                                        boxShadow: rememberMe ? '0 0 10px rgba(74,158,255,0.25)' : 'inset 0 1px 3px rgba(0,0,0,0.3)',
                                                        border: rememberMe ? '1px solid rgba(74,158,255,0.3)' : '1px solid rgba(74,158,255,0.1)',
                                                    }}
                                                />
                                                <div className={`absolute top-0.5 bg-white rounded-full transition-all duration-300 w-4 h-4 shadow-sm ${rememberMe ? 'left-[18px]' : 'left-0.5'}`} />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-[0.15em] font-bold transition-colors"
                                                style={{ color: rememberMe ? '#4a9eff' : 'rgba(255,255,255,0.3)' }}
                                            >Remember this node</span>
                                        </label>
                                    )}

                                    {/* Submit button with fingerprint scan */}
                                    <button
                                        type="submit" disabled={isSubmitting}
                                        className="w-full relative group font-bold py-4 rounded-xl mt-2 uppercase tracking-[0.15em] text-sm transition-all overflow-hidden text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(74,158,255,0.25)] active:scale-[0.98]"
                                        style={{ background: 'linear-gradient(135deg, #1a6fd4 0%, #4a9eff 100%)', boxShadow: '0 0 20px rgba(74,158,255,0.15)' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        <span className="relative flex items-center justify-center gap-2.5">
                                            {scanning ? (
                                                /* Fingerprint scanning animation */
                                                <span className="flex items-center gap-2">
                                                    <span className="relative w-6 h-7 flex items-center justify-center">
                                                        <svg viewBox="0 0 24 30" className="w-6 h-7 text-white">
                                                            <path d="M12 2C8.134 2 5 5.134 5 9v5c0 3.866 3.134 7 7 7s7-3.134 7-7V9c0-3.866-3.134-7-7-7zm0 2c2.761 0 5 2.239 5 5v5c0 2.761-2.239 5-5 5s-5-2.239-5-5V9c0-2.761 2.239-5 5-5zm0 2c-1.657 0-3 1.343-3 3v5c0 1.657 1.343 3 3 3s3-1.343 3-3V9c0-1.657-1.343-3-3-3zm0 2c.552 0 1 .448 1 1v5c0 .552-.448 1-1 1s-1-.448-1-1V9c0-.552.448-1 1-1z"
                                                                fill="currentColor" opacity="0.6" />
                                                        </svg>
                                                        {/* Scan line */}
                                                        <div className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                                            style={{ animation: 'scanLine 1s linear infinite' }} />
                                                    </span>
                                                    <span className="text-xs tracking-[0.2em]">Scanning...</span>
                                                </span>
                                            ) : isSubmitting ? (
                                                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            ) : isLogin ? (
                                                <>Enter the Cycle<ArrowRight size={16} /></>
                                            ) : (
                                                <><UserPlus size={16} />Initialize</>
                                            )}
                                        </span>
                                    </button>
                                </form>

                                {/* Legal text */}
                                <div className="text-center mt-5 mb-1">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                                        By continuing you agree to our <br className="sm:hidden" />
                                        <Link href="/terms" className="text-[#4a9eff] hover:text-white transition-colors">Terms & Conditions</Link> & <Link href="/privacy" className="text-[#4a9eff] hover:text-white transition-colors">Privacy Policy</Link>
                                    </p>
                                </div>

                                {/* Toggle */}
                                <p className="text-center mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                    {isLogin ? 'No account? ' : 'Already sovereign? '}
                                    <button onClick={() => setIsLogin(!isLogin)}
                                        className="text-[#4a9eff] hover:text-white transition-colors font-semibold relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-0 after:left-0 after:bg-[#4a9eff] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300"
                                    >
                                        {isLogin ? 'Initialize here' : 'Enter here'}
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Footer watermark */}
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.08)' }}>
                            v1.0 · KALANTARK SYSTEMS
                        </span>
                    </div>
                </div>

            </div>
        </>
    );
}
