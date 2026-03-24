'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function LiveFlame({ days }: { days: number }) {
    // 7 Stages logic
    const getStageConfig = (d: number) => {
        if (d <= 3) return { stage: 1, size: 25, stretch: 1.2, core: '#1e3a8a', main: '#020617', glow: '#020617', speed: 3.5, sway: 1 };
        if (d <= 10) return { stage: 2, size: 40, stretch: 1.5, core: '#3b82f6', main: '#1e3a8a', glow: '#0f172a', speed: 2.8, sway: 2 };
        if (d <= 20) return { stage: 3, size: 60, stretch: 1.8, core: '#60a5fa', main: '#2563eb', glow: '#1e3a8a', speed: 2.3, sway: 4 };
        if (d <= 30) return { stage: 4, size: 85, stretch: 2.2, core: '#93c5fd', main: '#3b82f6', glow: '#1d4ed8', speed: 1.8, sway: 6 };
        if (d <= 50) return { stage: 5, size: 120, stretch: 2.5, core: '#eff6ff', main: '#2563eb', glow: '#2563eb', speed: 1.5, sway: 8 };
        if (d <= 99) return { stage: 6, size: 160, stretch: 2.8, core: '#ffffff', main: '#3b82f6', glow: '#1d4ed8', speed: 1.2, sway: 11 };
        return { stage: 7, size: 220, stretch: 3.1, core: '#ffffff', main: '#60a5fa', glow: '#2563eb', speed: 0.9, sway: 15 };
    };

    const config = getStageConfig(days);
    const isZero = days === 0;

    // Apply special zero state
    if (isZero) {
        config.size = 15;
        config.stretch = 1.0;
        config.core = '#0f172a';
        config.main = '#020617';
        config.glow = '#000000';
        config.speed = 5.0;
        config.sway = 0.5;
    }

    const containerHeight = config.size * config.stretch * 1.5;
    const containerWidth = config.size * 2.5;

    return (
        <div className="relative flex justify-center items-end" style={{ width: containerWidth, height: containerHeight }}>
            {/* Ambient Glow */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                animate={{
                    opacity: config.stage === 1 || isZero ? [0.1, 0.2, 0.1] : [0.4, 0.6, 0.4],
                    scale: [1, 1.05, 1],
                }}
                transition={{ duration: config.speed * 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: config.size * 2.5,
                    height: config.size * config.stretch * 2,
                    bottom: '-10%',
                    background: `radial-gradient(ellipse, ${config.glow} 0%, transparent 60%)`,
                    filter: 'blur(30px)',
                    zIndex: 0,
                    transition: 'all 2s ease-in-out'
                }}
            />

            {/* Main Swaying Container */}
            <motion.div
                className="relative z-10 flex justify-center items-end origin-bottom"
                animate={{
                    rotate: [-config.sway, config.sway, -config.sway],
                }}
                transition={{ duration: config.speed, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transition: 'all 2s ease-in-out' }}
            >
                {/* Vertical Stretch Container */}
                <div style={{ transform: `scaleY(${config.stretch})`, transformOrigin: 'bottom center', transition: 'all 2s ease-in-out', display: 'flex', justifyItems: 'center', alignItems: 'flex-end', position: 'relative' }}>

                    {/* Outer Flame / Base */}
                    <motion.div
                        className="mix-blend-screen origin-bottom absolute bottom-0"
                        animate={{
                            scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{ duration: config.speed * 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        style={{
                            width: config.size,
                            height: config.size,
                            background: config.main,
                            borderRadius: '50% 0 50% 50%',
                            transform: 'rotate(-45deg)',
                            filter: `blur(${config.size * 0.15}px)`,
                            boxShadow: `0 0 ${config.size * 0.5}px ${config.main}`,
                            transition: 'all 2s ease-in-out',
                            left: '50%',
                            marginLeft: -(config.size / 2)
                        }}
                    />

                    {/* Inner Flame Core */}
                    <motion.div
                        className="mix-blend-screen origin-bottom absolute"
                        animate={{
                            scale: [0.9, 1.1, 0.9],
                        }}
                        transition={{ duration: config.speed * 0.6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: config.size * 0.55,
                            height: config.size * 0.55,
                            bottom: '5%',
                            background: config.core,
                            borderRadius: '50% 0 50% 50%',
                            transform: 'rotate(-45deg)',
                            filter: `blur(${config.size * 0.08}px)`,
                            transition: 'all 2s ease-in-out',
                            left: '50%',
                            marginLeft: -(config.size * 0.55 / 2)
                        }}
                    />

                    {/* Hot White Heart (Stages 3+) */}
                    {config.stage >= 3 && !isZero && (
                        <motion.div
                            className="mix-blend-screen origin-bottom absolute"
                            animate={{
                                scale: [0.8, 1.2, 0.8],
                                opacity: config.stage === 3 ? [0.4, 0.6, 0.4] : [0.8, 1, 0.8]
                            }}
                            transition={{ duration: config.speed * 0.4, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                            style={{
                                width: config.size * 0.25,
                                height: config.size * 0.25,
                                bottom: '10%',
                                background: '#ffffff',
                                borderRadius: '50% 0 50% 50%',
                                transform: 'rotate(-45deg)',
                                filter: `blur(${config.size * 0.04}px)`,
                                transition: 'all 2s ease-in-out',
                                left: '50%',
                                marginLeft: -(config.size * 0.25 / 2)
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
