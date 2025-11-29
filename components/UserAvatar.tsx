'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type User = {
    id: string;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
};

// 后端接口：获取当前登录用户信息 GET /api/me
async function fetchCurrentUser(): Promise<User | null> {
    try {
        const res = await fetch('/api/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        return (data && (data.user || data)) as User;
    } catch (e) {
        console.error('fetchCurrentUser error', e);
        return null;
    }
}

export default function UserAvatar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const u = await fetchCurrentUser();
            if (!cancelled) {
                setUser(u);
                setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleClick = () => {
        router.push('/profile');
    };

    if (loading) {
        return <div className="h-8 w-8 rounded-full bg-zinc-200 animate-pulse" />;
    }

    const label = user?.name || user?.email || '访客';
    const initial = label.charAt(0).toUpperCase();

    return (
        <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-2 rounded-full px-2 py-1 hover:bg-zinc-100 transition-colors"
            title={user ? '查看个人资料' : '登录 / 注册'}
        >
            <div className="h-8 w-8 rounded-full bg-zinc-300 flex items-center justify-center overflow-hidden text-xs font-medium text-zinc-800">
                {user?.avatarUrl ? (
                    <Image
                        src={user.avatarUrl}
                        alt={label}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span>{initial}</span>
                )}
            </div>
            <span className="hidden sm:inline text-xs text-zinc-700">
                {user ? label : '登录'}
            </span>
        </button>
    );
}
