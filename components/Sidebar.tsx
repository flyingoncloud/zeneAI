// components/Sidebar.tsx
export default function Sidebar({ items }: { items: Array<{ type: 'part' | 'self', label: string }> }) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">实时记录</h2>
            <ul className="space-y-2 text-sm">
                {items.length === 0 && <li className="text-zinc-500">暂时没有记录</li>}
                {items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <span className={`inline-flex h-2 w-2 rounded-full ${it.type === 'self' ? 'bg-emerald-600' : 'bg-sky-600'}`} />
                        <span className="font-medium">{it.type === 'self' ? 'Self' : 'Part'}</span>
                        <span className="text-zinc-600">· {it.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
