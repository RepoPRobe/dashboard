
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LoginButtons from "@/components/LoginButtons";
import BrandName from "@/components/BrandName";
import {
  Activity,
  Eye,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Maximize2,
  Menu,
  Minimize2,
  Pause,
  Play,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: GitPullRequest,
    title: "Detect overlapping changes",
    description:
      "Identify pull requests modifying overlapping files and code regions before those changes collide during integration.",
  },
  {
    icon: Eye,
    title: "Understand conflicts in context",
    description:
      "Compare affected code regions side by side and see exactly where pull requests overlap.",
  },
  {
    icon: Zap,
    title: "Automate conflict checks",
    description:
      "Track pull requests and run conflict checks through GitHub events instead of manually comparing branches.",
  },
  {
    icon: ShieldCheck,
    title: "Keep your existing workflow",
    description:
      "Review findings in your dashboard and receive GitHub comments without leaving your code review process.",
  },
];

const GITHUB_APP_URL = 'https://github.com/apps/repoprobe';

const workflowSteps = [
  {
    number: "01",
    title: "Connect your repositories",
    description: (
      <>
        Install the GitHub App and select the repositories you want RepoPRobe to monitor.
      </>
    ),
    icon: GitBranch,
  },
  {
    number: "02",
    title: "Track pull requests",
    description:
      "Choose the pull requests you want to monitor for overlapping changes.",
    icon: GitPullRequest,
  },
  {
    number: "03",
    title: "Review potential conflicts",
    description:
      "Inspect affected files and code regions, then resolve concerns before merging.",
    icon: GitMerge,
  },
];

const demoBites = [
  {
    title: "Explore RepoPRobe commands",
    description:
      "Discover how to use RepoPRobe commands to check conflicts and manage pull requests directly from GitHub.",
    video: "RepoProbe Help Command Byte",
    icon: Activity,
  },
  {
    title: "Detect overlapping changes",
    description:
      "See how RepoPRobe processes pull requests, detects overlapping changes, and visualizes potential conflicts.",
    video: "RepoProbe PR Processing Byte",
    icon: GitMerge,
  },
  {
    title: "Track pull requests",
    description:
      "Learn how to track existing pull requests and trigger conflict detection from GitHub or the dashboard.",
    video: "RepoProbe PR Tracking Byte",
    icon: GitPullRequest,
  },
  {
    title: "Inherit GitHub permissions",
    description:
      "See how RepoPRobe automatically respects GitHub repository permissions without requiring separate access management.",
    video: "RepoProbe Permissions Byte",
    icon: ShieldCheck,
  },
];

function DemoPlayer({
  video,
  title,
  label,
}: {
  video: string;
  title: string;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isExpanded && !dialog.open) dialog.showModal();
    if (!isExpanded && dialog.open) dialog.close();
  }, [isExpanded]);

  return (
    <dialog
      ref={dialogRef}
      className={
        isExpanded
          ? "fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center overflow-hidden border-0 bg-black/85 p-4 text-white backdrop:bg-black/85"
          : "relative m-0 block aspect-video w-full max-w-none overflow-hidden border-0 bg-[#0E1428] p-0 text-white"
      }
      aria-label={isExpanded ? `${label} expanded player` : undefined}
      onClose={() => {
        videoRef.current?.pause();
        setHasStarted(false);
        setIsPlaying(false);
        setIsExpanded(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setIsExpanded(false);
      }}
    >
      <div
        className={`group relative aspect-video overflow-hidden bg-[#0E1428] ${
          isExpanded
            ? "rounded-xl border border-white/15 shadow-2xl"
            : "h-full w-full"
        }`}
        style={
          isExpanded
            ? {
                width:
                  "min(72rem, calc((100dvh - 2rem) * 16 / 9), calc(100vw - 2rem))",
              }
            : undefined
        }
      >
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          preload="metadata"
          aria-label={label}
          onPlay={() => {
            setHasStarted(true);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setHasStarted(false);
            setIsPlaying(false);
          }}
        >
          <source
            src={`/demos/WEBM/${encodeURIComponent(video)}.webm`}
            type="video/webm"
          />
          <source
            src={`/demos/MP4/${encodeURIComponent(video)}.mp4`}
            type="video/mp4"
          />
          Your browser does not support embedded videos.
        </video>

        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-label={isExpanded ? "Close expanded video" : "Expand video"}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-black/10 text-white/75 shadow-none backdrop-blur-sm transition hover:border-white/10 hover:bg-white/[0.07] hover:text-white focus-visible:border-white/15 focus-visible:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
        </button>

        {hasStarted && (
          <button
            type="button"
            onClick={() => {
              const player = videoRef.current;
              if (!player) return;
              if (isPlaying) player.pause();
              else void player.play();
            }}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="absolute bottom-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-black/35 text-white/90 backdrop-blur-md transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {isPlaying ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        )}

        {!hasStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,rgba(81,69,255,0.08),transparent_38%),linear-gradient(140deg,#10152D_0%,#10152D_100%)] px-6 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(165,180,252,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(165,180,252,0.045)_1px,transparent_1px)] bg-size-[32px_32px]" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[#0E1428]/80 to-transparent" />
            <div className="relative flex flex-col items-center">
              {title === "Watch the full product demo" && (
                <span className="mb-5 rounded-full border border-indigo-200/15 bg-indigo-200/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-100/70">
                  Full walkthrough
                </span>
              )}
              <button
                type="button"
                onClick={() => void videoRef.current?.play()}
                aria-label={`Play ${label}`}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200/20 bg-[#5145FF]/25 text-white shadow-[0_0_24px_rgba(81,69,255,0.2)] backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-[#5145FF]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100"
              >
                <Play size={19} fill="currentColor" className="ml-0.5" />
              </button>
              <p className="mt-5 text-lg font-semibold tracking-tight text-white sm:text-xl">
                {title}
              </p>
              <p className="mt-1 text-xs text-indigo-100/65">
                Select to start watching
              </p>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status } = useSession();

  const glassButton =
    "border border-white/20 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171B46]";

  const primaryButton =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-indigo-300/25 bg-[#5145FF]/35 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(81,69,255,0.16)] backdrop-blur-md transition hover:border-indigo-200/40 hover:bg-[#5145FF]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171B46]";
  const headerInstallButton =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-indigo-300/20 bg-[#5145FF]/35 px-3 text-xs font-semibold text-white shadow-[0_3px_10px_rgba(81,69,255,0.14)] backdrop-blur-md transition hover:border-indigo-200/35 hover:bg-[#5145FF]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171B46]";

  const dashboardButton =
    `inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium ${glassButton}`;

  return (
    <main
      className="min-h-screen overflow-hidden bg-[#11163A] text-white selection:bg-[#5145FF]/40"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(145deg, #11163A 0%, #24205A 42%, #171B46 68%, #0E1434 100%)",
        backgroundSize: "44px 44px, 44px 44px, 100vw 100vh",
        backgroundRepeat: "repeat, repeat, no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-30 bg-transparent">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-1.5">
            <Image
              src="/repoprobe-logo.png"
              alt=""
              width={36}
              height={36}
              priority
              className="h-9 w-9 scale-90 rounded-md object-contain"
            />

            <span className="text-xl font-semibold tracking-tight">
              <BrandName inverse />
            </span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {status === "authenticated" && (
              <Link href="/dashboard" className={dashboardButton}>
                Dashboard
              </Link>
            )}

            <LoginButtons compact inverse />

            <Link
              href={GITHUB_APP_URL}
              target="_blank"
              className={headerInstallButton}
            >
              <GitBranch size={15} />
              Install on GitHub
            </Link>
          </div>

          <button
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`${glassButton} rounded-lg p-2 md:hidden`}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-white/10 bg-[#171B46]/95 p-4 backdrop-blur md:hidden">
            {status === "authenticated" && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm text-indigo-100 hover:bg-white/10"
              >
                Dashboard
              </Link>
            )}

            <LoginButtons
              compact
              className="w-full"
              inverse
              onClick={() => setMobileMenuOpen(false)}
            />

            <button
              onClick={() => {
                setMobileMenuOpen(false);
              }}
              className={`${primaryButton} w-full`}
            >
              <GitBranch size={17} />
              Install on GitHub
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
        <div className="absolute inset-0 -z-10 opacity-90 bg-[radial-gradient(circle_at_50%_18%,rgba(129,140,248,0.34),transparent_27%),radial-gradient(circle_at_14%_72%,rgba(99,102,241,0.18),transparent_24%),radial-gradient(circle_at_86%_64%,rgba(244,114,182,0.10),transparent_20%)] mask-[linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-medium text-indigo-100 backdrop-blur">
              <GitBranch size={14} />
              Pull request conflict awareness
            </div>

            <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Catch code conflicts
              <span className="mt-1 block font-serif text-[1.08em] font-normal italic text-[#C8CAFF]">
                before they reach main.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-indigo-100/80 sm:text-base">
              RepoPRobe shows where pull requests overlap, so your team can review
              the right files and resolve concerns before integration.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={GITHUB_APP_URL}
                target="_blank"
                className={primaryButton}
              >
                <GitBranch size={19} />
                Get started with GitHub
              </Link>

              {status === "authenticated" && (
                <Link
                  href="/dashboard"
                  className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-medium ${glassButton}`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Main product demo */}
          <div className="relative mx-auto mt-12 max-w-5xl sm:mt-14">
            <div className="absolute -inset-5 rounded-[28px] bg-indigo-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl bg-[#111827] shadow-[0_30px_100px_-30px_rgba(0,0,0,0.8)]">
              <div className="flex h-11 items-center gap-2 border-b border-white/10 bg-[#151A31] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFD93D]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" />
                <span className="ml-3 rounded-md border border-white/8 bg-white/4 px-3 py-1 text-[10px] text-slate-400">
                  RepoPRobe.mp4
                </span>
              </div>

              <DemoPlayer
                video="RepoProbe Hero Demo"
                title="Watch the full product demo"
                label="RepoPRobe product demo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Demo videos */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Product walkthrough
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              See RepoPRobe in action.
            </h2>

            <p className="mt-5 leading-7 text-indigo-100/75">
              Get a closer look at how RepoPRobe fits into your pull request
              workflow, from connecting GitHub to reviewing overlapping changes.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2">
            {demoBites.map((bite, index) => {
              const Icon = bite.icon;

              return (
                <article
                  key={bite.title}
                  className="overflow-hidden rounded-xl bg-[#151A31]/80 shadow-xl shadow-black/10 backdrop-blur-sm"
                >
                  <DemoPlayer
                    video={bite.video}
                    title={bite.title}
                    label={`${bite.title} demo`}
                  />

                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5145FF]/20 text-indigo-200">
                        <Icon size={17} />
                      </div>

                      <h3 className="font-semibold text-white">
                        {bite.title}
                      </h3>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-indigo-100/70">
                      {bite.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 border-y border-white/10 bg-white/2.5 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Why RepoPRobe
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Know where changes overlap.
            </h2>

            <p className="mt-5 leading-7 text-indigo-100/75">
              Identify potentially conflicting changes while pull requests are
              still easy to review and update.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.035)_100%)] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300/30 hover:bg-white/8 hover:shadow-md hover:shadow-black/10"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5145FF]/20 text-indigo-200 transition-all group-hover:bg-[#5145FF]/30">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-6 text-base font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-indigo-100/70">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Simple workflow
            </p>

            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              From pull requests to clarity.
            </h2>

            <p className="mt-5 leading-7 text-indigo-100/75">
              RepoPRobe fits into your GitHub workflow, helping you identify
              overlapping changes without adding another manual review step.
            </p>
          </div>

          <div className="space-y-4">
            {workflowSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="flex gap-5 rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.035)_100%)] p-5 shadow-sm shadow-black/10 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5145FF]/20 text-indigo-200">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-widest text-indigo-200/60">
                      STEP {step.number}
                    </p>

                    <h3 className="mt-2 font-semibold text-white">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-indigo-100/70">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-indigo-300/20 px-6 py-14 text-center shadow-2xl shadow-black/10 sm:px-12 sm:py-16"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.035) 100%)",
          }}
        >
          <div className="relative">
            <Image
              src="/repoprobe-logo.png"
              alt=""
              width={48}
              height={48}
              className="mx-auto h-12 w-12 scale-90 rounded-md object-contain"
            />

            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Make overlapping changes visible.
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-indigo-100/75">
              Bring more clarity to pull request reviews before integration
              surprises slow your team down.
            </p>

            <Link href={GITHUB_APP_URL} className={`${primaryButton} mt-6`}>
              <GitBranch size={18} />
              Install RepoPRobe
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/repoprobe-logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 scale-90 rounded-md object-contain"
            />

            <span className="text-sm font-semibold">
              <BrandName inverse />
            </span>
          </Link>

          <p className="text-center text-xs text-indigo-100/55">
            A clearer way to coordinate work across parallel pull requests.
          </p>
        </div>
      </footer>
    </main>
  );
}
