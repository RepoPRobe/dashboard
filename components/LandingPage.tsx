
"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LoginButtons from "@/components/LoginButtons";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Code2,
  Eye,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Menu,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface LandingPageProps {
  onInstall?: () => void;
}

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

const exampleConflicts = [
  {
    file: "src/services/payment.ts",
    prs: "#142 · #157",
    lines: "Lines 84–92",
  },
  {
    file: "src/hooks/usePlayer.ts",
    prs: "#151 · #163",
    lines: "Lines 36–41",
  },
  {
    file: "src/utils/queue.ts",
    prs: "#159 · #164",
    lines: "Lines 102–108",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Connect your repositories",
    description:
      "Install the GitHub App and select the repositories you want RepoPRobe to monitor.",
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

export default function LandingPage({
  onInstall,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status } = useSession();

  const primaryButton =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#5145FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2";

  const headerInstallButton =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5145FF] px-3 text-xs font-semibold text-white transition hover:bg-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2";

  const dashboardButton =
    "inline-flex h-9 items-center justify-center rounded-lg border border-[#DCE4EF] bg-white px-3 text-xs font-medium text-[#344256] transition hover:border-[#C4C5FF] hover:bg-[#F1F4F9] hover:text-[#5145FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2";

  const secondaryButton =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE4EF] bg-white px-5 py-3 text-sm font-medium text-[#344256] transition hover:bg-[#F1F4F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145FF] focus-visible:ring-offset-2";

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FC] text-[#111827] selection:bg-[#E8E9FF]">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#DCE4EF] bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-1.5">
            <Image
              src="/repoprobe-logo.png"
              alt=""
              width={36}
              height={36}
              priority
              className="h-9 w-9 scale-90 rounded-md object-contain"
            />

            <span className="text-xl font-semibold tracking-tight">
              Repo<span className="text-[#5145FF]">PRobe</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-[#526581] md:flex">
            <a href="#features" className="transition hover:text-[#5145FF]">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-[#5145FF]">
              How it works
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {status === "authenticated" && (
              <Link href="/dashboard" className={dashboardButton}>
                Dashboard
              </Link>
            )}

            <LoginButtons compact />

            <Link
              href={GITHUB_APP_URL}
              target="_blank"
              className={headerInstallButton}
            >
              <GitBranch size={15} />
              Install on GitHub
              <ArrowRight size={14} />
            </Link>
          </div>

          <button
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-[#344256] transition hover:bg-[#F1F4F9] md:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-[#DCE4EF] bg-white p-4 md:hidden">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-[#344256] hover:bg-[#F1F4F9]"
            >
              Features
            </a>

            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-[#344256] hover:bg-[#F1F4F9]"
            >
              How it works
            </a>

            {status === "authenticated" && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm text-[#344256] hover:bg-[#F1F4F9]"
              >
                Dashboard
              </Link>
            )}

            <LoginButtons
              compact
              className="w-full"
              onClick={() => setMobileMenuOpen(false)}
            />

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onInstall?.();
              }}
              className={`${primaryButton} w-full`}
            >
              <GitBranch size={17} />
              Install on GitHub
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(90vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(81,69,255,0.09)_0%,rgba(81,69,255,0.035)_38%,transparent_72%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D9D7FF] bg-[#E8E9FF] px-3.5 py-2 text-xs font-medium text-[#5145FF]">
              <GitBranch size={14} />
              Pull request conflict awareness
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-[#111827] sm:text-5xl lg:text-6xl xl:text-[66px]">
              Catch code{" "}
              <span className="text-[#5145FF]">conflicts</span>{" "}
              before they catch you.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#526581] sm:text-lg">
              Multiple pull requests. The same files. Unexpected surprises.
              RepoPRobe identifies overlapping changes early, helping your
              team review them before integration gets complicated.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={GITHUB_APP_URL} target="_blank" className={primaryButton}>
                <GitBranch size={19} />
                Get started with GitHub
                <ArrowRight size={17} />
              </Link>

              <a href="#workflow" className={secondaryButton}>
                See how it works
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#526581]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#00875A]" />
                GitHub integration
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#00875A]" />
                Code-level overlap detection
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="pointer-events-none absolute -inset-5 rounded-3xl bg-[#5145FF]/6 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-[#DCE4EF] bg-[linear-gradient(145deg,#FFFFFF_0%,#FCFBFF_100%)] shadow-lg shadow-slate-900/4">
              <div className="flex items-center justify-between border-b border-[#E8EDF4] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8E9FF] text-[#5145FF]">
                    <GitBranch size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      Conflict overview
                    </p>
                    <p className="mt-0.5 text-xs text-[#71829B]">
                      example-repository
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Review needed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 sm:p-5">
                <div className="rounded-xl border border-[#DCE4EF] bg-white p-3.5">
                  <p className="text-xs text-[#71829B]">Tracked PRs</p>
                  <p className="mt-2 text-2xl font-semibold text-[#111827]">
                    12
                  </p>
                </div>

                <div className="rounded-xl border border-[#DCE4EF] bg-white p-3.5">
                  <p className="text-xs text-[#71829B]">With conflicts</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">
                    3
                  </p>
                </div>

                <div className="rounded-xl border border-[#DCE4EF] bg-white p-3.5">
                  <p className="text-xs text-[#71829B]">Affected files</p>
                  <p className="mt-2 text-2xl font-semibold text-[#111827]">
                    5
                  </p>
                </div>
              </div>

              <div className="px-4 pb-2 sm:px-5">
                <div className="flex items-center justify-between border-b border-[#E8EDF4] pb-3">
                  <p className="text-sm font-semibold text-[#111827]">
                    Detected overlaps
                  </p>
                  <span className="text-xs text-[#71829B]">Recent activity</span>
                </div>

                <div className="divide-y divide-[#E8EDF4]">
                  {exampleConflicts.map((item) => (
                    <div key={item.file} className="flex items-center gap-3 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Code2 size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-[#253247] sm:text-sm">
                          {item.file}
                        </p>
                        <p className="mt-1 text-xs text-[#71829B]">
                          PR {item.prs} · {item.lines}
                        </p>
                      </div>

                      <ArrowRight size={16} className="shrink-0 text-[#8B98AB]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="m-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:m-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#00875A]">
                  <Activity size={15} />
                  Conflict scan completed
                </div>
                <p className="mt-2 text-sm leading-6 text-[#526581]">
                  Potentially overlapping changes identified. Review the
                  affected regions before merging.
                </p>
              </div>

              <div className="border-t border-[#E8EDF4] px-5 py-3">
                <p className="text-center text-[11px] text-[#71829B]">
                  Illustrative product preview · Example data
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 border-y border-[#DCE4EF] bg-[#F1F4F9] px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5145FF]">
              Why RepoPRobe
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Know where changes overlap.
            </h2>

            <p className="mt-5 leading-7 text-[#526581]">
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
                  className="group rounded-xl border border-[#DCE4EF] bg-[linear-gradient(145deg,#FFFFFF_0%,#FCFBFF_100%)] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#C4C5FF] hover:shadow-md hover:shadow-slate-900/3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#F0EFFF_0%,#E8E9FF_100%)] text-[#5145FF] transition-all group-hover:bg-[linear-gradient(135deg,#E8E9FF_0%,#DDDEFF_100%)]">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-6 text-base font-semibold text-[#111827]">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#526581]">
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5145FF]">
              Simple workflow
            </p>

            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-4xl">
              From pull requests to clarity.
            </h2>

            <p className="mt-5 leading-7 text-[#526581]">
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
                  className="flex gap-5 rounded-xl border border-[#DCE4EF] bg-[linear-gradient(145deg,#FFFFFF_0%,#FCFBFF_100%)] p-5 shadow-sm shadow-slate-900/2 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#F0EFFF_0%,#E8E9FF_100%)] text-[#5145FF]">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-widest text-[#71829B]">
                      STEP {step.number}
                    </p>

                    <h3 className="mt-2 font-semibold text-[#111827]">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#526581]">
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
          className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#D9D7FF] px-6 py-14 text-center sm:px-12 sm:py-16"
          style={{
            backgroundImage:
            "radial-gradient(circle at 18% 50%, rgba(81,69,255,0.06) 0%, rgba(81,69,255,0.025) 32%, rgba(81,69,255,0) 72%), linear-gradient(135deg, #FEFDFF 0%, #FAF9FF 100%)",
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

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Make overlapping changes visible.
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-[#526581]">
              Bring more clarity to pull request reviews before integration
              surprises slow your team down.
            </p>

            <button onClick={onInstall} className={`${primaryButton} mt-8`}>
              <GitBranch size={18} />
              Install RepoPRobe
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCE4EF] bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/repoprobe-logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 scale-90 rounded-md object-contain"
            />

            <span className="text-sm font-semibold text-[#111827]">
              Repo<span className="text-[#5145FF]">Probe</span>
            </span>
          </a>

          <p className="text-center text-xs text-[#71829B]">
            Make overlapping changes visible before they become a problem.
          </p>
        </div>
      </footer>
    </main>
  );
}
