'use client';

import { useState } from 'react';

interface RiskModalProps {
    isOpen: boolean;
    onClose: () => void;
    riskData: {
        level: 'weak' | 'strong';
        signals: string[];
        cooldownSec: number;
    };
}

export default function RiskModal({ isOpen, onClose, riskData }: RiskModalProps) {
    if (!isOpen) return null;

    const isStrong = riskData.level === 'strong';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h2 className="text-lg font-semibold mb-4">
                    {isStrong ? '⚠️ 重要提醒' : '💙 关怀提醒'}
                </h2>
                
                <div className="mb-4">
                    {isStrong ? (
                        <div className="space-y-2">
                            <p>我注意到你可能正在经历困难。你的感受很重要，但请记住：</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>这些困难的感受是暂时的</li>
                                <li>寻求专业帮助是勇敢的选择</li>
                                <li>你不是一个人在面对这些</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p>我感受到你现在可能有些不容易。</p>
                            <p>记住给自己一些时间和空间，情绪会慢慢流动。</p>
                        </div>
                    )}
                </div>

                {isStrong && (
                    <div className="mb-4 p-3 bg-red-50 rounded">
                        <p className="text-sm font-medium">紧急求助资源：</p>
                        <p className="text-sm">全国心理危机干预热线：400-161-9995</p>
                        <p className="text-sm">北京危机干预热线：400-161-9995</p>
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        我知道了
                    </button>
                    {isStrong && (
                        <button
                            onClick={() => window.open('tel:400-161-9995')}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            拨打热线
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
