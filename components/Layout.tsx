'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Target, Flame, Users, LogOut, Settings, UserCircle, Menu, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsModal } from './SettingsModal';
import { fetchWithAuth, getToken } from '@/lib/api';
import { getMilestone } from '@/lib/utils/milestone';
import { AnimatedNumber } from './AnimatedNumber';

export function Sidebar() {
    const pathname = usePathname();
    const [userName, setUserName] = useState<string>('');
    const [totalLifetimeKT, setTotalLifetimeKT] = useState<number>(0);

    useEffect(() => {
        const loadUser = async () => {
            const cached = sessionStorage.getItem('kt_user_cache');
            if (cached) {
                try {
                    const user = JSON.parse(cached);
                    if (user && user.name) {
                        setUserName(user.name);
                        return;
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }

            try {
                const res = await fetchWithAuth('/api/user/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.name) {
                        setUserName(data.name);
                        sessionStorage.setItem('kt_user_cache', JSON.stringify(data));
                    }
                }
            } catch (error) {
                console.error("Failed to load user name:", error);
            }
        };

        const loadKT = async () => {
            try {
                const res = await fetchWithAuth('/api/sessions/live');
                if (res.ok) {
                    const data = await res.json();
                    setTotalLifetimeKT(data.total_lifetime_kt || 0);
                }
            } catch (e) { /* silent */ }
        };

        loadUser();
        loadKT();
    }, []);

    const milestone = getMilestone(totalLifetimeKT);

    const coreLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'History', href: '/history', icon: Activity },
        { name: 'Analytics', href: '/analytics', icon: Target },
    ];

    const identityLinks = [
        { name: 'Streak', href: '/streak', icon: Flame },
        { name: 'About KalanTark', href: '/about', icon: BookOpen },
        { name: 'Profile', href: '/profile', icon: UserCircle },
        { name: 'Control Center', href: '/settings', icon: Settings },
    ];

    const renderLink = (link: { name: string; href: string; icon: React.ElementType }) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
            <Link key={link.name} href={link.href} className="relative block group">
                {/* Active Background and Glow Bar */}
                {isActive && (
                    <>
                        <div
                            className="absolute inset-0 rounded-lg"
                            style={{ backgroundColor: 'rgba(74, 158, 255, 0.08)' }}
                        />
                        <motion.div
                            layoutId="sidebar-active-glow"
                            className="absolute left-0 top-0 bottom-0 w-[3px]"
                            style={{
                                backgroundColor: '#4a9eff',
                                borderRadius: '0 3px 3px 0',
                                boxShadow: '0 0 12px rgba(74, 158, 255, 0.7), 0 0 24px rgba(74, 158, 255, 0.3)'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </>
                )}

                {/* Inactive Hover Background Sweep */}
                {!isActive && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-white/5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out" />
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4a9eff]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                )}

                <div
                    className={`relative px-4 py-3 flex items-center gap-4 rounded-lg font-medium transition-colors duration-150 ${isActive ? 'text-[#C1E8FF]' : 'text-[#5483B3] group-hover:text-[#7DA0CA]'}`}
                >
                    <Icon size={18} className={isActive ? 'text-[#4a9eff]' : ''} />
                    {link.name}
                </div>
            </Link>
        );
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col z-40 overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #040d1a 0%, #060e1e 60%, #0a0f1e 100%)',
                borderRight: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            {/* Option F: Subtle gradient depth edge on right side */}
            <div className="absolute top-0 right-0 w-px h-full" style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(74,158,255,0.15) 40%, rgba(74,158,255,0.08) 70%, transparent 100%)'
            }} />

            {/* BRANDING */}
            <div className="h-20 flex items-center px-6 border-b border-white/[0.05]" suppressHydrationWarning>
                <motion.span
                    initial={{ letterSpacing: '0.3em', textShadow: '0 0 0px rgba(74,158,255,0)' }}
                    animate={{ letterSpacing: '0.1em', textShadow: '0 0 20px rgba(74,158,255,0.4)' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="font-mono font-extrabold text-white text-lg uppercase"
                >
                    KALANTARK
                </motion.span>
            </div>

            {/* NAVIGATION — Option D: Grouped with glass dividers */}
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">

                {/* Core Section */}
                <div className="mb-1">
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#2d4a6a]">Core</span>
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(74,158,255,0.12) 0%, transparent 100%)' }} />
                    </div>
                    <div className="space-y-1">
                        {coreLinks.map(renderLink)}
                    </div>
                </div>

                {/* Glass divider between groups */}
                <div className="my-3 mx-2 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)' }} />

                {/* Identity Section */}
                <div>
                    <div className="flex items-center gap-2 px-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#2d4a6a]">Identity</span>
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(74,158,255,0.12) 0%, transparent 100%)' }} />
                    </div>
                    <div className="space-y-1">
                        {identityLinks.map(renderLink)}
                    </div>
                </div>
            </nav>

            {/* FOOTER — Option E: Premium user card */}
            <div className="p-4 border-t border-white/[0.05]" style={{ background: 'rgba(4,13,26,0.6)' }}>
                <div className="flex items-center gap-3 px-2">
                    {/* Avatar circle with initials */}
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{
                            background: 'linear-gradient(135deg, #1a3a6e 0%, #052659 100%)',
                            border: '1px solid rgba(74,158,255,0.25)',
                            boxShadow: '0 0 10px rgba(74,158,255,0.1)',
                        }}
                    >
                        {userName ? userName.slice(0, 2).toUpperCase() : '??'}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                        {userName && (
                            <div className="text-sm font-semibold text-[#C1E8FF] truncate leading-none mb-1">
                                {userName}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <img src={milestone.badge} alt={milestone.name} className="w-3.5 h-3.5" />
                            <span className="text-[10px] text-[#3d6a9e] font-medium uppercase tracking-wider truncate">
                                {milestone.name}
                            </span>
                        </div>
                    </div>


                </div>
            </div>

        </aside>
    );
}

export function MobileSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const coreLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'History', href: '/history', icon: Activity },
        { name: 'Analytics', href: '/analytics', icon: Target },
    ];

    const identityLinks = [
        { name: 'Streak', href: '/streak', icon: Flame },
        { name: 'About KalanTark', href: '/about', icon: BookOpen },
        { name: 'Profile', href: '/profile', icon: UserCircle },
        { name: 'Control Center', href: '/settings', icon: Settings },
    ];

    const renderLink = (link: any) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        
        return (
            <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block group relative cursor-pointer outline-none"
            >
                {isActive && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-[#4a9eff]/10" />
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4a9eff] shadow-[0_0_15px_rgba(74,158,255,0.6)]" />
                    </div>
                )}
                {!isActive && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-white/5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out" />
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4a9eff]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                )}
                <div
                    className={`relative px-4 py-3 flex items-center gap-4 rounded-lg font-medium transition-colors duration-150 ${isActive ? 'text-[#C1E8FF]' : 'text-[#5483B3] group-hover:text-[#7DA0CA]'}`}
                >
                    <Icon size={18} className={isActive ? 'text-[#4a9eff]' : ''} />
                    {link.name}
                </div>
            </Link>
        );
    };

    return (
        <div className="md:hidden">
            {/* Hamburger Button (Fixed Top Left) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-[100] p-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-colors shadow-lg backdrop-blur-md"
            >
                <Menu size={24} />
            </button>

            {/* Slide-in Overlay and Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
                        />

                        {/* Sidebar Panel */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 z-[120] w-[75%] max-w-[300px] flex flex-col pt-safe pb-safe"
                            style={{
                                background: 'linear-gradient(180deg, #040d1a 0%, #060e1e 60%, #0a0f1e 100%)',
                                borderRight: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            <div className="absolute top-0 right-0 w-px h-full" style={{
                                background: 'linear-gradient(180deg, transparent 0%, rgba(74,158,255,0.15) 40%, rgba(74,158,255,0.08) 70%, transparent 100%)'
                            }} />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-6 border-b border-white/[0.05]">
                                <span className="text-xl font-bold tracking-widest text-white font-mono uppercase">KALANTARK</span>
                                <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-white/50 hover:text-white transition-colors relative z-10">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Nav Links */}
                            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
                                {/* Core Section */}
                                <div className="mb-1">
                                    <div className="flex items-center gap-2 px-2 mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#2d4a6a]">Core</span>
                                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(74,158,255,0.12) 0%, transparent 100%)' }} />
                                    </div>
                                    <div className="space-y-1">
                                        {coreLinks.map(renderLink)}
                                    </div>
                                </div>

                                {/* Glass divider */}
                                <div className="my-3 mx-2 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)' }} />

                                {/* Identity Section */}
                                <div>
                                    <div className="flex items-center gap-2 px-2 mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#2d4a6a]">Identity</span>
                                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(74,158,255,0.12) 0%, transparent 100%)' }} />
                                    </div>
                                    <div className="space-y-1">
                                        {identityLinks.map(renderLink)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


export function Topbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Global shared states for Topbar
    const [currentCategory, setCurrentCategory] = useState<any>(null);
    const [activeKT, setActiveKT] = useState<number>(0);
    const [totalLifetimeKT, setTotalLifetimeKT] = useState<number>(0);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const milestone = getMilestone(totalLifetimeKT);

    // Global fetch and ticking logic for Topbar
    useEffect(() => {
        let hasActiveSession = false;
        let snapshotKT: number = 0;        // total_cycle_kt at the moment of the last poll
        let snapshotTime: number = 0;       // timestamp (ms) of the last poll
        let isPolling = false;              // guard against overlapping requests

        const loadSessionData = async () => {
            if (isPolling) return; // prevent race condition from overlapping polls
            isPolling = true;

            const token = getToken();
            if (!token) { isPolling = false; return; }

            try {
                const res = await fetchWithAuth('/api/sessions/live');
                if (res.ok) {
                    const data = await res.json();

                    if (data.activeSession) {
                        setCurrentCategory(data.activeSession.category);
                        hasActiveSession = true;
                    } else {
                        setCurrentCategory(null);
                        hasActiveSession = false;
                    }

                    // Snapshot: record what the server said + when it said it
                    snapshotKT = data.total_cycle_kt || 0;
                    snapshotTime = Date.now();

                    setTotalLifetimeKT(data.total_lifetime_kt || 0);
                    setActiveKT(Math.min(snapshotKT, 1440)); // immediate update
                }
            } catch (err) {
                console.error("Topbar live session fetch failed:", err);
            } finally {
                isPolling = false;
            }
        };

        const tick = () => {
            if (!hasActiveSession || snapshotTime === 0) {
                setActiveKT(Math.min(snapshotKT, 1440));
                return;
            }
            // How many whole minutes have passed since the last server poll?
            const minutesSinceSnapshot = Math.floor((Date.now() - snapshotTime) / 60000);
            setActiveKT(Math.min(snapshotKT + minutesSinceSnapshot, 1440));
        };

        loadSessionData();
        const pollInterval = setInterval(loadSessionData, 10000); // Poll DB every 10s 
        const tickInterval = setInterval(tick, 1000); // Tick local clock every 1s

        return () => {
            clearInterval(pollInterval);
            clearInterval(tickInterval);
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen for custom event from sidebar to open settings
    useEffect(() => {
        const handleOpenSettings = () => {
            setIsSettingsOpen(true);
        };
        window.addEventListener('open-settings', handleOpenSettings);
        return () => window.removeEventListener('open-settings', handleOpenSettings);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('kalantark_token');
        sessionStorage.removeItem('kt_user_cache');
        window.location.href = '/login';
    };

    return (
        <>
            <header className="fixed top-0 left-0 md:left-64 right-0 h-16 md:h-20 glass-topbar z-30 flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6">
                <div className="flex items-center gap-4">
                    <span className="text-muted tracking-widest text-xs uppercase hidden lg:block">Live Status</span>
                    {currentCategory ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-full">
                                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                                <span className="text-sm font-medium">{currentCategory.emoji} {currentCategory.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                <img src={milestone.badge} alt={milestone.name} className="w-5 h-5" />
                                <span className="text-xs font-medium text-white/70 tracking-wide">
                                    {milestone.name}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-full text-muted">
                                <div className="w-2 h-2 rounded-full bg-border" />
                                <span className="text-sm font-medium">Idling</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                <img src={milestone.badge} alt={milestone.name} className="w-5 h-5" />
                                <span className="text-xs font-medium text-white/70 tracking-wide">
                                    {milestone.name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6 relative" ref={dropdownRef}>
                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-mono font-bold text-accent-blue tabular-nums"><AnimatedNumber value={activeKT} className="text-2xl font-mono font-bold text-accent-blue tabular-nums" /></div>
                        <div className="text-[10px] uppercase tracking-widest text-muted">Active KT</div>
                    </div>

                    {/* Top Right Disconnect Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-muted hover:text-accent-red transition-colors rounded-lg hover:bg-accent-red/10"
                    >
                        <span className="font-medium hidden sm:block text-sm">Disconnect</span>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Injected Slide-over Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    )
}
