'use client';

import { useEffect, useRef, useState } from 'react';
import { useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
    value: number;
    className?: string;
    duration?: number;
    formatter?: (v: number) => string;
}

const reduceMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export function AnimatedNumber({ value, className = '', duration = 800, formatter }: AnimatedNumberProps) {
    const spring = useSpring(0, { stiffness: 60, damping: 20 });
    const display = useTransform(spring, (v) => {
        const rounded = Math.round(v);
        return formatter ? formatter(rounded) : String(rounded);
    });
    const [displayValue, setDisplayValue] = useState(formatter ? formatter(value) : String(value));

    useEffect(() => {
        if (reduceMotion) {
            setDisplayValue(formatter ? formatter(value) : String(value));
            return;
        }
        spring.set(value);
    }, [spring, value, formatter]);

    useEffect(() => {
        if (reduceMotion) return;
        const unsubscribe = display.on('change', (v) => {
            setDisplayValue(v);
        });
        return unsubscribe;
    }, [display]);

    return (
        <motion.span className={className}>
            {displayValue}
        </motion.span>
    );
}
