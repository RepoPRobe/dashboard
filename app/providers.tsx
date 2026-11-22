'use client'

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ReactLenis } from "lenis/react";

function preventNestedScrollChaining(node: HTMLElement) {
    if (node === document.body || node === document.documentElement) return false;

    const style = window.getComputedStyle(node);
    const canScrollVertically = ["auto", "overlay", "scroll"].includes(style.overflowY) && node.scrollHeight > node.clientHeight;
    const canScrollHorizontally = ["auto", "overlay", "scroll"].includes(style.overflowX) && node.scrollWidth > node.clientWidth;

    if (!canScrollVertically && !canScrollHorizontally) return false;

    if (node.style.overscrollBehavior !== "contain") {
        node.style.overscrollBehavior = "contain";
    }

    return true;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ReactLenis
            root
            options={{
                anchors: true,
                lerp: 0.1,
                respectReducedMotion: true,
                smoothWheel: true,
                allowNestedScroll: true,
                prevent: preventNestedScrollChaining,
            }}
        >
            <SessionProvider>
                {children}
                <Toaster />
            </SessionProvider>
        </ReactLenis>
    );
}
