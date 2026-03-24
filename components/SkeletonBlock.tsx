'use client';

interface SkeletonBlockProps {
    className?: string;
    rounded?: string;
}

export function SkeletonBlock({ className = '', rounded = 'rounded-lg' }: SkeletonBlockProps) {
    return (
        <div
            className={`animate-shimmer bg-gradient-to-r from-[#0a0f1e] via-[#0d1426] to-[#0a0f1e] bg-[length:200%_100%] ${rounded} ${className}`}
        />
    );
}

export function DashboardSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Timer ring skeleton */}
                <div className="glass-hero rounded-3xl p-12 flex flex-col items-center justify-center">
                    <SkeletonBlock className="w-[280px] h-[280px]" rounded="rounded-full" />
                    <div className="flex gap-2 mt-6">
                        <SkeletonBlock className="w-16 h-12" />
                        <SkeletonBlock className="w-16 h-12" />
                        <SkeletonBlock className="w-16 h-12" />
                    </div>
                </div>
                {/* Create button skeleton */}
                <SkeletonBlock className="w-full h-20 rounded-3xl" />
                {/* Switchboard skeleton */}
                <div>
                    <SkeletonBlock className="w-40 h-4 mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <SkeletonBlock key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <div className="glass-hero rounded-3xl p-8 flex flex-col items-center">
                    <SkeletonBlock className="w-24 h-4 mb-4" />
                    <SkeletonBlock className="w-40 h-16 mb-2" />
                    <SkeletonBlock className="w-20 h-3" />
                </div>
            </div>
        </div>
    );
}

export function HistorySkeleton() {
    return (
        <div className="relative">
            <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-white/5" />
            <div className="space-y-0">
                {[1, 2, 3].map(i => (
                    <div key={i} className="relative pl-14 md:pl-16 pb-8">
                        <div className="absolute left-2.5 md:left-4.5 top-4 z-10">
                            <SkeletonBlock className="w-3.5 h-3.5" rounded="rounded-full" />
                        </div>
                        <div className="glass-data rounded-2xl overflow-hidden max-w-3xl">
                            <div className="bg-white/[0.03] border-b border-white/[0.06] px-5 py-3 flex justify-between">
                                <div>
                                    <SkeletonBlock className="w-40 h-5 mb-2" />
                                    <SkeletonBlock className="w-24 h-3" />
                                </div>
                                <SkeletonBlock className="w-16 h-6" />
                            </div>
                            <div className="p-2 space-y-2">
                                {[1, 2].map(j => (
                                    <div key={j} className="flex items-center gap-3 p-3">
                                        <SkeletonBlock className="w-8 h-8" rounded="rounded-full" />
                                        <div className="flex-1">
                                            <SkeletonBlock className="w-28 h-4 mb-1.5" />
                                            <SkeletonBlock className="w-20 h-1" rounded="rounded-full" />
                                        </div>
                                        <SkeletonBlock className="w-12 h-5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AnalyticsSkeleton() {
    return (
        <div className="space-y-12">
            {/* Heatmap skeleton */}
            <div className="glass-data rounded-2xl p-6 w-full">
                <div className="flex items-center justify-between mb-6">
                    <SkeletonBlock className="w-36 h-5" />
                    <SkeletonBlock className="w-16 h-6" />
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <SkeletonBlock key={i} className="w-8 h-8" rounded="rounded-md" />
                    ))}
                </div>
            </div>
            {/* Stat cards skeleton */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-data rounded-2xl p-6">
                        <SkeletonBlock className="w-24 h-3 mb-4" />
                        <SkeletonBlock className="w-20 h-8" />
                    </div>
                ))}
            </div>
            {/* Report cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="glass-data rounded-3xl p-8">
                        <SkeletonBlock className="w-24 h-3 mb-6" />
                        <SkeletonBlock className="w-32 h-14 mb-8" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(j => (
                                <div key={j} className="flex justify-between">
                                    <SkeletonBlock className="w-24 h-3" />
                                    <SkeletonBlock className="w-12 h-3" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StreakSkeleton() {
    return (
        <div className="flex-1 flex flex-col md:ml-64 relative z-10 w-full min-h-screen">
            <div className="flex-1 pt-20 px-6 pb-24 md:pb-6 flex flex-col items-center justify-center text-center gap-8">
                <SkeletonBlock className="w-48 h-48" rounded="rounded-full" />
                <SkeletonBlock className="w-64 h-10" />
                <div className="glass-data rounded-2xl p-8 w-full max-w-md">
                    <div className="grid grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <SkeletonBlock className="w-16 h-8" />
                                <SkeletonBlock className="w-20 h-3" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="glass-hero rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8">
                <SkeletonBlock className="w-28 h-28 shrink-0" rounded="rounded-full" />
                <div className="flex-1 space-y-4">
                    <SkeletonBlock className="w-64 h-12" />
                    <SkeletonBlock className="w-32 h-6" />
                    <SkeletonBlock className="w-full h-4" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <SkeletonBlock key={i} className="h-40 rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <SkeletonBlock key={i} className="h-56 rounded-2xl" />
                ))}
            </div>
            <SkeletonBlock className="w-full h-80 rounded-2xl" />
        </div>
    );
}

export function ErrorDisplay({ message, onRetry }: { message: string, onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 glass-data rounded-3xl border border-red-500/10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin-slow" />
            </div>
            <div>
                <h3 className="text-xl font-bold uppercase tracking-widest text-red-500 mb-2">Sync Interrupted</h3>
                <p className="text-muted/60 text-sm uppercase tracking-widest max-w-xs mx-auto">{message}</p>
            </div>
            <button
                onClick={onRetry}
                className="px-8 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
                Retry Connection
            </button>
        </div>
    );
}
