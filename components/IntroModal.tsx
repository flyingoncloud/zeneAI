"use client";
import { useEffect } from "react";

type IntroModalProps = { open: boolean; onClose: () => void };

export default function IntroModal({ open, onClose }: IntroModalProps) {
    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onEsc);
        // 打开时禁止背景滚动
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onEsc);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-black/40" />

            {/* 弹窗体：90vh高，头/身/尾三段，正文可滚动 */}
            <div
                className="relative mx-3 w-full max-w-3xl h-[90vh] rounded-2xl bg-white shadow-xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部（固定） */}
                <div className="flex items-center justify-between border-b p-4 rounded-t-2xl">
                    <h2 className="text-xl font-semibold">Step 0 · 介绍</h2>
                    <button
                        onClick={onClose}
                        aria-label="关闭"
                        className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {/* 正文（滚动区） */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* —— 第一屏（1-7/8） —— */}
                    <div className="rounded-2xl border p-4 text-gray-700">
                        <div className="space-y-3 md:space-y-4 leading-relaxed">
                            <p>
                                你好，欢迎来到 <b>内视涂鸦</b>。这里，你将通过绘画或一些小问题来探索自己的内心。
                            </p>

                            <p>
                                在这里，你可以安心地做自己。你所展现的任何情绪都没有对错，它们都是真实的、值得被看见的部分。
                            </p>

                            <p>
                                在我们开始之前，先和你介绍两个简单的概念：每个人心里都会有一些不同的小声音或小角色，
                                它们代表着各种情绪，比如担心的、愤怒的、想被理解的——我们把它们叫做<strong>小我</strong>。
                            </p>

                            <p>
                                同时，在你的心里还有一个智慧、有力量、有爱的自己，它懂得如何照顾你，也能带来力量和平静感——
                                我们把它叫做<strong>真我</strong>。
                            </p>

                            <p>
                                在练习中，我们会一点点认识这些小我，然后慢慢靠近你的真我。当你看见并理解这些情绪，它们的重量会变轻，
                                你也能更清楚地感受到自己真正的需要。重要的是，无论最终是否找到真我，每一个情绪的出现本身都很有价值，
                                它们都能帮助你更好地了解自己。
                            </p>

                            <p>
                                需要说明的是，这不是一个用来测试 AI 准确度的游戏。AI 在这里的角色更像是一面镜子，帮你整理思路，
                                引导你看见自己的情绪。当你看见情绪，你已经在情绪之外，更加靠近真我和你想要的答案。
                            </p>

                            <p>所以，无论你是否找到最后的真我，你都能在过程中收获：</p>
                            <ol className="list-decimal pl-6 space-y-1">
                                <li>看见并表达真实情绪本身，就是一种成长；</li>
                                <li>情绪像信使一样向你传递信息，通过认识情绪了解自己；</li>
                                <li>了解情绪出现时自己的解释、身体感受和行为冲动，便于及时觉察和预防因情绪引发的冲突；</li>
                                <li>获得一份属于你自己的小报告，帮助你更好地理解自己的思维与行为模式。</li>
                            </ol>

                            <p>
                                在开始之前，请选择一个让自己感到安全和舒适的方式坐下来，任何时候你感到不舒服都可以随时停下来。
                            </p>

                            <p>
                                请放心，即使你觉得自己不擅长画画，也完全没关系。这里的涂鸦是帮助你表达情绪。哪怕是随手涂几笔，也同样有价值。
                            </p>
                        </div>
                    </div>


                    <div className="my-5 h-px bg-gray-200" />

                    {/* —— 最后一屏（8/8） —— */}
                    <h3 className="text-lg font-semibold mb-3">准备好就开始吧</h3>
                    <p className="mb-4 text-gray-700">进入练习后，你可以自由选择以下方式：</p>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border p-4">
                            <div className="font-medium">上传</div>
                            <div className="text-gray-600">从本地相册/文件中选择一张图片上传到网站。</div>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <div className="font-medium">拍照</div>
                            <div className="text-gray-600">打开摄像头现场拍摄一张照片并使用（需要授权摄像头权限）。</div>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <div className="font-medium">画板</div>
                            <div className="text-gray-600">在画布上自由涂鸦、写字或画图。</div>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <div className="font-medium">图库</div>
                            <div className="text-gray-600">从系统提供的题图中挑选一张贴近你当下感受的图片。</div>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <div className="font-medium">文字</div>
                            <div className="text-gray-600">直接用文字描述你的想法或感受。</div>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <div className="font-medium">语音</div>
                            <div className="text-gray-600">按下麦克风说出你的想法，我们会将语音转为文字后进入对话。</div>
                        </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-500">
                        提示：拍照需浏览器/系统授权摄像头。
                    </div>
                </div>

                {/* 底部（固定） */}
                <div className="flex items-center justify-between gap-3 border-t p-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
                    >
                        进入练习
                    </button>
                </div>
            </div>
        </div>
    );
}
