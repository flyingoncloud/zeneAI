import { useState } from 'react';

export function useRiskGuard({ step, path }: { step: string; path: string }) {
    const [modal, setModal] = useState<any>(null);

    const checkText = async (text: string) => {
        // This will be handled by the ChatBox component now
        return { triggered: false };
    };

    const checkImageSummary = async (summary: string) => {
        // This will be handled by the ChatBox component now
        return { triggered: false };
    };

    return {
        modal,
        setModal,
        checkText,
        checkImageSummary,
    };
}
