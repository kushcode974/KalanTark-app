import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
    title: 'KalanTark | Sovereign Time Control',
    description: 'The founding architecture for personal time autonomy and intentional rendering.',
}

import { Toaster } from 'react-hot-toast'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
            <head>
                <meta name="application-name" content="KalanTark" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="KalanTark" />
                <meta name="theme-color" content="#021024" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="antialiased min-h-screen text-foreground bg-background font-sans selection:bg-accent-blue/30 selection:text-white flex flex-col">
                <Script id="register-sw" strategy="afterInteractive">
                    {`
                    if ('serviceWorker' in navigator) {
                        window.addEventListener('load', () => {
                        navigator.serviceWorker.register('/sw.js')
                            .then(reg => console.log('SW registered'))
                            .catch(err => console.log('SW registration failed'));
                        });
                    }
                    `}
                </Script>
                <div className="flex-1 flex flex-col relative w-full">
                    {children}
                </div>
                <footer className="w-full py-4 text-center z-[100] relative">
                    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-widest text-muted/50">
                        <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    </div>
                </footer>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#052659',
                            color: '#C1E8FF',
                            border: '1px solid #1a2744',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'var(--font-inter)',
                            backdropFilter: 'blur(12px)',
                        },
                        success: {
                            iconTheme: { primary: '#22c55e', secondary: '#052659' }
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#052659' }
                        }
                    }}
                />
            </body>
        </html>
    )
}
