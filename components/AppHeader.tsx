"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LoginButtons from "@/components/LoginButtons";

interface AppHeaderProps {
  installationId?: string;
}

export default function AppHeader({ installationId }: AppHeaderProps) {
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6 sm:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-1.5">
          <Image
            src="/repoprobe-logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 scale-90 rounded-md object-contain"
          />
          <span className="text-base font-semibold tracking-tight text-slate-900">
            Repo<span className="text-indigo-600">PRobe</span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {status === "authenticated" && (
            <Link
              href="/dashboard"
              className="rounded-md px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 sm:px-3"
            >
              Dashboard
            </Link>
          )}
          {installationId && (
            <Link
              href={`/installation/${installationId}`}
              className="hidden rounded-md px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 sm:inline-flex sm:px-3"
            >
              Installation
            </Link>
          )}
          <LoginButtons compact />
        </div>
      </nav>
    </header>
  );
}
