'use client'
import { useSession } from "next-auth/react";
import { use, useEffect, useState } from "react"
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import ActivityList from "@/components/ActivityList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LoaderCircle } from "lucide-react";

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
    const [completedRepositoryRequestKey, setCompletedRepositoryRequestKey] = useState<string | null>(null);
    const token = session.data?.repoProbeAuthToken;
    const repositoryRequestKey = JSON.stringify([githubInstallationId, token]);
    const isLoadingRepositories = session.status === "authenticated"
        && !!token
        && completedRepositoryRequestKey !== repositoryRequestKey;
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
            } finally {
                if (!cancelled) {
                    setCompletedRepositoryRequestKey(repositoryRequestKey);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [githubInstallationId, repositoryRequestKey, session.status, session.data?.repoProbeAuthToken]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <AppHeader currentPage="installation" />
            <main className="px-6 py-8 sm:px-10">
              <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
                    >
                        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                        Back to dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Installation Repositories</h1>
                    <p className="mt-2 text-slate-600">Manage the GitHub repositories connected to this installation.</p>
                </div>

                <Tabs defaultValue="repositories" className="gap-6">
                    <TabsList variant="line" aria-label="Installation views">
                        <TabsTrigger value="repositories">Repositories</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="repositories">
                        <div aria-labelledby="repositories-heading">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 id="repositories-heading" className="text-xl font-semibold">Repositories</h2>
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                                    {trackedRepositories.length} {trackedRepositories.length === 1 ? "repository" : "repositories"}
                                </span>
                            </div>

                            {isLoadingRepositories ? (
                                <div
                                    role="status"
                                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-12 text-sm text-slate-500"
                                >
                                    <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-indigo-600" />
                                    Loading repositories...
                                </div>
                            ) : trackedRepositories.length === 0 ? (
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
                                                                <div className="block truncate text-xs font-semibold text-slate-500">
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
                    </TabsContent>

                    <TabsContent value="activity">
                        <ActivityList
                            title="Installation activity"
                            description="Events affecting this GitHub App installation."
                            emptyTitle="No installation activity yet"
                            emptyDescription="Installation events will appear here as they happen."
                            variant="installation"
                            githubInstallationId={githubInstallationId}
                        />
                    </TabsContent>
                </Tabs>
            </div>
            </main>
        </div>
    );
}