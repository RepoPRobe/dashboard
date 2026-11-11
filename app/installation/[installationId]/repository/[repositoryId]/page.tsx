'use client'

import { signIn, useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import toast from "react-hot-toast";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PRsConflicts from "@/components/PRsConflict";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityList from "@/components/ActivityList";
import { Banner } from "@/components/ui/banner";
import { ArrowLeft, CalendarClock, ChevronDown, ExternalLink, LoaderCircle, Search } from "lucide-react";

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

type PullRequestSearchField = "prNumber" | "title" | "author.login";

const pullRequestSearchFieldLabels: Record<PullRequestSearchField, string> = {
    prNumber: "PR number",
    title: "Title",
    "author.login": "Author",
};

function isPullRequestSearchField(value: string): value is PullRequestSearchField {
    return Object.hasOwn(pullRequestSearchFieldLabels, value);
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

async function fetchRepositoryData(
    installationId: string,
    repositoryId: string,
    token: string,
): Promise<RepositoryData> {
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

    return parsed.repository;
}

export default function Repository({
    params,
}: {
    params: Promise<{ installationId: string; repositoryId: string }>;
}) {
    const { repositoryId, installationId } = use(params);
    const session = useSession();
    const [repositoryResult, setRepositoryResult] = useState<{
        key: string;
        data: RepositoryData;
    } | null>(null);
    const [repositoryError, setRepositoryError] = useState<{
        key: string;
        message: string;
    } | null>(null);
    const [pullRequestSearch, setPullRequestSearch] = useState("");
    const [pullRequestSearchField, setPullRequestSearchField] = useState<PullRequestSearchField>("prNumber");
    const [selectedPullRequest, setSelectedPullRequest] = useState<PullRequestType | null>(null);
    const [conflictsData, setConflictsData] = useState([]);
    const [isConflictDialogOpen, setIsConflictDialogOpen] = useState<boolean>(false);
    const [untrackedOpenPRs, setUntrackedOpenPRs] = useState<{
        githubId: number,
        title: string,
        prNumber: number,
        htmlUrl: string,
        updatedAt: string,
    }[]>([]);
    const [untrackedPRSearch, setUntrackedPRSearch] = useState("");
    const [isLoadingUntrackedOpenPRs, setIsLoadingUntrackedOpenPRs] = useState(false);
    const [untrackedOpenPRsError, setUntrackedOpenPRsError] = useState("");
    const [trackingUntrackedPRNumber, setTrackingUntrackedPRNumber] = useState<number | null>(null);
    const token = session.data?.repoProbeAuthToken;
    const repositoryRequestKey = JSON.stringify([installationId, repositoryId, token]);
    const repositoryData = session.status === "authenticated" && token
        && repositoryResult?.key === repositoryRequestKey
        ? repositoryResult.data
        : null;
    const error = repositoryError?.key === repositoryRequestKey
        ? repositoryError.message
        : session.status === "authenticated" && !token
            ? "Authentication token is unavailable."
            : "";
    const isLoading = session.status === "loading"
        || session.status === "authenticated" && !!token && !repositoryData && !error;

    const refreshAfterPRMutation = async () => {
        try {
            if (!token) {
                throw new Error("Authentication token is unavailable.");
            }

            const repository = await fetchRepositoryData(installationId, repositoryId, token);
            setRepositoryResult({ key: repositoryRequestKey, data: repository });
        } catch (error) {
            console.error("Unable to refresh repository data after pull request action:", error);
            toast.error("Action completed, but repository data could not be refreshed.");
        }
    };

    const updatePullRequest = (prNumber: number, updates: Partial<PullRequestType>) => {
        setRepositoryResult((current) => current?.key === repositoryRequestKey ? {
            ...current,
            data: {
                ...current.data,
                stats: {
                    ...current.data.stats,
                    totalPRsInRepoPRobe: current.data.stats.totalPRsInRepoPRobe.map((pullRequest) =>
                        pullRequest.prNumber === prNumber ? { ...pullRequest, ...updates } : pullRequest
                    ),
                },
            },
        } : current);
        setSelectedPullRequest((current) =>
            current?.prNumber === prNumber ? { ...current, ...updates } : current
        );
    };

    useEffect(() => {
        let cancelled = false;
        const clearRepositoryState = () => {
            cancelled = true;
            setRepositoryResult(null);
            setRepositoryError(null);
            setSelectedPullRequest(null);
            setConflictsData([]);
            setIsConflictDialogOpen(false);
        };

        if (session.status === "loading") {
            return clearRepositoryState;
        }

        if (session.status === "unauthenticated") {
            return clearRepositoryState;
        }

        if (!token) {
            return clearRepositoryState;
        }

        const fetchRepository = async () => {
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

                if (!cancelled) {
                    setRepositoryResult({ key: repositoryRequestKey, data: parsed.repository });
                }
            } catch (fetchError) {
                if (!cancelled) {
                    setRepositoryError({
                        key: repositoryRequestKey,
                        message: fetchError instanceof Error ? fetchError.message : "Something went wrong.",
                    });
                }
            }
        };

        fetchRepository();

        return clearRepositoryState;
    }, [installationId, repositoryId, repositoryRequestKey, session.status, token]);

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
                await refreshAfterPRMutation();
                if (selectedPullRequest) {
                    updatePullRequest(selectedPullRequest.prNumber, { isTracked: true });
                }
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
                await refreshAfterPRMutation();
                if (selectedPullRequest) {
                    updatePullRequest(selectedPullRequest.prNumber, { isTracked: false });
                }
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
                await refreshAfterPRMutation();
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
                await refreshAfterPRMutation();
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
                await refreshAfterPRMutation();
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

    const fetchUntrackedOpenPRs = async () => {
        setIsLoadingUntrackedOpenPRs(true);
        setUntrackedOpenPRsError("");

        try {
            if (!token) {
                throw new Error("Authentication token is unavailable.");
            }

            const query = new URLSearchParams({ installationId, repositoryId });
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/untracked-open-pull-requests?${query}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const parsed = await response.json();

            if (!response.ok || !parsed.success) {
                throw new Error(parsed.message || "Unable to fetch untracked pull requests.");
            }

            setUntrackedOpenPRs(parsed.untrackedOpenPullRequests ?? []);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to fetch untracked pull requests.";
            console.error("Unable to fetch untracked pull requests:", error);
            setUntrackedOpenPRsError(message);
            toast.error(message);
        } finally {
            setIsLoadingUntrackedOpenPRs(false);
        }
    }

    const handleTrackUntrackedPR = async (prNumber: number) => {
        if (!token) {
            toast.error("Authentication token is unavailable.");
            return;
        }

        setTrackingUntrackedPRNumber(prNumber);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/pullrequest/track`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ installationId, repositoryId, prNumber }),
                }
            );
            const parsed = await response.json();

            if (!response.ok || !parsed.success) {
                throw new Error(parsed.message || "Unable to track pull request.");
            }

            toast.success(parsed.message || "Pull request tracking initiated.");
            setUntrackedOpenPRs((current) => current.filter((pr) => pr.prNumber !== prNumber));
            await refreshAfterPRMutation();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to track pull request.";
            console.error("Unable to track untracked pull request:", error);
            toast.error(message);
        } finally {
            setTrackingUntrackedPRNumber(null);
        }
    }

    const repository = repositoryData?.repository;
    const pullRequests = repositoryData?.stats.totalPRsInRepoPRobe ?? [];
    const conflictingPRIds = new Set(repositoryData?.stats.conflictingPRIds ?? []);
    const conflictCount = pullRequests.filter((pr) => conflictingPRIds.has(pr._id)).length;
    const openCount = pullRequests.filter((pr) => pr.state === "open").length;
    const normalizedSearch = pullRequestSearch.trim().toLocaleLowerCase();
    const filteredPullRequests = normalizedSearch
        ? pullRequests.filter((pr) => {
            const searchableValues: Record<PullRequestSearchField, string> = {
                prNumber: String(pr.prNumber),
                title: pr.title,
                "author.login": pr.author.login,
            };
            return searchableValues[pullRequestSearchField].toLocaleLowerCase().includes(normalizedSearch);
        })
        : pullRequests;
    const normalizedUntrackedPRSearch = untrackedPRSearch.trim().toLocaleLowerCase();
    const filteredUntrackedOpenPRs = normalizedUntrackedPRSearch
        ? untrackedOpenPRs.filter((pr) =>
            String(pr.prNumber).includes(normalizedUntrackedPRSearch)
            || pr.title.toLocaleLowerCase().includes(normalizedUntrackedPRSearch)
        )
        : untrackedOpenPRs;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <AppHeader />
            <main className="px-6 py-8 sm:px-10">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-8">
                        <Link
                            href={`/installation/${installationId}`}
                            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
                        >
                            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                            Back to installation
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {repository?.name ?? "Repository"}
                        </h1>
                        <p className="mt-2 text-slate-600">
                            Pull request tracking and conflict status for this repository.
                        </p>
                    </header>

                    {session.status === "unauthenticated" ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
                            <h2 className="text-lg font-semibold">Sign in to view this repository</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Your session has ended. Sign in with GitHub to continue.
                            </p>
                            <Button
                                className="mt-5"
                                onClick={() => void signIn("github", { callbackUrl: window.location.href })}
                            >
                                Sign in with GitHub
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div
                            role="status"
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-12 text-sm text-slate-500 shadow-sm"
                        >
                            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-indigo-600" />
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
                                        <Link
                                            href={repository.htmlUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
                                        >
                                            {repository.fullName}
                                        </Link>
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

                            <Tabs defaultValue="tracked-pull-requests" className="gap-6">
                                <TabsList variant="line" aria-label="Repository views">
                                    <TabsTrigger value="tracked-pull-requests">Tracking</TabsTrigger>
                                    <TabsTrigger value="untracked-pull-requests" onClick={() => fetchUntrackedOpenPRs()}>Untracked PRs</TabsTrigger>
                                    <TabsTrigger value="activity">Activity</TabsTrigger>
                                </TabsList>

                                <TabsContent value="tracked-pull-requests">
                                    <section aria-labelledby="pull-requests-heading">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                            <h2 id="pull-requests-heading" className="text-xl font-semibold">
                                                Tracked pull requests
                                            </h2>
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                                                {pullRequests.length} {pullRequests.length === 1 ? "pull request" : "pull requests"}
                                            </span>
                                        </div>

                                        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs text-slate-500">Tracked</p>
                                                    <p className="text-sm font-semibold tabular-nums">{pullRequests.length}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs text-slate-500">Open</p>
                                                    <p className="text-sm font-semibold tabular-nums">{openCount}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs text-slate-500">With conflicts</p>
                                                    <p className="text-sm font-semibold tabular-nums text-amber-600">{conflictCount}</p>
                                                </div>
                                            </div>

                                            <details className="group border-t border-slate-100">
                                                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200 [&::-webkit-details-marker]:hidden">
                                                    <Search aria-hidden="true" className="h-4 w-4 text-slate-500" />
                                                    <span>Search pull requests</span>
                                                    {pullRequestSearch.trim() && (
                                                        <span className="truncate text-xs font-normal text-slate-500">
                                                            {pullRequestSearchFieldLabels[pullRequestSearchField]}: {pullRequestSearch.trim()}
                                                        </span>
                                                    )}
                                                    <ChevronDown aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                                                </summary>
                                                <div className="border-t border-slate-100 p-3">
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <label className="sr-only" htmlFor="pull-request-search-field">
                                                            Search field
                                                        </label>
                                                        <div className="relative sm:w-40 sm:shrink-0">
                                                            <select
                                                                id="pull-request-search-field"
                                                                value={pullRequestSearchField}
                                                                onChange={(event) => {
                                                                    const value = event.target.value;
                                                                    if (isPullRequestSearchField(value)) {
                                                                        setPullRequestSearchField(value);
                                                                    }
                                                                }}
                                                                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/70 px-3 pr-9 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                                            >
                                                                <option value="prNumber">PR number</option>
                                                                <option value="title">Title</option>
                                                                <option value="author.login">Author</option>
                                                            </select>
                                                            <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                        </div>
                                                        <label className="sr-only" htmlFor="pull-request-search">
                                                            Search tracked pull requests
                                                        </label>
                                                        <div className="relative min-w-0 flex-1">
                                                            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                id="pull-request-search"
                                                                type="search"
                                                                value={pullRequestSearch}
                                                                onChange={(event) => setPullRequestSearch(event.target.value)}
                                                                placeholder={`Search by ${pullRequestSearchFieldLabels[pullRequestSearchField].toLocaleLowerCase()}…`}
                                                                className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-right text-xs text-slate-500">
                                                        Showing {filteredPullRequests.length} of {pullRequests.length} pull requests
                                                    </p>
                                                </div>
                                            </details>
                                        </div>

                                        {pullRequests.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                                                <h3 className="font-semibold">No tracked pull requests</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Tracked pull requests for this repository will appear here.
                                                </p>
                                            </div>
                                        ) : filteredPullRequests.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                                <h3 className="font-semibold">No matching pull requests</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Try another search term or choose a different field.
                                                </p>
                                            </div>
                                        ) : (
                                            <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200">
                                                {filteredPullRequests.map((pr) => {
                                                    const hasConflicts = conflictingPRIds.has(pr._id);

                                                    return (
                                                        <li
                                                            key={pr._id}
                                                            className="group bg-white px-3 py-2.5 transition-colors hover:bg-slate-50"
                                                        >
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
                                                                        <div className="flex min-w-0 items-center gap-2">
                                                                            <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
                                                                                #{pr.prNumber}
                                                                            </span>
                                                                            <Link
                                                                                href={pr.htmlUrl}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="line-clamp-1 text-sm font-medium text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-[15px]"
                                                                            >
                                                                                {pr.title}
                                                                            </Link>
                                                                        </div>
                                                                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${pr.state === "open"
                                                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"
                                                                                : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                                                                }`}>
                                                                                <span aria-hidden="true" className={`h-1 w-1 rounded-full ${pr.state === "open" ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                                                {pr.state}
                                                                            </span>
                                                                            {pr.isDraft && (
                                                                                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                                                                                    Draft
                                                                                </span>
                                                                            )}
                                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasConflicts
                                                                                ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
                                                                                : "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200"
                                                                                }`}>
                                                                                <span aria-hidden="true" className={`h-1 w-1 rounded-full ${hasConflicts ? "bg-amber-500" : "bg-slate-400"}`} />
                                                                                {hasConflicts ? "Conflicts found" : pr.conflictState === 'unknown' ? "Not checked" : "No conflicts"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-4 text-slate-500">
                                                                        <Link href={pr.author.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-700 underline underline-offset-2 hover:text-indigo-600">
                                                                            @{pr.author.login}
                                                                        </Link>
                                                                        <span> wants to merge into </span>
                                                                        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{pr.baseBranch}</code>
                                                                        <span> from </span>
                                                                        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{pr.headBranch}</code>
                                                                    </p>
                                                                </div>

                                                                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:justify-end sm:border-0 sm:pt-0">
                                                                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-500">
                                                                        <CalendarClock aria-hidden="true" className="h-3 w-3 text-slate-400" />
                                                                        Updated {new Date(pr.githubUpdatedAt).toLocaleDateString()}
                                                                    </span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 min-w-16 rounded-lg border-slate-200 px-2.5 text-[11px] transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                                        onClick={() => setSelectedPullRequest(pr)}
                                                                    >
                                                                        Details
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </section>
                                </TabsContent>

                                <TabsContent value="activity">
                                    <ActivityList
                                        title="Repository activity"
                                        description="Events affecting this repository."
                                        emptyTitle="No repository activity yet "
                                        emptyDescription="Repository events will appear here as they happen."
                                        variant="repository"
                                        githubInstallationId={installationId}
                                        repositoryId={repositoryId}
                                    />
                                </TabsContent>

                                <TabsContent value="untracked-pull-requests">
                                    <section aria-labelledby="untracked-pull-requests-heading">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h2 id="untracked-pull-requests-heading" className="text-xl font-semibold">
                                                    Untracked open pull requests
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Open pull requests in this repository that RepoProbe is not tracking yet.
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                                                {untrackedOpenPRs.length} {untrackedOpenPRs.length === 1 ? "pull request" : "pull requests"}
                                            </span>
                                        </div>

                                        {!repositoryData.permissions.triage && (
                                            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                Triage permission is required to track pull requests in this repository.
                                            </p>
                                        )}

                                        {!isLoadingUntrackedOpenPRs && !untrackedOpenPRsError && untrackedOpenPRs.length > 0 && (
                                            <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                                <div className="relative p-3">
                                                    <label className="sr-only" htmlFor="untracked-pull-request-search">
                                                        Search untracked pull requests
                                                    </label>
                                                    <div className="relative">
                                                        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            id="untracked-pull-request-search"
                                                            type="search"
                                                            value={untrackedPRSearch}
                                                            onChange={(event) => setUntrackedPRSearch(event.target.value)}
                                                            placeholder="Search by PR number or title…"
                                                            className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-right text-xs text-slate-500">
                                                        Showing {filteredUntrackedOpenPRs.length} of {untrackedOpenPRs.length} pull requests
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {isLoadingUntrackedOpenPRs ? (
                                            <div role="status" className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                                                Loading untracked pull requests…
                                            </div>
                                        ) : untrackedOpenPRsError ? (
                                            <div role="alert" className="rounded-xl border border-red-200 bg-white px-6 py-8 text-center">
                                                <p className="text-sm text-red-700">{untrackedOpenPRsError}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => fetchUntrackedOpenPRs()}
                                                >
                                                    Try again
                                                </Button>
                                            </div>
                                        ) : untrackedOpenPRs.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                                                <h3 className="font-semibold">No untracked pull requests</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    All open pull requests in this repository are being tracked.
                                                </p>
                                            </div>
                                        ) : filteredUntrackedOpenPRs.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                                <h3 className="font-semibold">No matching pull requests</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Try another PR number or title.
                                                </p>
                                            </div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {filteredUntrackedOpenPRs.map((pr) => (
                                                    <li
                                                        key={pr.githubId}
                                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                                                            <div className="min-w-0 flex-1">
                                                                <Link
                                                                    href={pr.htmlUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-indigo-600"
                                                                >
                                                                    #{pr.prNumber} {pr.title}
                                                                </Link>
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Updated {new Date(pr.updatedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 shrink-0 px-3 text-xs cursor-pointer"
                                                                disabled={!repositoryData.permissions.triage || trackingUntrackedPRNumber !== null}
                                                                title={!repositoryData.permissions.triage ? "Triage permission is required to track pull requests." : undefined}
                                                                onClick={() => handleTrackUntrackedPR(pr.prNumber)}
                                                            >
                                                                {trackingUntrackedPRNumber === pr.prNumber ? "Tracking…" : "Track"}
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                </TabsContent>
                            </Tabs>
                        </>
                    ) : null}
                </div>
            </main>

            <Sheet
                open={Boolean(repositoryData && selectedPullRequest)}
                onOpenChange={(open) => {
                    if (!open) setSelectedPullRequest(null);
                }}
            >
                {repositoryData && selectedPullRequest && (
                    <SheetContent className="w-full data-[side=right]:w-full gap-0 overflow-hidden border-l border-slate-200 bg-white p-0 sm:max-w-xl data-[side=right]:sm:max-w-xl">
                        <Tabs defaultValue="details" className="min-h-0 flex-1 flex-col gap-0">
                            <SheetHeader className="gap-3 border-b border-slate-100 px-5 pt-6 pb-4 sm:px-6">
                                <div className="flex flex-wrap items-center gap-2 pr-8">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                        PR #{selectedPullRequest.prNumber}
                                    </span>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${selectedPullRequest.state === "open"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : selectedPullRequest.state === "merged"
                                            ? "bg-violet-50 text-violet-700"
                                            : "bg-slate-100 text-slate-600"
                                        }`}>
                                        {selectedPullRequest.state}
                                    </span>
                                    {selectedPullRequest.isDraft && (
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                            Draft
                                        </span>
                                    )}
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedPullRequest.isTracked
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "bg-slate-100 text-slate-600"
                                        }`}>
                                        {selectedPullRequest.isTracked ? "Tracked" : "Not tracked"}
                                    </span>
                                </div>
                                <div>
                                    <SheetTitle className="pr-8 text-lg leading-snug font-semibold tracking-tight sm:text-xl">
                                        {selectedPullRequest.title}
                                    </SheetTitle>
                                    <SheetDescription className="wrap-break-word">
                                        {repository?.fullName ?? "Pull request details"}
                                    </SheetDescription>
                                </div>
                                <TabsList
                                    variant="line"
                                    aria-label="Pull request views"
                                    className="mt-1 grid h-8 w-full shrink-0 grid-cols-2 gap-0"
                                >
                                    <TabsTrigger value="details" className="w-full px-4 text-xs">Details</TabsTrigger>
                                    <TabsTrigger value="activity" className="w-full px-4 text-xs">Activity</TabsTrigger>
                                </TabsList>
                            </SheetHeader>
                            <TabsContent value="details" className="pr-sheet-scroll min-h-0 overflow-y-auto px-5 py-4 sm:px-6">
                                <div className="space-y-5">
                                    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                        <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Branches</h3>
                                        <p className="mt-2 text-sm text-slate-600">
                                            <Link
                                                href={selectedPullRequest.author.githubUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-indigo-700 hover:underline"
                                            >
                                                @{selectedPullRequest.author.login}
                                            </Link>
                                            {" "}wants to merge
                                        </p>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                                            <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                <p className="text-[0.65rem] font-semibold tracking-wide text-slate-400 uppercase">Into base</p>
                                                <code className="mt-1 block break-all text-xs text-slate-800">{selectedPullRequest.baseBranch}</code>
                                            </div>
                                            <span aria-hidden="true" className="hidden text-slate-400 sm:block">←</span>
                                            <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                <p className="text-[0.65rem] font-semibold tracking-wide text-slate-400 uppercase">From compare</p>
                                                <code className="mt-1 block break-all text-xs text-slate-800">{selectedPullRequest.headBranch}</code>
                                            </div>
                                        </div>
                                    </section>

                                    <dl className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Author</dt>
                                            <dd className="mt-1.5 text-sm font-medium text-slate-900">
                                                <Link
                                                    href={selectedPullRequest.author.githubUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="hover:text-indigo-700 hover:underline"
                                                >
                                                    {selectedPullRequest.author.login}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Last updated</dt>
                                            <dd className="mt-1.5 text-sm text-slate-900">
                                                <time dateTime={new Date(selectedPullRequest.githubUpdatedAt).toISOString()}>
                                                    {new Date(selectedPullRequest.githubUpdatedAt).toLocaleString()}
                                                </time>
                                            </dd>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Processing</dt>
                                            <dd className="mt-1.5 text-sm font-medium capitalize text-slate-900">
                                                {selectedPullRequest.processingStatus}
                                            </dd>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Conflict status</dt>
                                            <dd className="mt-1.5 text-sm font-medium text-slate-900">
                                                {selectedPullRequest.conflictState === "conflicts_found"
                                                    ? "Conflicts found"
                                                    : selectedPullRequest.conflictState === "no_conflicts"
                                                        ? "No conflicts"
                                                        : "Not checked"}
                                            </dd>
                                        </div>
                                    </dl>

                                    {selectedPullRequest.labels.length > 0 && (
                                        <section>
                                            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Labels</h3>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selectedPullRequest.labels.map((label) => (
                                                    <span key={label.id} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                                        {label.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {selectedPullRequest.assignees.length > 0 && (
                                        <section>
                                            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Assignees</h3>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selectedPullRequest.assignees.map((assignee) => (
                                                    <Link
                                                        key={assignee.id}
                                                        href={assignee.githubUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                                    >
                                                        @{assignee.login}
                                                    </Link>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/*
                                        - Show warning when 'Scan Conflict' button is visible and the pull request is conflicting as secondary PR (prBId)
                                        - Condition: conflictingPrIds has the selected PR id + same condition as 'Scan Conflict' button visibility + visibility permissions handled at
                                            the prop level of the banner component.
                                    */}
                                    {selectedPullRequest.isTracked && conflictingPRIds.has(selectedPullRequest._id) && ['completed', 'error'].includes(selectedPullRequest.processingStatus) && selectedPullRequest.conflictState !== 'conflicts_found' && (
                                        <Banner
                                            variant="warning"
                                            title="Conflicts detected with another pull request"
                                            description={repositoryData?.permissions?.push
                                                ? "Run a conflict scan to refresh the details and review the conflicting changes."
                                                : "A conflict has been detected. Ask someone with repository write access to run a scan and review the details."}
                                        />
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="activity" className="pr-sheet-scroll min-h-0 overflow-y-auto px-3 py-4 sm:px-4">
                                <ActivityList
                                    key={selectedPullRequest._id}
                                    title="Pull request activity"
                                    description="Events related to this pull request."
                                    emptyTitle="No pull request activity yet"
                                    emptyDescription="Events for this pull request will appear here as they happen."
                                    variant="pullrequest"
                                    githubInstallationId={installationId}
                                    repositoryId={repositoryId}
                                    pullRequestId={selectedPullRequest._id}
                                />
                            </TabsContent>
                        </Tabs>
                        <SheetFooter className="mt-0 shrink-0 gap-0 bg-slate-50/70 p-0">
                            <div className="flex w-full flex-wrap border-l border-t border-slate-200">
                                <Link
                                    href={selectedPullRequest.htmlUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 basis-1/2 items-center justify-center gap-2 border-r border-b border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    Open on GitHub
                                    <ExternalLink aria-hidden="true" className="size-3.5" />
                                </Link>
                                {selectedPullRequest.state === 'open' && (
                                    <>
                                        {repositoryData?.permissions?.triage && !selectedPullRequest.isTracked && (
                                            <Button size="sm" className="h-10 min-w-0 shrink flex-[1_1_25%] cursor-pointer whitespace-normal rounded-none border-0 border-r border-b border-slate-200 bg-indigo-50 px-2 text-center leading-tight text-indigo-800 hover:bg-indigo-100" onClick={handleTrackPR}>Track</Button>
                                        )}
                                        {repositoryData?.permissions?.triage && selectedPullRequest.isTracked && (
                                            <Button size="sm" className="h-10 min-w-0 shrink flex-[1_1_25%] cursor-pointer whitespace-normal rounded-none border-0 border-r border-b border-slate-200 bg-slate-50 px-2 text-center leading-tight text-slate-700 hover:bg-slate-100" variant="outline" onClick={handleUntrackPR}>Untrack</Button>
                                        )}
                                        {repositoryData?.permissions?.push && selectedPullRequest.isTracked && ['completed', 'error'].includes(selectedPullRequest.processingStatus) && (
                                            <Button size="sm" className="h-10 min-w-0 shrink flex-[1_1_25%] cursor-pointer whitespace-normal rounded-none border-0 border-r border-b border-slate-200 bg-sky-50 px-2 text-center leading-tight text-sky-800 hover:bg-sky-100" variant="outline" onClick={handleSyncPR}>Sync</Button>
                                        )}
                                        {repositoryData?.permissions?.push && selectedPullRequest.isTracked && ['completed', 'error'].includes(selectedPullRequest.processingStatus) && selectedPullRequest.conflictState !== 'conflicts_found' && (
                                            <Button size="sm" className="h-10 min-w-0 shrink flex-[1_1_25%] cursor-pointer whitespace-normal rounded-none border-0 border-r border-b border-slate-200 bg-amber-100 px-2 text-center leading-tight text-amber-900 hover:bg-amber-200" onClick={handleScanPRConflicts}>Scan conflicts</Button>
                                        )}
                                        {repositoryData?.permissions?.push && selectedPullRequest.conflictState === 'conflicts_found' && (
                                            <Button size="sm" className="h-10 min-w-0 shrink flex-[1_1_25%] cursor-pointer whitespace-normal rounded-none border-0 border-r border-b border-slate-200 bg-violet-50 px-2 text-center leading-tight text-violet-800 hover:bg-violet-100" onClick={handleViewConflicts}>View conflicts</Button>
                                        )}
                                        {repositoryData?.permissions?.push && selectedPullRequest.processingStatus === 'error' && (
                                            <Button size="sm" className="h-10 min-w-0 shrink flex-[1_1_25%] cursor-pointer whitespace-normal rounded-none border-0 border-r border-b border-slate-200 bg-red-50 px-2 text-center leading-tight text-red-800 hover:bg-red-100" variant="outline" onClick={handleRetryProcessing}>Retry processing</Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </SheetFooter>
                    </SheetContent>
                )}
            </Sheet>

            <Dialog open={isConflictDialogOpen && !!repositoryData} onOpenChange={setIsConflictDialogOpen}>
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
        </div>
    );
}
