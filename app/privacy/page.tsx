import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | KalanTark',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#021024] text-white p-6 md:p-12 font-sans selection:bg-[#4a9eff]/30 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#4a9eff]/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#2F80ED]/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#4a9eff] hover:text-white transition-colors text-[11px] font-bold tracking-[0.2em] uppercase">
                        <ArrowLeft size={16} /> Return to App
                    </Link>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#4a9eff]">
                    Privacy Policy
                </h1>

                <div className="space-y-6 pb-24">
                    
                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Data We Collect</h2>
                        <p className="text-white/80 text-base leading-[1.8] mb-3">
                            To operate the KalanTark engine, we collect the following minimal data elements:
                        </p>
                        <ul className="list-disc list-inside text-white/80 text-base leading-[1.8] space-y-1 ml-2">
                            <li>Identity credentials: Email and Username.</li>
                            <li>Security tokens: Password (which is heavily bcrypt-hashed; we never store or see your plain text password).</li>
                            <li>Sovereign Session Data: Switch sections, start/end timestamps, duration calculations, and category classifications.</li>
                        </ul>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Why We Collect It</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            Data is collected exclusively to authorize your node connection, persist your session matrix, render your sovereign timeline, and personalize your dashboard analytics. There is no hidden motive or secondary use case.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">How We Store It</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            Your data matrix is securely housed in Neon PostgreSQL infrastructure hosted on AWS. All transmission between your client and our servers is encrypted via HTTPS. Passwords are cryptographically hashed upon creation. 
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">How Long We Keep It</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            We maintain your temporal records indefinitely while your account remains active. Should you initiate the Eradication Protocol (account deletion), all associated personal data and tracking records will be permanently expunged from primary databases within 30 days.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Who We Share With</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            <strong>Nobody.</strong> We do not sell, rent, or trade your data. We rely on foundational infrastructure providers (such as Neon and Vercel) strictly to provide computing and database resources. They act as data processors and do not utilize your data for their own purposes.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Your Rights under DPDP Act 2023</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            In compliance with the Digital Personal Data Protection Act of 2023, you hold the right to access the data we have recorded, correct any inaccuracies, request absolute erasure of your data, or withdraw your consent for future processing through the control center.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Cookies</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            We employ only essential cookies necessary for system authentication (such as secure JWT session tokens). We proudly deploy exactly <strong>zero</strong> advertising, tracking, or cross-site surveillance cookies.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Contact</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            For all queries regarding your data matrix or privacy compliance, transmit your request to: <br/>
                            <a href="mailto:kalantark.offical@gmail.com" className="text-[#4a9eff] hover:underline mt-2 inline-block font-mono text-sm">kalantark.offical@gmail.com</a>
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
