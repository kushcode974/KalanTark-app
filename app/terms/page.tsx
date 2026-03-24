import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions | KalanTark',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#021024] text-white p-6 md:p-12 font-sans selection:bg-[#4a9eff]/30 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4a9eff]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2F80ED]/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#4a9eff] hover:text-white transition-colors text-[11px] font-bold tracking-[0.2em] uppercase">
                        <ArrowLeft size={16} /> Return to App
                    </Link>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#4a9eff]">
                    Terms & Conditions
                </h1>

                <div className="space-y-6 pb-24">
                    
                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Acceptance of Terms</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            By accessing or using KalanTark, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, you may not access the sovereign time engine.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Description of Service</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            KalanTark is a personal sovereign time economy system. It provides tools for cycle tracking, time declaration, and personal accountability. It does not guarantee productivity outcomes or behavioral changes. The engine operates purely on the intentions you declare.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">User Accounts</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            You must provide a valid email and secure password to initiate a node. Users are entirely responsible for maintaining the confidentiality of their credentials and for all activities that occur under their account. KalanTark is not liable for unauthorized access resulting from user negligence.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Acceptable Use</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            You agree not to use KalanTark for any unlawful purpose. You may not hack, scrape, reverse engineer, or attempt to disrupt the integrity of the KalanTark systems, servers, or networks. Any automated interaction with the platform without explicit permission is strictly prohibited.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Intellectual Property</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            KalanTark, the KalanSutras philosophy, the milestone system, mathematical time logic, and all associated designs, interfaces, and textual content are the exclusive intellectual property of KalanTark. Unauthorized reproduction, modification, or distribution is strictly prohibited.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Data Collection</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            We collect basic identity elements (email, username) and functional session matrix data (time records) solely to operate and improve the service. We categorically do not sell, rent, or lease user data to third parties. For full details, see our Privacy Policy.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Termination</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            KalanTark reserves the right to suspend or eradicate user accounts at our sole discretion, without notice, for conduct that violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Limitation of Liability</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            The service is provided on an "AS IS" and "AS AVAILABLE" basis. KalanTark makes no warranties of any kind. To the fullest extent permitted by law, we disclaim all liability for any direct, indirect, incidental, or consequential damages, including data loss, server interruptions, or synchronization failures.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Governing Law</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute arising under these Terms shall be resolved exclusively in the jurisdictions located within India.
                        </p>
                    </section>

                    <section className="bg-[#052659] border border-[rgba(74,158,255,0.1)] rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold uppercase tracking-[0.15em] text-[#4a9eff] mb-4">Changes to Terms</h2>
                        <p className="text-white/80 text-base leading-[1.8]">
                            We reserve the right to update or modify these Terms at any time without prior notice. The updated version will be indicated by an "Effective Date" at the top of this page. Your continued use of KalanTark after any changes constitutes your binding acceptance of the new Terms.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
