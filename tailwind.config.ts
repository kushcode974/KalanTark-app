import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            colors: {
                background: "#050810",
                surface: "rgba(255, 255, 255, 0.025)",
                border: "rgba(255, 255, 255, 0.07)",
                foreground: "#FFFFFF",
                muted: "#8892B0",
                accent: {
                    blue: "#2F80ED",
                    gold: "#F2C94C",
                    green: "#4ADE80",
                    red: "#F87171",
                    teal: "#14B8A6",
                    purple: "#8B5CF6",
                    amber: "#F59E0B",
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'monospace'],
            },
            boxShadow: {
                'glow-blue': '0 0 30px rgba(47, 128, 237, 0.15), 0 0 60px rgba(47, 128, 237, 0.05)',
                'glow-green': '0 0 30px rgba(74, 222, 128, 0.15), 0 0 60px rgba(74, 222, 128, 0.05)',
                'glow-gold': '0 0 30px rgba(242, 201, 76, 0.15), 0 0 60px rgba(242, 201, 76, 0.05)',
                'glow-purple': '0 0 30px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05)',
                'glow-teal': '0 0 30px rgba(20, 184, 166, 0.15), 0 0 60px rgba(20, 184, 166, 0.05)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'radar': 'radar 3s ease-out infinite',
                'draw-ring': 'drawRing 1s ease-out forwards',
                'count-up': 'countUp 0.8s ease-out',
                'fade-up': 'fadeUp 0.5s ease-out',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                radar: {
                    '0%': { transform: 'scale(0.8)', opacity: '0.6' },
                    '100%': { transform: 'scale(2)', opacity: '0' },
                },
                drawRing: {
                    '0%': { strokeDashoffset: '440' },
                    '100%': { strokeDashoffset: '0' },
                },
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glowPulse: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                },
            },
        },
    },
    plugins: [],
};
export default config;
