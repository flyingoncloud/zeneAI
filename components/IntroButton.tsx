"use client";
import { useState } from "react";
import IntroModal from "./IntroModal";

export default function IntroButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
                使用说明
            </button>
            <IntroModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
