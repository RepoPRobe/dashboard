"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

interface LoginButtonsProps {
  className?: string;
  compact?: boolean;
  onClick?: () => void;
  variant?: "button" | "link";
}

export default function LoginButtons({
  className = "",
  compact = false,
  onClick,
  variant = "button",
}: LoginButtonsProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonClassName =
    variant === "link"
      ? "inline-flex items-center rounded-md text-xs font-medium text-[#5145FF] transition-colors hover:text-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2"
      : `inline-flex ${compact ? "h-9 px-2.5" : "h-10 px-3"} items-center justify-center gap-2 rounded-lg border border-[#DCE4EF] bg-white text-xs font-medium text-[#344256] transition-colors hover:border-[#C4C5FF] hover:bg-[#F1F4F9] hover:text-[#5145FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2`;

  if (session?.user) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className={
            variant === "link"
              ? "inline-flex items-center gap-1.5 rounded-md"
              : `inline-flex ${compact ? "h-9 px-2" : "min-h-10 px-2.5 py-1"} items-center gap-1.5 rounded-lg border border-[#DCE4EF] bg-white shadow-sm shadow-slate-900/5 transition-colors hover:border-[#C4C5FF] hover:bg-[#F1F4F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2`
          }
        >
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className={`${compact ? "h-6 w-6" : "h-7 w-7"} rounded-full border border-[#DCE4EF] object-cover`}
            />
          )}
          <span className={`${compact ? "max-w-32" : "max-w-36"} truncate text-xs text-[#526581]`}>
            {session.user.login}
          </span>
          <ChevronDown
            aria-hidden="true"
            size={compact ? 14 : 16}
            className={`shrink-0 text-[#71829B] transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute left-1/2 z-50 mt-2 min-w-32 -translate-x-1/2 rounded-lg border border-[#DCE4EF] bg-white p-1 shadow-lg shadow-slate-900/10"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onClick?.();
                void signOut({ callbackUrl: "/" });
              }}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-[#344256] transition-colors hover:bg-[#F1F4F9] hover:text-[#5145FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF]"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        void signIn("github", { callbackUrl: "/dashboard" });
      }}
      className={`${buttonClassName} ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} fill-current`}>
        <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.12-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.03.75 2.08V22c0 .29.2.64.77.53A11.1 11.1 0 0 0 12 .9Z" />
      </svg>
      Log in with GitHub
    </button>
  );
}
