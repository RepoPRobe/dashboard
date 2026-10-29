'use client'
import { useSession } from "next-auth/react";
import { use, useEffect, useState } from "react"
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

type TrackedRepository = {
    _id: string;
    githubId: number;
    fullName: string;
    private: boolean;
    name: string;
    installedOn: string;
    permissions: {
        admin?: boolean;
        maintain?: boolean;
        push?: boolean;
        triage?: boolean;
        pull?: boolean;
    };
};

export default function Installation({ params }: { params: Promise<{ installationId: string }> }) {
    const session = useSession();
    const { installationId: githubInstallationId } = use(params);
    const [loadedRepositories, setLoadedRepositories] = useState<{
        installationId: string;
        token: string;
        repositories: TrackedRepository[];
    } | null>(null);
    const token = session.data?.repoProbeAuthToken;
    const trackedRepositories = session.status === 'authenticated' && token && loadedRepositories
        && loadedRepositories.installationId === githubInstallationId && loadedRepositories.token === token
        ? loadedRepositories.repositories
        : [];

    useEffect(() => {
        if (session.status === 'loading' || session.status === 'unauthenticated') return;
        if (!githubInstallationId) return;
        const token = session.data?.repoProbeAuthToken;
        if (!token) return;

        let cancelled = false;
        (async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_URL}/get-tracked-repositories?installationId=${encodeURIComponent(githubInstallationId)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        }
                    }
                );

                const parsed = await response.json();
                if (!cancelled && parsed.success) {
                    setLoadedRepositories({
                        installationId: githubInstallationId,
                        token,
                        repositories: parsed.trackedRepositories,
                    });
                } else if (!cancelled) {
                    console.log('Unable to load repositories:', parsed.error);
                }
            } catch (error) {
                console.log('Unable to load repositories:', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [githubInstallationId, session.status, session.data?.repoProbeAuthToken]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <AppHeader installationId={githubInstallationId} />
            <main className="px-6 py-8 sm:px-10">
              <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Installation Repositories</h1>
                    <p className="mt-2 text-slate-600">Manage the GitHub repositories connected to this installation.</p>
                </div>

                <div aria-labelledby="repositories-heading">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 id="repositories-heading" className="text-xl font-semibold">Repositories</h2>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                            {trackedRepositories.length} {trackedRepositories.length === 1 ? "repository" : "repositories"}
                        </span>
                    </div>

                    {trackedRepositories.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                            <h3 className="font-semibold">No repositories yet</h3>
                            <p className="mt-1 text-sm text-slate-500">GitHub repositories will appear here once connected.</p>
                        </div>
                    ) : (
                        <ul className="grid gap-4 md:grid-cols-2">
                            {trackedRepositories.map((repo) => {
                                const githubUrl = `https://github.com/${repo.fullName}`;

                                return (
                                    <li
                                        key={repo._id}
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                                        {repo.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={githubUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block truncate font-semibold text-slate-900 hover:text-indigo-600"
                                                        >
                                                            {repo.name}
                                                        </Link>
                                                          <div className="truncate text-xs text-slate-500 block font-semibold">
                                                              {repo.fullName}
                                                          </div>
                                                    </div>
                                                </div>

                                                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                    {repo.private ? "Private" : "Public"}
                                                </span>
                                            </div>

                                            <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                                                <div>
                                                    <dt className="text-slate-500">Installed</dt>
                                                    <dd className="mt-1 font-medium">
                                                        {new Date(repo.installedOn).toLocaleString()}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-slate-500">Links</dt>
                                                    <dd className="mt-1 font-medium">
                                                        <Link
                                                            href={`/installation/${githubInstallationId}/repository/${repo._id}`}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            View
                                                        </Link>
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
            </main>
        </div>
    );
}