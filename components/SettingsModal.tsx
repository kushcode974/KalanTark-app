'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/lib/api';
import { X, Shield, User, Mail, KeyRound, AlertTriangle, Clock, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

type CategoryType = { id: string; name: string; emoji: string; };

export function SettingsModal({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
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
    const [isLoading, setIsLoading] = useState(false);

    // Prevent hydration errors by ensuring component is mounted before using sessionStorage
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen || !isMounted) return;

        const loadSettings = async () => {
            setIsLoading(true);

            // Fetch categories
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
    }, [isOpen]);

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
        if (deleteConfirm !== 'DELETE') return;
        const res = await fetchWithAuth('/api/user/settings', { method: 'DELETE' });
        if (res.ok) {
            window.location.href = '/login';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex justify-end"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sliding Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-xl h-full bg-surface border-l border-border shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                            <div className="flex items-center gap-3" suppressHydrationWarning>
                                <Shield className="text-accent-blue" size={24} suppressHydrationWarning />
                                <h2 className="text-2xl font-bold tracking-tight uppercase">Control Center</h2>
                            </div>
                            <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 relative">

                            {/* Toast Notifications handled globally by Toaster */}

                            {isLoading || !user ? (
                                <div className="flex flex-col items-center justify-center h-40 text-muted uppercase tracking-widest text-sm">
                                    <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mb-4" />
                                    Accessing Core...
                                </div>
                            ) : (
                                <div className="space-y-12">

                                    {/* Identity */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <User className="text-muted" size={18} />
                                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted">Identity Directives</h3>
                                        </div>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">Display Alias</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                                                        className="flex-1 bg-background border border-border px-4 py-2 rounded-lg focus:border-accent-blue outline-none transition-colors text-sm"
                                                    />
                                                    <button onClick={updateName} disabled={name === user.name} className="px-6 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white">
                                                        Deploy
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">Security Point (Email)</label>
                                                <div className="px-4 py-2 bg-background border border-border rounded-lg text-muted font-mono text-sm mb-3">
                                                    {user.email}
                                                </div>

                                                <div className="bg-background/50 border border-border/50 p-4 rounded-xl">
                                                    <div className="flex gap-3">
                                                        <input
                                                            type="email" placeholder="New endpoint parameter..." value={email} onChange={(e) => setEmail(e.target.value)}
                                                            className="flex-1 bg-surface border border-border px-4 py-2 rounded-lg focus:border-accent-blue outline-none transition-colors text-sm"
                                                        />
                                                        <button onClick={updateEmail} disabled={!email} className="px-4 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50 border border-border hover:border-accent-blue hover:text-accent-blue">
                                                            Request
                                                        </button>
                                                    </div>
                                                    {user.pending_email && (
                                                        <div className="text-[10px] text-accent-gold uppercase tracking-widest flex items-center gap-2 mt-3">
                                                            <Mail size={12} /> Pending Verification: <span className="font-mono">{user.pending_email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Time Cycle Settings */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="text-muted" size={18} />
                                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted">Time Cycle Settings</h3>
                                        </div>
                                        <div className="bg-background border border-border p-5 rounded-xl space-y-4 relative overflow-hidden group">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">Daily Cycle Start Time</label>
                                                <p className="text-[10px] text-muted/70 mb-3">Your 24-hour KT cycle logic begins and ends relative to this sovereign timezone block. Modifying this adjusts the zero-hour offset.</p>
                                                <div className="flex gap-3 items-center">
                                                    <input
                                                        type="time" value={dayStartTime} onChange={(e) => setDayStartTime(e.target.value)}
                                                        className="w-32 bg-surface border border-border px-4 py-2 rounded-lg focus:border-accent-blue outline-none transition-colors font-mono text-sm"
                                                    />
                                                    <button onClick={updateTimeCycle} className="px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white">
                                                        Recalibrate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Streak Settings */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Flame className="text-muted" size={18} />
                                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted">Discipline Engine</h3>
                                        </div>
                                        <div className="bg-background border border-border p-5 rounded-xl space-y-5">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" checked={streakEnabled} onChange={(e) => setStreakEnabled(e.target.checked)} />
                                                    <div className={`block w-10 h-6 rounded-full transition-colors ${streakEnabled ? 'bg-accent-gold' : 'bg-surface border border-border'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${streakEnabled ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                                <div className="text-xs uppercase tracking-widest text-white font-bold">Enable Streak Tracking</div>
                                            </label>

                                            {streakEnabled && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 border-t border-border/50 pt-4">
                                                    <div>
                                                        <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">Minimum KT Target Per Cycle</label>
                                                        <input
                                                            type="number" min="0" step="10" value={streakTarget} onChange={(e) => setStreakTarget(Number(e.target.value))}
                                                            className="w-full bg-surface border border-border px-4 py-2 rounded-lg focus:border-accent-gold outline-none transition-colors font-mono text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">Required Vector (Optional)</label>
                                                        <select
                                                            value={streakCategory} onChange={(e) => setStreakCategory(e.target.value)}
                                                            className="w-full bg-surface border border-border px-4 py-2 rounded-lg focus:border-accent-gold outline-none transition-colors font-mono text-sm text-foreground"
                                                        >
                                                            <option value="">Global Tracker (Any Category)</option>
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button onClick={updateStreakSettings} className="w-full py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold hover:text-background">
                                                        Save Parameters
                                                    </button>
                                                </motion.div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Credentials */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <KeyRound className="text-muted" size={18} />
                                            <h3 className="text-sm font-bold tracking-widest uppercase text-muted">Vault Security</h3>
                                        </div>
                                        <div className="bg-background border border-border p-5 rounded-xl space-y-4">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">Current Authorization Code</label>
                                                <input
                                                    type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full bg-surface border border-border px-4 py-2 rounded-lg focus:border-accent-blue outline-none transition-colors font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">New Security Layer</label>
                                                <input
                                                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-surface border border-border px-4 py-2 rounded-lg focus:border-accent-blue outline-none transition-colors font-mono text-sm"
                                                />
                                            </div>
                                            <button onClick={updatePassword} disabled={!currentPassword || !newPassword} className="w-full mt-2 py-3 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white">
                                                Overwrite Credentials
                                            </button>
                                        </div>
                                    </section>

                                    {/* Destructive */}
                                    <section className="pt-8 border-t border-accent-red/10">
                                        <div className="flex items-center gap-2 mb-6">
                                            <AlertTriangle className="text-accent-red" size={18} />
                                            <h3 className="text-sm font-bold tracking-widest uppercase text-accent-red">System Destruction</h3>
                                        </div>

                                        {!isDeleting ? (
                                            <button onClick={() => setIsDeleting(true)} className="w-full bg-accent-red/5 border border-accent-red/20 text-accent-red hover:bg-accent-red hover:text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                                                Initiate Eradication Protocol
                                            </button>
                                        ) : (
                                            <div className="bg-background border border-accent-red/50 p-5 rounded-xl animate-in fade-in slide-in-from-top-2">
                                                <p className="text-[10px] uppercase tracking-widest text-accent-red font-bold mb-4">Confirm total matrix annhilation. Type "DELETE":</p>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE"
                                                        className="flex-1 bg-surface border border-accent-red/30 focus:border-accent-red px-4 py-2 rounded-lg outline-none font-mono text-sm text-accent-red placeholder:text-accent-red/20"
                                                    />
                                                    <button onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE'} className="bg-accent-red text-white px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                        Execute
                                                    </button>
                                                </div>
                                                <button onClick={() => { setIsDeleting(false); setDeleteConfirm(''); }} className="mt-4 w-full py-2 text-[10px] text-muted hover:text-white uppercase tracking-widest font-bold">Abort Protocol</button>
                                            </div>
                                        )}
                                    </section>

                                </div>
                            )}

                        </div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
}
