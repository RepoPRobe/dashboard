'use client'
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react"
import { GithubInstallationType } from "@/types";
import toast from "react-hot-toast";
import AppHeader from "@/components/AppHeader";

export default function Dashboard() {
    const session = useSession();
    const [loadedInstallations, setLoadedInstallations] = useState<{
        token: string;
        installations: GithubInstallationType[];
    } | null>(null);
    const token = session.data?.repoProbeAuthToken;
    const installations = session.status === 'authenticated' && token && loadedInstallations && loadedInstallations.token === token
        ? loadedInstallations.installations
        : [];

    useEffect(() => {
        if(session.status === 'loading' || session.status === 'unauthenticated') return;
        const token = session.data?.repoProbeAuthToken;
        if (!token) return;
        let cancelled = false;

        (async () => { // fetch installations
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/get-tracked-installations`, {
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                    }
                });

                const parsed = await response.json();
                if (!cancelled && parsed.success) {
                    setLoadedInstallations({ token, installations: parsed.installations });
                } else if(!cancelled) {
                    console.log('Unable to load installations:', parsed.error);
                    toast.error(`Unable to load installations: ${parsed.error}`, { duration: 5000 });
                }
            } catch (error) {
                console.log('Unable to load installations:', error);
            }
        })();
        return () => {
            cancelled = true;
        }
    }, [session.status, session.data?.repoProbeAuthToken]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <AppHeader />
            <main className="px-6 py-8 sm:px-10">
              <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="mt-2 text-slate-600">Manage the GitHub installations connected to your account.</p>
                </div>
                <div aria-labelledby="installations-heading">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 id="installations-heading" className="text-xl font-semibold">Installations</h2>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                            {installations.length} {installations.length === 1 ? "installation" : "installations"}
                        </span>
                    </div>
                    {installations.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                            <h3 className="font-semibold">No installations yet</h3>
                            <p className="mt-1 text-sm text-slate-500">GitHub installations will appear here once connected.</p>
                        </div>
                    ) : (
                        <ul className="grid gap-4 md:grid-cols-2">
                            {installations.map((installation) => (
                                <li key={installation._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-4">
                                            <img src={installation.ownedBy?.avatarUrl} alt={`${installation.ownedBy?.login ?? "Unknown"}'s avatar`} className="h-12 w-12 rounded-full bg-slate-100" />
                                            <div className="min-w-0 flex-1">
                                                {installation.ownedBy?.githubUrl ? (
                                                    <Link href={installation.ownedBy.githubUrl} target="_blank" rel="noreferrer" className="truncate font-semibold text-slate-900 hover:text-indigo-600">{installation.ownedBy.login ?? "Unknown"}</Link>
                                                ) : (
                                                    <span className="truncate font-semibold text-slate-900">{installation.ownedBy?.login ?? "Unknown"}</span>
                                                )}
                                                <p className="text-sm text-slate-500">{installation.ownedBy?.userType ?? "Unknown"} account</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                {installation.repositorySelection === "selected" ? "Selected repos" : "All repos"}
                                            </span>
                                        </div>

                                        <dl className="flex justify-between border-t border-slate-100 pt-4 text-sm">
                                            <div><dt className="text-slate-500">Installed by</dt><dd className="mt-1 font-medium">{installation.installedBy?.githubUrl ? <Link href={installation.installedBy.githubUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600">@{installation.installedBy.login ?? "Unknown"}</Link> : `@${installation.installedBy?.login ?? "Unknown"}`}</dd></div>
                                            <div><dt className="text-slate-500">Installed</dt><dd className="mt-1 font-medium">{installation.installedOn ? new Date(installation.installedOn).toLocaleString() : "Unknown"}</dd></div>
                                            <div><dt className="text-slate-500">Last updated</dt><dd className="mt-1 font-medium">{installation.lastUpdatedAt ? new Date(installation.lastUpdatedAt).toLocaleString() : "Unknown"}</dd></div>
                                        </dl>

                                        <div className="flex items-center justify-between gap-3">
                                            <Link href={`/installation/${installation._id}`} className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                                                View installation
                                            </Link>
                                            <Link href={installation.githubRedirect} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                                                Manage on GitHub <span aria-hidden="true" className="ml-1"></span>
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            </main>
        </div>
    )
}