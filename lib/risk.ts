// lib/risk.ts
export type RiskSignal = 'body' | 'emotion' | 'cognition' | 'behavior' | 'language';
export type RiskLevel = 'weak' | 'strong';

export interface RiskCheckRequest {
    sessionId?: string;
    source: 'chat' | 'sketch' | 'choice' | 'system';
    text?: string;
    imageSummary?: string; // 先传占位摘要，后端按需扩展
    step?: string;         // 例如 '2.2'
    path?: string;         // 例如 '/flow'
}

export interface RiskCheckResponse {
    triggered: boolean;
    level?: RiskLevel;
    signals?: RiskSignal[];
    reasons?: { snippet: string; label: string }[];
    confidence?: number;
    actions?: ('ground' | 'breathing' | 'contact' | 'continue')[];
    cooldownSec?: number; // 前端在这段时间内忽略新的触发
}

export const RISK_KEYS = {
    events: 'zene_risk_events',
    last: 'zene_risk_last',
    disabled: 'zene_risk_disabled',
};

// 简单防抖
export function debounce<T extends (...a: any) => any>(fn: T, wait: number) {
    let t: any; return (...args: Parameters<T>) => {
        clearTimeout(t); t = setTimeout(() => fn(...args), wait);
    };
}
