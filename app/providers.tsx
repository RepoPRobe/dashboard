'use client'

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ReactLenis } from "lenis/react";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ReactLenis
            root
            options={{
                anchors: true,
                lerp: 0.1,
                respectReducedMotion: true,
                smoothWheel: true,
            }}
        >
            <SessionProvider>
                {children}
                <Toaster />
            </SessionProvider>
        </ReactLenis>
    );
}
