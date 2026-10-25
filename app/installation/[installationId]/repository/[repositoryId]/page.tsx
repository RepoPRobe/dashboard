'use client'

import { useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import toast from "react-hot-toast";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PRsConflicts from "@/components/PRsConflict";

type UserType = {
    id: string;
    login: string; // username
    avatarUrl: string;
    githubUrl: string;
    userType: string;
}

type PullRequestLabelType = {
    id: number;
    name: string;
    default: boolean;
}


type PullRequestType = {
    _id: string;
    repoId: string;
    installationId: string;
    githubPrId: string;
    prNumber: number;
    title: string;
    htmlUrl: string;
    state: 'open' | 'closed' | 'merged';
    isDraft: boolean;
    baseBranch: string;
    baseBranchHeadSha: string;
    headBranch: string;
    headBranchHeadSha: string;
    author: UserType;
    labels: PullRequestLabelType[];
    githubCreatedAt: Date;
    githubUpdatedAt: Date;
    githubClosedAt?: Date | null;
    githubMergedAt?: Date | null;
    assignees: UserType[];
    lastCommitAt?: Date | null;
    isTracked: boolean;
    processingStatus: 'pending' | 'processing' | 'completed' | 'error';
    conflictState: 'no_conflicts' | 'conflicts_found' | 'unknown';
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}


type RepositoryData = {
    repository: {
        id: string;
        name: string;
        fullName: string;
        private: boolean;
        htmlUrl: string;
        installedOn: string;
    };
    permissions: Record<string, boolean>;
    stats: {
        totalPRsInRepoPRobe: PullRequestType[];
        conflictingPRIds: string[];
    };
};

export default function Repository({
    params,
}: {
    params: Promise<{ installationId: string; repositoryId: string }>;
}) {
    const { repositoryId, installationId } = use(params);
    const session = useSession();
    const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPullRequest, setSelectedPullRequest] = useState<PullRequestType | null>(null);
    const [conflictsData, setConflictsData] = useState([]);
    const [isConflictDialogOpen, setIsConflictDialogOpen] = useState<boolean>(false);

    useEffect(() => {
        const token = session.data?.repoProbeAuthToken;
        if (!token) return;

        let cancelled = false;

        const fetchRepository = async () => {
            setLoading(true);
            setError("");

            try {
                const query = new URLSearchParams({ installationId, repositoryId });
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_URL}/get-repository?${query.toString()}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (!response.ok) {
                    throw new Error("Unable to load repository details.");
                }

                const parsed = await response.json();
                if (!parsed.success || !parsed.repository) {
                    throw new Error("Repository details were not returned.");
                }

                if (!cancelled) setRepositoryData(parsed.repository);
            } catch (fetchError) {
                if (!cancelled) {
                    setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchRepository();

        return () => {
            cancelled = true;
        };
    }, [installationId, repositoryId, session.data?.repoProbeAuthToken]);

    const handleTrackPR = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/track`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        installationId,
                        repositoryId,
                        prNumber: selectedPullRequest?.prNumber,
                    }),
                }
            );
            const parsed = await response.json();
            if (parsed.success) {
                toast.success(parsed.message);
            } else {
                toast.error('Unable to track the pullrequest');
            }
        } catch (error) {
            console.log('Something went wrong while marking PR tracked:', error);
            toast.error('Unable to track the pullrequest');
        } finally {
            setSelectedPullRequest(null);
        }
    }

    const handleUntrackPR = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/untrack`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        installationId,
                        repositoryId,
                        prNumber: selectedPullRequest?.prNumber,
                    }),
                }
            );
            const parsed = await response.json();
            if (parsed.success) {
                toast.success(parsed.message);
            } else {
                toast.error('Unable to untrack the pullrequest');
            }
        } catch (error) {
            console.log('Something went wrong while marking PR tracked:', error);
            toast.error('Unable to untrack the pullrequest');
        } finally {
            setSelectedPullRequest(null);
        }
    }

    const handleSyncPR = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/sync`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        installationId,
                        repositoryId,
                        prNumber: selectedPullRequest?.prNumber,
                    }),
                }
            );
            const parsed = await response.json();
            if (parsed.success) {
                toast.success(parsed.message);
            } else {
                toast.error('Unable to sync the pullrequest');
            }
        } catch (error) {
            console.log('Something went wrong while syncing PR:', error);
            toast.error('Unable to sync the pullrequest');
        } finally {
            setSelectedPullRequest(null);
        }
    }

    const handleScanPRConflicts = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/scan-conflicts`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        installationId,
                        repositoryId,
                        prNumber: selectedPullRequest?.prNumber,
                    }),
                }
            );
            const parsed = await response.json();
            if (parsed.success) {
                toast.success(parsed.message);
            } else {
                toast.error('Unable to scan the pullrequest for conflicts');
            }
        } catch (error) {
            console.log('Something went wrong while scanning PR conflicts:', error);
            toast.error('Unable to scan the pullrequest for conflicts');
        } finally {
            setSelectedPullRequest(null);
        }
    }

    const handleRetryProcessing = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/retry-processing`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        installationId,
                        repositoryId,
                        prNumber: selectedPullRequest?.prNumber,
                    }),
                }
            );
            const parsed = await response.json();
            if (parsed.success) {
                toast.success(parsed.message);
            } else {
                toast.error('Unable to retry processing the pullrequest');
            }
        } catch (error) {
            console.log('Something went wrong while retrying PR processing:', error);
            toast.error('Unable to retry processing the pullrequest');
        } finally {
            setSelectedPullRequest(null);
        }
    }

    const handleViewConflicts = async () => {
        try {
            const query = new URLSearchParams({ installationId, repositoryId, prNumber: String(selectedPullRequest?.prNumber) });
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/conflicts?${query}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${session.data?.repoProbeAuthToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const parsed = await response.json();
            if (parsed.success) {
                setConflictsData(parsed.conflicts);
                setIsConflictDialogOpen(true);
            } else {
                toast.error('Unable to view the pullrequest conflicts');
            }
        } catch (error) {
            console.log('Something went wrong while viewing PR conflicts:', error);
            toast.error('Unable to view the pullrequest conflicts');
        }
    }

    const repository = repositoryData?.repository;
    const pullRequests = repositoryData?.stats.totalPRsInRepoPRobe ?? [];
    const conflictingPRIds = new Set(repositoryData?.stats.conflictingPRIds ?? []);
    const conflictCount = pullRequests.filter((pr) => conflictingPRIds.has(pr._id)).length;
    const openCount = pullRequests.filter((pr) => pr.state === "open").length;

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10">
            <div className="mx-auto max-w-5xl">
                <header className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">RepoProbe</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">
                        {repository?.name ?? "Repository"}
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Pull request tracking and conflict status for this repository.
                    </p>
                </header>

                {loading ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
                        Loading repository details…
                    </div>
                ) : error ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-white px-6 py-8 text-center text-sm text-red-700 shadow-sm">
                        {error}
                    </div>
                ) : repository && repositoryData ? (
                    <>
                        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <a
                                        href={repository.htmlUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
                                    >
                                        {repository.fullName}
                                    </a>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Installed on {new Date(repository.installedOn).toLocaleString()}
                                    </p>
                                </div>
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                                    {repository.private ? "Private repository" : "Public repository"}
                                </span>
                            </div>

                            <div className="mt-5 border-t border-slate-100 pt-4">
                                <h2 className="text-sm font-semibold text-slate-700">Permissions</h2>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {Object.entries(repositoryData.permissions)
                                        .filter(([, allowed]) => allowed)
                                        .map(([permission]) => (
                                            <span
                                                key={permission}
                                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600"
                                            >
                                                {permission}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        </section>

                        <section aria-labelledby="pull-requests-heading">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 id="pull-requests-heading" className="text-xl font-semibold">
                                    Tracked pull requests
                                </h2>
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                                    {pullRequests.length} {pullRequests.length === 1 ? "pull request" : "pull requests"}
                                </span>
                            </div>

                            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-sm text-slate-500">Tracked</p>
                                    <p className="mt-1 text-2xl font-semibold">{pullRequests.length}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-sm text-slate-500">Open</p>
                                    <p className="mt-1 text-2xl font-semibold">{openCount}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-sm text-slate-500">With conflicts</p>
                                    <p className="mt-1 text-2xl font-semibold text-amber-600">{conflictCount}</p>
                                </div>
                            </div>

                            {pullRequests.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                                    <h3 className="font-semibold">No tracked pull requests</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Tracked pull requests for this repository will appear here.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {pullRequests.map((pr) => {
                                        const hasConflicts = conflictingPRIds.has(pr._id);

                                        return (
                                            <li
                                                key={pr._id}
                                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <a
                                                            href={pr.htmlUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-semibold text-slate-900 hover:text-indigo-600"
                                                        >
                                                            {pr.title}
                                                        </a>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            #{pr.prNumber} · <a href={pr.author.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-700 underline underline-offset-2 hover:text-indigo-600">@{pr.author.login}</a> wants to merge into <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">{pr.baseBranch}</code> from <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">{pr.headBranch}</code>
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pr.state === "open"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}>
                                                            {pr.state}
                                                        </span>
                                                        {pr.isDraft && (
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                Draft
                                                            </span>
                                                        )}
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasConflicts
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}>
                                                            {hasConflicts ? "Conflicts found" : "No conflicts"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                                                    <a
                                                        href={pr.author.githubUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 font-medium text-slate-700 hover:text-indigo-600"
                                                    >
                                                        <img
                                                            src={pr.author.avatarUrl}
                                                            alt=""
                                                            className="h-6 w-6 rounded-full"
                                                        />
                                                        {pr.author.login}
                                                    </a>
                                                    <span className="text-slate-500">
                                                        Updated {new Date(pr.githubUpdatedAt).toLocaleDateString()}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedPullRequest(pr)}
                                                    >
                                                        Details
                                                    </Button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    </>
                ) : null}
            </div>
            <Sheet
                open={selectedPullRequest !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedPullRequest(null);
                }}
            >
                {selectedPullRequest && (
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{selectedPullRequest.title}</SheetTitle>
                            <SheetDescription>
                                Pull request #{selectedPullRequest.prNumber} details
                            </SheetDescription>
                        </SheetHeader>
                        <dl className="space-y-4 px-4">
                            <div>
                                <dt className="text-xs font-medium uppercase text-muted-foreground">Branches</dt>
                                <dd className="mt-1 wrap-break-word">
                                    <a href={selectedPullRequest.author.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">
                                        @{selectedPullRequest.author.login}
                                    </a>{" "}wants to merge into <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{selectedPullRequest.baseBranch}</code> from <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{selectedPullRequest.headBranch}</code>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase text-muted-foreground">Status</dt>
                                <dd className="mt-1">
                                    {selectedPullRequest.state}{selectedPullRequest.isDraft ? " · Draft" : ""}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase text-muted-foreground">Author</dt>
                                <dd className="mt-1">{selectedPullRequest.author.login}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase text-muted-foreground">Last updated</dt>
                                <dd className="mt-1">
                                    {new Date(selectedPullRequest.githubUpdatedAt).toLocaleString()}
                                </dd>
                            </div>
                            <a
                                href={selectedPullRequest.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-sm font-medium text-primary underline underline-offset-4"
                            >
                                Open on GitHub
                            </a>

                            {selectedPullRequest.state === 'open' && (
                                <div>
                                    {repositoryData?.permissions?.triage && !selectedPullRequest.isTracked && <Button onClick={handleTrackPR}>Track</Button>}
                                    {repositoryData?.permissions?.triage && selectedPullRequest.isTracked && <Button onClick={handleUntrackPR}>Untrack</Button>}
                                    {repositoryData?.permissions?.push && selectedPullRequest.isTracked && ['completed', 'error'].includes(selectedPullRequest.processingStatus) && (
                                        <Button onClick={handleSyncPR}>Sync</Button>
                                    )}
                                    {repositoryData?.permissions?.push && selectedPullRequest.isTracked && ['completed', 'error'].includes(selectedPullRequest.processingStatus) && selectedPullRequest.conflictState !== 'conflicts_found' && (
                                        <Button onClick={handleScanPRConflicts}>Scan Conflicts</Button>
                                    )}
                                    {repositoryData?.permissions?.push && selectedPullRequest.conflictState === 'conflicts_found' && <Button onClick={handleViewConflicts}>View Conflicts</Button>}
                                    {repositoryData?.permissions?.push && selectedPullRequest.processingStatus === 'error' && <Button onClick={handleRetryProcessing}>Retry Processing</Button>}
                                </div>
                            )}
                        </dl>
                    </SheetContent>
                )}
            </Sheet>

            <Dialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
                <DialogContent className="min-w-[80vw]">
                    <DialogHeader>
                        <DialogTitle>View Conflicts for #{selectedPullRequest?.prNumber}</DialogTitle>
                        <DialogDescription>
                            {selectedPullRequest?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="-mx-4 no-scrollbar max-h-[80vh] overflow-y-auto px-4">
                        <PRsConflicts conflicts={conflictsData as any} />
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" onClick={() => setIsConflictDialogOpen(false)}>Close</Button>} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
