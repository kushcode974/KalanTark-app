'use client';

import { motion } from 'framer-motion';

// Stage configuration based on Sovereign Days
export const getFlameStage = (days: number) => {
    if (days === 0) return 0;
    if (days <= 3) return 1;
    if (days <= 10) return 2;
    if (days <= 20) return 3;
    if (days <= 30) return 4;
    if (days <= 50) return 5;
    if (days <= 99) return 6;
    return 7;
};

const STAGE_CONFIGS = {
    0: {
        height: 60, width: 40,
        coreColor: '#1e3a8a', outerColor: '#0f172a',
        glowOpacity: 0.1, duration: 4, sway: 5,
        scaleRange: [0.9, 1.05]
    },
    1: {
        height: 120, width: 60,
        coreColor: '#2563eb', outerColor: '#1e3a8a',
        glowOpacity: 0.3, duration: 3, sway: 8,
        scaleRange: [0.95, 1.1]
    },
    2: {
        height: 180, width: 80,
        coreColor: '#3b82f6', outerColor: '#1d4ed8',
        glowOpacity: 0.5, duration: 2.5, sway: 12,
        scaleRange: [0.95, 1.15]
    },
    3: {
        height: 250, width: 110,
        coreColor: '#60a5fa', outerColor: '#2563eb',
        glowOpacity: 0.7, duration: 2, sway: 15,
        scaleRange: [0.9, 1.15]
    },
    4: {
        height: 320, width: 140,
        coreColor: '#93c5fd', outerColor: '#1d4ed8',
        glowOpacity: 0.85, duration: 1.5, sway: 20,
        scaleRange: [0.9, 1.2]
    },
    5: {
        height: 400, width: 170,
        coreColor: '#bfdbfe', outerColor: '#2563eb',
        glowOpacity: 1, duration: 1.2, sway: 25,
        scaleRange: [0.85, 1.25]
    },
    6: {
        height: 500, width: 200,
        coreColor: '#eff6ff', outerColor: '#1e40af',
        glowOpacity: 1, duration: 0.9, sway: 35,
        scaleRange: [0.85, 1.3]
    },
    7: {
        height: 650, width: 250,
        coreColor: '#ffffff', outerColor: '#1e3a8a',
        glowOpacity: 1, duration: 0.7, sway: 45,
        scaleRange: [0.8, 1.4]
    }
};

export function LiveFlame({ days }: { days: number }) {
    const stage = getFlameStage(days);
    const config = STAGE_CONFIGS[stage as keyof typeof STAGE_CONFIGS];

    return (
        <div className="relative flex items-end justify-center h-[700px] w-full isolate pointer-events-none">
            {/* Ambient Background Glow */}
            <motion.div
                className="absolute bottom-10 rounded-full blur-[100px] -z-10 mix-blend-screen"
                animate={{
                    opacity: [config.glowOpacity * 0.8, config.glowOpacity, config.glowOpacity * 0.8],
                    scale: config.scaleRange,
                }}
                transition={{
                    duration: config.duration * 2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut"
                }}
                style={{
                    width: config.width * 2,
                    height: config.height,
                    backgroundColor: config.outerColor,
                }}
            />

            {/* SVG Gooey Filter definition (creates organic merging of shapes) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="gooey-flame">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -15" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <div
                className="relative flex items-end justify-center"
                style={{
                    width: config.width,
                    height: config.height,
                    filter: 'url(#gooey-flame)',
                }}
            >
                {/* Outer Base Fire */}
                <motion.div
                    className="absolute bottom-0 rounded-full mix-blend-screen"
                    animate={{
                        height: [config.height * 0.9, config.height * 1.05, config.height * 0.9],
                        width: [config.width, config.width * 1.1, config.width],
                        x: [-config.sway, config.sway, -config.sway],
                        borderRadius: ['40% 40% 60% 60%', '50% 50% 50% 50%', '40% 40% 60% 60%']
                    }}
                    transition={{
                        duration: config.duration,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut"
                    }}
                    style={{
                        backgroundColor: config.outerColor,
                        transformOrigin: 'bottom center',
                    }}
                />

                {/* Inner Core Fire */}
                <motion.div
                    className="absolute bottom-0 rounded-full mix-blend-screen"
                    animate={{
                        height: [config.height * 0.6, config.height * 0.75, config.height * 0.6],
                        width: [config.width * 0.6, config.width * 0.7, config.width * 0.6],
                        x: [-config.sway * 0.7, config.sway * 0.7, -config.sway * 0.7],
                        borderRadius: ['45% 45% 55% 55%', '50% 50% 50% 50%', '45% 45% 55% 55%']
                    }}
                    transition={{
                        duration: config.duration * 0.8,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                        delay: 0.1
                    }}
                    style={{
                        backgroundColor: config.coreColor,
                        transformOrigin: 'bottom center',
                    }}
                />

                {/* Heat Sparkle / Tongue */}
                {stage >= 2 && (
                    <motion.div
                        className="absolute bottom-10 rounded-full mix-blend-screen"
                        animate={{
                            height: [config.height * 0.4, config.height * 0.8, config.height * 0.4],
                            width: [config.width * 0.3, config.width * 0.2, config.width * 0.3],
                            y: [0, -config.height * 0.2, 0],
                            x: [config.sway, -config.sway, config.sway],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: config.duration * 0.6,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                        }}
                        style={{
                            backgroundColor: stage >= 5 ? '#ffffff' : config.coreColor,
                            transformOrigin: 'bottom center',
                        }}
                    />
                )}
            </div>

            {/* Ground / Base grounding overlay so the fire springs exactly from the bottom seamlessly */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-8 bg-background blur-md z-10" />
        </div>
    );
}
