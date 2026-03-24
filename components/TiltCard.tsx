'use client';

import { useRef, useState, useEffect } from 'react';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    tiltEnabled?: boolean;
}

export function TiltCard({ children, className = '', style = {}, tiltEnabled = true }: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tiltStyle, setTiltStyle] = useState({});
    const [shineStyle, setShineStyle] = useState({ opacity: 0, x: 0, y: 0 });

    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!tiltEnabled || reduceMotion || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // max ±10deg
        const rotateY = ((x - centerX) / centerX) * 10;  // max ±10deg

        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: 'transform 0.1s ease',
        });

        setShineStyle({
            opacity: 1,
            x: x,
            y: y,
        });
    };

    const handleMouseLeave = () => {
        if (!tiltEnabled || reduceMotion) return;

        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
            transition: 'transform 0.5s ease-out',
        });

        setShineStyle(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <div
            ref={cardRef}
            className={`relative overflow-hidden ${className}`}
            style={{ ...style, ...tiltStyle, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {/* Shine Overlay */}
            {!reduceMotion && tiltEnabled && (
                <div
                    className="pointer-events-none absolute inset-0 z-50 transition-opacity duration-300"
                    style={{
                        opacity: shineStyle.opacity,
                        background: `radial-gradient(circle 150px at ${shineStyle.x}px ${shineStyle.y}px, rgba(193,232,255,0.08), transparent)`,
                    }}
                />
            )}
        </div>
    );
}
