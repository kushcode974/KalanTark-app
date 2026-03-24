import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

type Category = { id: string; name: string; emoji: string; color: string; is_default: boolean };

export function SwitcherModal({
    isOpen,
    onClose,
    categories,
    activeCategoryId,
    onSwitch,
    onCategoriesUpdated
}: {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    activeCategoryId?: string;
    onSwitch: (id: string) => void;
    onCategoriesUpdated: () => void;
}) {
    const defaultCategories = categories.filter(c => c.is_default);
    const userCategories = categories.filter(c => !c.is_default);

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('⚡');
    const [newColor, setNewColor] = useState('#2F80ED');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetchWithAuth('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name: newName, emoji: newEmoji, color: newColor, is_default: false })
        });
        if (res.ok) {
            setIsCreating(false);
            setNewName('');
            onCategoriesUpdated();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-3xl shadow-2xl p-8"
                    >
                        <button onClick={onClose} className="absolute top-6 right-6 text-muted hover:text-white transition-colors">
                            <X size={24} />
                        </button>

                        <h2 className="text-3xl font-bold tracking-tight mb-8">INITIATE SWITCH</h2>

                        {isCreating ? (
                            <form onSubmit={handleCreate} className="bg-background p-6 rounded-2xl border border-border mb-8">
                                <h3 className="text-xl font-semibold mb-4 text-accent-blue">Configure New Protocol</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <input
                                        type="text" placeholder="Protocol Name" required
                                        value={newName} onChange={(e) => setNewName(e.target.value)}
                                        className="bg-surface border border-border p-3 rounded-lg text-foreground focus:border-accent-blue outline-none"
                                    />
                                    <input
                                        type="text" placeholder="Emoji (e.g. ⚡)" maxLength={2} required
                                        value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)}
                                        className="bg-surface border border-border p-3 rounded-lg text-foreground focus:border-accent-blue outline-none text-center"
                                    />
                                    <input
                                        type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                                        className="w-full h-full min-h-[50px] bg-surface border border-border p-1 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <div className="mt-6 flex gap-4">
                                    <button type="submit" className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-sm transition-colors">
                                        Deploy Protocol
                                    </button>
                                    <button type="button" onClick={() => setIsCreating(false)} className="text-muted hover:text-white px-4">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full border border-dashed border-border hover:border-accent-blue hover:text-accent-blue text-muted rounded-2xl py-6 mb-8 flex items-center justify-center gap-3 transition-colors uppercase tracking-widest font-bold text-sm"
                            >
                                <Plus size={20} /> Create New KT Section
                            </button>
                        )}

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs text-muted uppercase tracking-[0.2em] font-bold mb-4">Core Protocols (Default)</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {defaultCategories.map(cat => (
                                        <CategoryButton
                                            key={cat.id} cat={cat}
                                            isActive={activeCategoryId === cat.id}
                                            onClick={() => { onSwitch(cat.id); onClose(); }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {userCategories.length > 0 && (
                                <div>
                                    <h3 className="text-xs text-muted uppercase tracking-[0.2em] font-bold mb-4">User Directives</h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {userCategories.map(cat => (
                                            <CategoryButton
                                                key={cat.id} cat={cat}
                                                isActive={activeCategoryId === cat.id}
                                                onClick={() => { onSwitch(cat.id); onClose(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function CategoryButton({ cat, isActive, onClick }: { cat: Category, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 w-full
                ${isActive ? 'bg-background border-accent-blue shadow-glow-blue' : 'bg-background hover:border-gray-500'}
            `}
        >
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.emoji}</span>
            <span className="font-bold tracking-wide uppercase text-sm" style={{ color: isActive ? cat.color : '#FFF' }}>
                {cat.name}
            </span>
        </button>
    )
}
