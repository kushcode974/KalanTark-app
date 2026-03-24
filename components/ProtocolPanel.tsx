import { useState } from 'react';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '@/lib/api';
import toast from 'react-hot-toast';
import { Target, Zap, LayoutGrid, X, Plus } from 'lucide-react';

type CategoryType = 'primary' | 'essential' | 'scattered';

export function ProtocolPanel({
    onClose,
    onEntryCreated
}: {
    onClose: () => void;
    onEntryCreated: () => void;
}) {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('💻');
    const [activeCol, setActiveCol] = useState<CategoryType>('primary');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent, categoryType: CategoryType, color: string) => {
        e.preventDefault();
        if (!name.trim() || !emoji.trim()) return;

        setIsSubmitting(true);
        const res = await fetchWithAuth('/api/categories', {
            method: 'POST',
            body: JSON.stringify({
                name,
                emoji,
                color,
                category_type: categoryType
            })
        });

        setIsSubmitting(false);

        if (res.ok) {
            toast.success("Section created");
            setName('');
            setEmoji('💻');
            onEntryCreated();
            onClose();
        } else {
            toast.error("Failed to create section");
        }
    };

    const columns = [
        { id: 'primary', label: 'Primary', icon: Target, color: 'text-accent-blue', border: 'border-accent-blue/30', bg: 'bg-accent-blue/5' },
        { id: 'essential', label: 'Essential', icon: Zap, color: 'text-accent-green', border: 'border-accent-green/30', bg: 'bg-accent-green/5' },
        { id: 'scattered', label: 'Scattered', icon: LayoutGrid, color: 'text-muted', border: 'border-border', bg: 'bg-surface' },
    ] as const;

    return (
        <div className="bg-surface border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-widest uppercase">Create KT Section</h2>
                </div>
                <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {columns.map((col) => {
                    const isActive = activeCol === col.id;
                    const Icon = col.icon;

                    return (
                        <div key={col.id} className={`flex flex-col rounded-2xl border transition-all duration-300 ${isActive ? `border-${col.color.split('-')[1]}` : 'border-border'} ${col.bg} p-5 relative overflow-hidden group`}>
                            {/* Column Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <Icon className={`${col.color}`} size={20} />
                                <h3 className={`uppercase tracking-widest font-bold text-sm ${col.color}`}>{col.label}</h3>
                            </div>

                            {/* Create Form */}
                            <form
                                onSubmit={(e) => handleSubmit(e, col.id as CategoryType, col.color)}
                                className="flex flex-col gap-3 flex-1"
                                onClick={() => setActiveCol(col.id as CategoryType)}
                            >
                                <input
                                    type="text"
                                    placeholder={`${col.label} Section Name...`}
                                    value={isActive ? name : ''}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-background border border-border px-4 py-3 rounded-xl focus:border-accent-blue outline-none transition-colors text-sm w-full"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Emoji"
                                        value={isActive ? emoji : ''}
                                        onChange={(e) => setEmoji(e.target.value)}
                                        disabled={isSubmitting}
                                        maxLength={2}
                                        className="bg-background border border-border px-4 py-3 rounded-xl focus:border-accent-blue outline-none transition-colors text-center text-xl w-16"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !isActive || !name}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${isActive ? 'bg-background hover:bg-white/5 border-border hover:border-white/20 text-white' : 'bg-background/50 text-muted border-transparent'}`}
                                    >
                                        <Plus size={16} /> Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
