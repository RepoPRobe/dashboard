import { formatActivityDate } from "@/lib/date";
import ActivityCollapsible from "./ui/activity-collapsible";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type ActivityLog = {
    _id: string;
    installationId: string;
    repoId?: string | {
        _id: string,
        githubFullName: string,
    };
    pullRequestId?: string;
    parentLogId?: string;
    event: string;
    status: 'info' | 'success' | 'warning' | 'error';
    message: string;
    metadata?: Record<string, any>;
    createdAt: string;
    childLogs?: ActivityLog[];
};

type ActivityListProps = {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    variant: 'installation' | 'repository' | 'pullrequest';
    githubInstallationId: string;
    repositoryId?: string;
    pullRequestId?: string;
};

const statusClasses: Record<ActivityLog['status'], string> = {
    info: "bg-sky-50 text-sky-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
};

function ActivityLogItem({ log, depth = 0 }: { log: ActivityLog; depth?: number }) {
    return (
        <li>
            <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${depth > 0 ? "gap-1 px-2.5 py-1.5" : "gap-1.5 p-3"}`}>
                <div className="min-w-0">
                    <div className={`${depth > 0 ? "mb-0.5 gap-1" : "mb-1 gap-1.5"} flex flex-wrap items-center`}>
                        <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${depth > 0 ? "text-[0.65rem]" : "text-[0.7rem]"} ${statusClasses[log.status]}`}>
                            {log.status}
                        </span>
                        <span className={`font-medium text-slate-500 uppercase ${depth > 0 ? "text-[0.65rem]" : "text-[0.7rem]"}`}>{log.event.replaceAll('_', ' ').replaceAll('.', ' ')}</span>
                        {typeof log.repoId === "object" && log.repoId !== null && (
                            <span className={`rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 ${depth > 0 ? "text-[0.6rem]" : "text-[0.65rem]"}`}>
                                {log.repoId.githubFullName}
                            </span>
                        )}
                    </div>
                    <p className={`text-slate-900 ${depth > 0 ? "text-xs" : "text-[0.8125rem]"}`}>{log.message}</p>
                </div>
                <time
                    dateTime={log.createdAt}
                    className={`shrink-0 text-slate-500 ${depth > 0 ? "text-[0.65rem]" : "text-[0.7rem]"}`}
                >
                    {formatActivityDate(log.createdAt)}
                </time>
            </div>

            {log.childLogs && log.childLogs.length > 0 && (
                <ActivityCollapsible
                    label={`Show ${log.childLogs.length} related ${log.childLogs.length === 1 ? "event" : "events"}`}
                >
                    <ol className="divide-y divide-slate-200/70">
                        {log.childLogs.map((childLog) => (
                            <ActivityLogItem key={childLog._id} log={childLog} depth={depth + 1} />
                        ))}
                    </ol>
                </ActivityCollapsible>
            )}
        </li>
    );
}

export default function ActivityList({
    title,
    description,
    emptyTitle,
    emptyDescription,
    variant,
    githubInstallationId,
    repositoryId,
    pullRequestId
}: ActivityListProps) {
    const isPullRequestActivity = variant === 'pullrequest';
    const session = useSession();
    const token = session.data?.repoProbeAuthToken;

    const [activityResult, setActivityResult] = useState<{
        installationId: string;
        token: string;
        logs?: ActivityLog[];
        error?: string;
    } | null>(null);

    const currentActivityResult = session.status === 'authenticated' && token && activityResult
        && activityResult.installationId === githubInstallationId && activityResult.token === token
        ? activityResult
        : null;
    const activityError = currentActivityResult?.error
        || (session.status === 'unauthenticated' ? "Sign in to view activity logs." : "")
        || (session.status === 'authenticated' && !token ? "Authentication token is unavailable." : "");
    const activityLoading = session.status === 'loading'
        || (session.status === 'authenticated' && !!token && !currentActivityResult);

    useEffect(() => {
        if (session.status !== 'authenticated') return;
        if (!githubInstallationId) return;

        const token = session.data?.repoProbeAuthToken;
        if (!token) return;

        let cancelled = false;

        (async () => {
            try {
                const query = new URLSearchParams({ installationId: githubInstallationId });
                if(variant !== 'installation' && repositoryId) {
                    query.append('repoId', repositoryId);
                }
                if(variant === 'pullrequest' && pullRequestId) {
                    query.append('prId', pullRequestId);
                }
                
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_URL}/activity-logs?${query.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const parsed = await response.json();
                if (!response.ok || !parsed.success || !Array.isArray(parsed.logs)) {
                    throw new Error(parsed.message || "Unable to load activity logs.");
                }

                if (!cancelled) {
                    setActivityResult({
                        installationId: githubInstallationId,
                        token,
                        logs: parsed.logs,
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    setActivityResult({
                        installationId: githubInstallationId,
                        token,
                        error: error instanceof Error ? error.message : "Unable to load activity logs.",
                    });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [githubInstallationId, session.status, session.data?.repoProbeAuthToken]);

    return (
        <section aria-label={title}>
            <div className={`flex items-center justify-between ${isPullRequestActivity ? "mb-3" : "mb-4"}`}>
                <div>
                    <h2 className={`font-semibold ${isPullRequestActivity ? "text-lg" : "text-xl"}`}>{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
                <span className={`shrink-0 rounded-full bg-indigo-100 font-medium text-indigo-700 ${isPullRequestActivity ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}>
                    {activityResult?.logs?.length} {activityResult?.logs?.length === 1 ? "event" : "events"}
                </span>
            </div>

            {activityError ? (
                <div role="alert" className={`text-center text-sm text-red-700 ${isPullRequestActivity ? "border-y border-red-200 py-6" : "rounded-md border border-red-200 bg-white px-6 py-8 shadow-sm"}`}>
                    {activityError}
                </div>
            ) : activityLoading ? (
                <div className={`text-center text-sm text-slate-500 ${isPullRequestActivity ? "border-y border-slate-200 py-8" : "rounded-md border border-slate-200 bg-white px-6 py-12 shadow-sm"}`}>
                    Loading activity…
                </div>
            ) : activityResult?.logs?.length === 0 ? (
                <div className={`text-center ${isPullRequestActivity ? "border-y border-dashed border-slate-300 py-8" : "rounded-md border border-dashed border-slate-300 bg-white px-6 py-12"}`}>
                    <h3 className="font-semibold">{emptyTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
                </div>
            ) : (
                <ol className={isPullRequestActivity
                    ? "divide-y divide-slate-100 border-y border-slate-200"
                    : "divide-y divide-slate-100 rounded-md border border-slate-200 bg-white shadow-sm"}>
                    {activityResult?.logs?.map((log) => (
                        <ActivityLogItem key={log._id} log={log} />
                    ))}
                </ol>
            )}
        </section>
    );
}
