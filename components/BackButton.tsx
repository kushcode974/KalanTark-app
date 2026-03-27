'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
    const router = useRouter();
    
    return (
        <button 
            type="button"
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 text-[#4a9eff] hover:text-white transition-colors text-[11px] font-bold tracking-[0.2em] uppercase bg-transparent border-none cursor-pointer p-0"
        >
            <ArrowLeft size={16} /> Return to App
        </button>
    );
}
