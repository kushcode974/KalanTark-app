'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, getToken } from '@/lib/api';
import { Sidebar, Topbar, MobileSidebar } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import { TiltCard } from '@/components/TiltCard';
import { Shield, User, Clock, Flame, KeyRound, AlertTriangle, Mail, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type CategoryType = { id: string; name: string; emoji: string; };

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [categories, setCategories] = useState<CategoryType[]>([]);

    // Forms
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Time Cycle & Streak
    const [dayStartTime, setDayStartTime] = useState('06:00');
    const [streakEnabled, setStreakEnabled] = useState(true);
    const [streakTarget, setStreakTarget] = useState(0);
    const [streakCategory, setStreakCategory] = useState<string>('');

    // States
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    // If token already exists, skip loading — show page instantly on app reopen
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window === 'undefined') return true;
        return !getToken();
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }

        const loadSettings = async () => {
            const catRes = await fetchWithAuth('/api/categories');
            if (catRes.ok) {
                const data = await catRes.json();
                setCategories(data.categories || []);
            }

            const res = await fetchWithAuth('/api/user/settings');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setName(data.name);
                setDayStartTime(data.day_start_time || '06:00');
                if (data.streak) {
                    setStreakEnabled(data.streak.is_enabled);
                    setStreakTarget(data.streak.target_kt || 0);
                    setStreakCategory(data.streak.category_id || '');
                }
                setEmail('');
            }
            setIsLoading(false);
        };
        loadSettings();
    }, [router]);

    const updateName = async () => {
        const res = await fetchWithAuth('/api/user/settings', {
            method: 'PUT', body: JSON.stringify({ action: 'update_name', name })
        });
        if (res.ok) {
            const updated = await res.json();
            setUser(updated);
            sessionStorage.setItem('kt_user_cache', JSON.stringify(updated));
            toast.success('Identity alias updated');
        } else {
            toast.error('Failed to update alias');
        }
    };

    const updateEmail = async () => {
        if (!email) return;
        const res = await fetchWithAuth('/api/user/settings', {
            method: 'PUT', body: JSON.stringify({ action: 'request_email_change', email })
        });
        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            sessionStorage.setItem('kt_user_cache', JSON.stringify(data.user));
            setEmail('');
            toast.success('Protocol sent: Verification required');
        } else {
            const err = await res.json();
            toast.error(err.error || 'Failed to request email change');
        }
    };

    const updatePassword = async () => {
        if (newPassword.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }
        const res = await fetchWithAuth('/api/user/settings', {
            method: 'PUT', body: JSON.stringify({ action: 'update_password', currentPassword, newPassword })
        });
        if (res.ok) {
            setCurrentPassword('');
            setNewPassword('');
            setShowPasswordSection(false);
            toast.success('Vault credentials secured');
        } else {
            const err = await res.json();
            toast.error(err.error || 'Invalid current password');
        }
    };

    const updateTimeCycle = async () => {
        const res = await fetchWithAuth('/api/user/settings', {
            method: 'PUT', body: JSON.stringify({ action: 'update_time_cycle', day_start_time: dayStartTime, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        });
        if (res.ok) toast.success('Time cycle boundary updated');
        else toast.error('Failed to sync cycle');
    };

    const updateStreakSettings = async () => {
        const res = await fetchWithAuth('/api/user/settings', {
            method: 'PUT', body: JSON.stringify({ action: 'update_streak_settings', is_enabled: streakEnabled, target_kt: streakTarget, category_id: streakCategory || null })
        });
        if (res.ok) toast.success('Streak matrix recalibrated');
        else toast.error('Failed to update streak engine');
    };

    const deleteAccount = async () => {
        if (deleteConfirm !== 'ERADICATE') return;
        const res = await fetchWithAuth('/api/user/settings', { method: 'DELETE' });
        if (res.ok) {
            window.location.href = '/login';
        }
    };

    // Shared styles
    const inputStyle = "w-full bg-[#021024] border border-[rgba(74,158,255,0.12)] px-4 py-3.5 rounded-xl focus:border-[#4a9eff] focus:shadow-[0_0_16px_rgba(74,158,255,0.2)] outline-none transition-all text-sm font-mono text-white placeholder:text-[#334155]";
    const labelStyle = "block text-[10px] uppercase tracking-[0.2em] text-[#5483B3] font-bold mb-2.5";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex">
                <Sidebar />
                <div className="flex-1 md:ml-64 relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Topbar />
                <MobileSidebar />

                <main className="flex-1 overflow-y-auto px-6 pt-28 pb-24 custom-scrollbar">
                    <PageTransition className="max-w-3xl mx-auto space-y-6">

                        {/* Page Header */}
                        <div className="mb-6 md:mb-8">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                <Shield className="text-[#4a9eff] shrink-0" size={32} style={{ filter: 'drop-shadow(0 0 8px rgba(74,158,255,0.5))' }} />
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Control Center</h1>
                            </div>
                            <p className="text-[#5483B3] text-[10px] md:text-sm uppercase tracking-[0.2em]">Sovereign System Configuration</p>
                        </div>

                        {/* ── Section 1: Identity Directives ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <TiltCard>
                                <div className="glass-data rounded-2xl p-7 md:p-9">
                                    <div className="flex items-center gap-2.5 mb-7">
                                        <User size={18} className="text-[#4a9eff]" style={{ filter: 'drop-shadow(0 0 6px rgba(74,158,255,0.4))' }} />
                                        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5483B3]">Identity Directives</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Display Alias */}
                                        <div>
                                            <label className={labelStyle}>Display Alias</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} />
                                        </div>

                                        <button
                                            onClick={updateName}
                                            disabled={name === user?.name}
                                            className="w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white relative overflow-hidden group"
                                            style={{ background: 'linear-gradient(135deg, #4a9eff 0%, #2F80ED 100%)', boxShadow: '0 0 20px rgba(74,158,255,0.2)' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative z-10">Deploy Identity</span>
                                        </button>

                                        {/* Email */}
                                        <div>
                                            <label className={labelStyle}>Security Point (Email)</label>
                                            <div className="px-4 py-3.5 bg-[#021024] border border-[rgba(74,158,255,0.08)] rounded-xl text-[#5483B3] font-mono text-sm">
                                                {user?.email}
                                            </div>
                                        </div>

                                        <div className="bg-[#021024]/50 border border-[rgba(74,158,255,0.08)] p-5 rounded-xl">
                                            <label className={labelStyle}>Request New Endpoint</label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input type="email" placeholder="new@endpoint.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} />
                                                <button
                                                    onClick={updateEmail} disabled={!email}
                                                    className="shrink-0 px-6 py-3.5 sm:py-0 rounded-xl font-bold uppercase tracking-[0.15em] text-[10px] transition-all disabled:opacity-30 border border-[rgba(74,158,255,0.25)] text-[#4a9eff] hover:bg-[#4a9eff]/10"
                                                >
                                                    Request
                                                </button>
                                            </div>
                                            {user?.pending_email && (
                                                <div className="text-[10px] text-[#ffd700] uppercase tracking-widest flex items-center gap-2 mt-3">
                                                    <Mail size={12} /> Pending: <span className="font-mono">{user.pending_email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Collapsible Password Change */}
                                        <button
                                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                                            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#5483B3] hover:text-[#4a9eff] transition-colors font-bold"
                                        >
                                            <ChevronDown size={14} className={`transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} />
                                            Change Password
                                        </button>

                                        <AnimatePresence>
                                            {showPasswordSection && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-4 overflow-hidden"
                                                >
                                                    <div>
                                                        <label className={labelStyle}>Current Authorization Code</label>
                                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputStyle} />
                                                    </div>
                                                    <div>
                                                        <label className={labelStyle}>New Security Layer</label>
                                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyle} />
                                                    </div>
                                                    <button
                                                        onClick={updatePassword} disabled={!currentPassword || !newPassword}
                                                        className="w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-xs transition-all disabled:opacity-30 text-white relative overflow-hidden group"
                                                        style={{ background: 'linear-gradient(135deg, #4a9eff 0%, #2F80ED 100%)', boxShadow: '0 0 20px rgba(74,158,255,0.2)' }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                        <span className="relative z-10">Overwrite Credentials</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>

                        {/* ── Section 2: Time Cycle Settings ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <TiltCard>
                                <div className="glass-data rounded-2xl p-7 md:p-9">
                                    <div className="flex items-center gap-2.5 mb-7">
                                        <Clock size={18} className="text-[#4a9eff]" style={{ filter: 'drop-shadow(0 0 6px rgba(74,158,255,0.4))' }} />
                                        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5483B3]">Time Cycle Settings</h2>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className={labelStyle}>Daily Cycle Start Time</label>
                                            <p className="text-[10px] text-[#334155] mb-3 leading-relaxed">
                                                Your 24-hour KT cycle begins and ends relative to this time. Modifying this adjusts the zero-hour offset for all calculations.
                                            </p>
                                            <input type="time" value={dayStartTime} onChange={(e) => setDayStartTime(e.target.value)} className={`w-44 ${inputStyle}`} />
                                        </div>
                                        <button
                                            onClick={updateTimeCycle}
                                            className="w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-xs transition-all text-white relative overflow-hidden group"
                                            style={{ background: 'linear-gradient(135deg, #4a9eff 0%, #2F80ED 100%)', boxShadow: '0 0 20px rgba(74,158,255,0.2)' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative z-10">Recalibrate Cycle</span>
                                        </button>
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>

                        {/* ── Section 3: Discipline Engine ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <TiltCard>
                                <div className="glass-data rounded-2xl p-7 md:p-9">
                                    <div className="flex items-center gap-2.5 mb-7">
                                        <Flame size={18} className="text-orange-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.4))' }} />
                                        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5483B3]">Discipline Engine</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Premium Toggle */}
                                        <label className="flex items-center gap-5 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={streakEnabled} onChange={(e) => setStreakEnabled(e.target.checked)} />
                                                <div
                                                    className="block w-16 h-9 rounded-full transition-all duration-300"
                                                    style={{
                                                        background: streakEnabled ? 'linear-gradient(135deg, #fb923c, #f97316)' : '#1a2744',
                                                        boxShadow: streakEnabled ? '0 0 18px rgba(251,146,60,0.35), inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.3)',
                                                        border: streakEnabled ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(74,158,255,0.1)',
                                                    }}
                                                />
                                                <div
                                                    className={`absolute top-1 bg-white rounded-full transition-all duration-300 shadow-lg ${streakEnabled ? 'left-8 w-7 h-7' : 'left-1 w-7 h-7'}`}
                                                    style={{ boxShadow: streakEnabled ? '0 0 8px rgba(251,146,60,0.3)' : '0 2px 4px rgba(0,0,0,0.3)' }}
                                                />
                                            </div>
                                            <span className="text-sm uppercase tracking-[0.15em] text-white font-bold group-hover:text-orange-400 transition-colors">
                                                Enable Streak Tracking
                                            </span>
                                        </label>

                                        <AnimatePresence>
                                            {streakEnabled && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-5 border-t border-white/[0.06] pt-6 overflow-hidden"
                                                >
                                                    <div>
                                                        <label className={labelStyle}>Minimum KT Target Per Cycle</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number" min="0" step="10" value={streakTarget} onChange={(e) => setStreakTarget(Number(e.target.value))}
                                                                className={inputStyle}
                                                            />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#5483B3] font-bold uppercase tracking-widest">KT</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className={labelStyle}>Required Vector (Optional)</label>
                                                        <select
                                                            value={streakCategory} onChange={(e) => setStreakCategory(e.target.value)}
                                                            className={`${inputStyle} appearance-none cursor-pointer`}
                                                        >
                                                            <option value="">Global Tracker (Any Category)</option>
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <button
                                                        onClick={updateStreakSettings}
                                                        className="w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-xs transition-all text-white relative overflow-hidden group"
                                                        style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', boxShadow: '0 0 20px rgba(251,146,60,0.2)' }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                        <span className="relative z-10">Save Parameters</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>

                        {/* ── Section 4: Vault Security ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <TiltCard>
                                <div className="glass-data rounded-2xl p-7 md:p-9">
                                    <div className="flex items-center gap-2.5 mb-7">
                                        <KeyRound size={18} className="text-[#4a9eff]" style={{ filter: 'drop-shadow(0 0 6px rgba(74,158,255,0.4))' }} />
                                        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5483B3]">Vault Security</h2>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className={labelStyle}>Current Authorization Code</label>
                                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputStyle} />
                                        </div>
                                        <div>
                                            <label className={labelStyle}>New Security Layer</label>
                                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyle} />
                                        </div>
                                        <button
                                            onClick={updatePassword} disabled={!currentPassword || !newPassword}
                                            className="w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white relative overflow-hidden group"
                                            style={{ background: 'linear-gradient(135deg, #4a9eff 0%, #2F80ED 100%)', boxShadow: '0 0 20px rgba(74,158,255,0.2)' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative z-10">Overwrite Credentials</span>
                                        </button>
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>

                        {/* ── Section 5: Danger Zone ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <TiltCard>
                                <div className="glass-data rounded-2xl p-7 md:p-9" style={{ borderColor: 'rgba(255,68,68,0.15)' }}>
                                    <div className="flex items-center gap-2.5 mb-7">
                                        <AlertTriangle size={18} className="text-[#ff4444]" style={{ filter: 'drop-shadow(0 0 6px rgba(255,68,68,0.4))' }} />
                                        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#ff4444]">Danger Zone</h2>
                                    </div>

                                    {!isDeleting ? (
                                        <button
                                            onClick={() => setIsDeleting(true)}
                                            className="w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] text-xs transition-all text-white relative overflow-hidden group"
                                            style={{ background: 'linear-gradient(135deg, #ff4444 0%, #dc2626 100%)', boxShadow: '0 0 20px rgba(255,68,68,0.15)' }}
                                        >
                                            {/* Pulse animation */}
                                            <motion.div
                                                className="absolute inset-0 rounded-xl"
                                                style={{ background: 'linear-gradient(135deg, rgba(255,68,68,0.3) 0%, transparent 100%)' }}
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                <AlertTriangle size={14} />
                                                Initiate Eradication Protocol
                                            </span>
                                        </button>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-[#021024] border border-[rgba(255,68,68,0.25)] p-6 rounded-xl"
                                        >
                                            <div className="flex items-center gap-2 mb-4">
                                                <motion.div
                                                    animate={{ opacity: [1, 0.5, 1] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    <AlertTriangle size={16} className="text-[#ff4444]" />
                                                </motion.div>
                                                <p className="text-[10px] uppercase tracking-[0.15em] text-[#ff4444] font-bold">
                                                    Confirm total matrix annihilation. Type &quot;ERADICATE&quot; to proceed:
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input
                                                    type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="ERADICATE"
                                                    className="flex-1 bg-[#0a0a15] border border-[rgba(255,68,68,0.2)] focus:border-[#ff4444] focus:shadow-[0_0_12px_rgba(255,68,68,0.15)] px-4 py-3.5 rounded-xl outline-none font-mono text-sm text-[#ff4444] placeholder:text-[#ff4444]/20 transition-all"
                                                />
                                                <button
                                                    onClick={deleteAccount} disabled={deleteConfirm !== 'ERADICATE'}
                                                    className="px-6 py-3.5 sm:py-0 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white relative overflow-hidden group"
                                                    style={{ background: 'linear-gradient(135deg, #ff4444 0%, #dc2626 100%)' }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                    <span className="relative z-10">Execute</span>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => { setIsDeleting(false); setDeleteConfirm(''); }}
                                                className="mt-4 w-full py-2.5 text-[10px] text-[#5483B3] hover:text-white uppercase tracking-widest font-bold transition-colors"
                                            >
                                                Abort Protocol
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </TiltCard>
                        </motion.div>

                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
