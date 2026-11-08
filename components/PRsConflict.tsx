import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronRight, GitPullRequest } from "lucide-react";
import { useId, useMemo, useState } from "react";
import ConflictFileCollapsible from "./ui/conflict-file-collapsible";
import { buildVirtualTable, LineContainingHunk } from "@/lib/conflicts";

interface LineType {
    type: 'context' | 'added' | 'removed';
    oldFileLineNumber?: number | null;
    newFileLineNumber?: number | null;
    content: string;
}

interface HunkType {
    oldFileStartLine: number;
    oldFilePatchLinesCount: number;
    newFileStartLine: number;
    newFilePatchLinesCount: number;
    lines: LineType[];
}

interface PullRequestFileType {
    _id: string;
    pullRequestId: string;
    file: string;
    previousFilePath?: string | null;
    status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
    hunks: HunkType[];
    createdAt: Date;
    updatedAt: Date;
}

type PullRequestType = {
    _id: string;
    title: string;
    prNumber: string;
    htmlUrl: string;
}

type PRsConflictType = {
    conflicts: ConflictType[]
}

type ConflictType = {
    file: string;
    prAId: string;
    prBId: string;
    conflictingLineNumbers: {
        removed: number[];
        added: number[];
    };
    prAFile: PullRequestFileType;
    prBFile: PullRequestFileType;
    prA: PullRequestType;
    prB: PullRequestType;
}

export default function PRsConflicts({ conflicts }: PRsConflictType) {
    if (conflicts.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center text-sm">
                <GitPullRequest className="mx-auto mb-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                <p className="font-medium text-slate-700">No file conflicts to display</p>
                <p className="mt-1 text-xs text-slate-500">There are no conflicting files in this pull request.</p>
            </div>
        );
    }

    const conflictsByPR: Record<string, ConflictType[]> = {};
    conflicts.forEach((conflict) => {
        if (!(conflict.prBId in conflictsByPR)) {
            conflictsByPR[conflict.prBId] = [];
        }
        conflictsByPR[conflict.prBId].push(conflict);
    });
    const pullRequestGroups = Object.entries(conflictsByPR);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Conflicting pull requests
                </h3>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                    {pullRequestGroups.length}
                </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-200">
                {pullRequestGroups.map(([prBId, prConflicts]) => (
                    <ConflictPullRequestGroup
                        key={prBId}
                        conflicts={prConflicts}
                    />
                ))}
            </div>
        </div>
    );
}

function ConflictPullRequestGroup({ conflicts }: { conflicts: ConflictType[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const pullRequest = conflicts[0].prB;

    return (
        <section
            aria-label={`Conflicts for pull request #${pullRequest.prNumber}`}
            className="min-w-0"
        >
            <header className={`flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-indigo-50/70 ${isExpanded ? "border-b border-slate-200 bg-indigo-50/40" : "bg-slate-50/80"}`}>
                <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} conflicts for pull request #${pullRequest.prNumber}`}
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-indigo-100 bg-white text-indigo-600">
                        <GitPullRequest className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-800">
                            {pullRequest.title}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] text-slate-500">
                            Pull request #{pullRequest.prNumber}
                        </span>
                    </span>
                    <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[0.6875rem] font-medium tabular-nums text-slate-600">
                        {conflicts.length} {conflicts.length === 1 ? "file" : "files"}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-400">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        )}
                    </span>
                </button>
                <Link
                    href={pullRequest.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open pull request #${pullRequest.prNumber} on GitHub`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </header>
            {isExpanded && (
                <div className="w-full min-w-0 bg-white">
                    <div className="w-full min-w-0 border-l-0 divide-y divide-slate-200">
                        {conflicts.map((conflict) => (
                            <ConflictFile
                                key={`${conflict.prAId}-${conflict.prBId}-${conflict.file}`}
                                conflict={conflict}
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

function ConflictFile({ conflict }: { conflict: ConflictType }) {
    const [aVersion, setAVersion] = useState<'old' | 'new'>('new');
    const [bVersion, setBVersion] = useState<'old' | 'new'>('new');
    const rows = useMemo(
        () => buildVirtualTable(conflict.prAFile.hunks, conflict.prBFile.hunks, aVersion, bVersion),
        [conflict.prAFile.hunks, conflict.prBFile.hunks, aVersion, bVersion],
    );

    return (
        <ConflictFileCollapsible label={conflict.file}>
            <div className="w-full min-w-0 overflow-x-auto">
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <PullRequestHeader
                        pullRequest={conflict.prA}
                        status={conflict.prAFile.status}
                        current
                        version={aVersion}
                        onVersionChange={setAVersion}
                    />
                    <PullRequestHeader
                        pullRequest={conflict.prB}
                        status={conflict.prBFile.status}
                        version={bVersion}
                        onVersionChange={setBVersion}
                    />
                </div>

                <div className="divide-y divide-slate-100">
                    {rows.length > 0 ? rows.map((row, index) => (
                        <div key={index}>
                            {(row.aLine?.hunk || row.bLine?.hunk) && (
                                <div className="grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[0.6875rem] text-slate-500">
                                    <div>{row.aLine?.hunk ? formatHunkHeader(row.aLine.hunk) : null}</div>
                                    <div className="pl-3">{row.bLine?.hunk ? formatHunkHeader(row.bLine.hunk) : null}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 divide-x divide-slate-200">
                                <PRConflictLine
                                    line={row.aLine}
                                    conflictingLineNumbers={conflict.conflictingLineNumbers}
                                />
                                <PRConflictLine
                                    line={row.bLine}
                                    conflictingLineNumbers={conflict.conflictingLineNumbers}
                                />
                            </div>
                        </div>
                    )) : (
                        <p className="px-4 py-6 text-center text-xs text-slate-500">
                            No diff lines are available for this file.
                        </p>
                    )}
                </div>
            </div>
        </ConflictFileCollapsible>
    );
}

function formatHunkHeader(hunk: NonNullable<LineContainingHunk['hunk']>) {
    return `@@ -${hunk.oldFileStartLine}, ${hunk.oldFilePatchLinesCount} +${hunk.newFileStartLine}, ${hunk.newFilePatchLinesCount} @@`;
}

function PullRequestHeader({
    pullRequest,
    status,
    current,
    version,
    onVersionChange,
}: {
    pullRequest: PullRequestType;
    status: PullRequestFileType['status'];
    current?: boolean;
    version: 'old' | 'new';
    onVersionChange: (version: 'old' | 'new') => void;
}) {
    const versionSelectId = useId();

    return (
        <div className="flex min-w-0 items-center gap-2 bg-slate-50 px-3 py-2">
            <Link
                className="group flex min-w-0 flex-1 items-center gap-3 py-1 transition-colors"
                href={pullRequest.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
                    <GitPullRequest className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                    {current ? (
                        <>
                            <span className="block truncate text-xs font-medium text-slate-800">Current Pull Request</span>
                            <span className="mt-0.5 block text-[0.6875rem] text-slate-500">#{pullRequest.prNumber}</span>
                        </>
                    ) : (
                        <>
                            <span className="block truncate text-xs font-medium text-slate-800 group-hover:text-slate-950">
                                {pullRequest.title}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-slate-500">
                                Pull request #{pullRequest.prNumber}
                            </span>
                        </>
                    )}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-slate-700" aria-hidden="true" />
            </Link>
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[0.6875rem] font-medium capitalize text-slate-600">
                {status}
            </span>
            <select
                id={versionSelectId}
                aria-label={`Version of pull request #${pullRequest.prNumber}`}
                className="h-7 max-w-28 rounded-md border border-slate-200 bg-white px-2 text-[0.6875rem] font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                value={version}
                onChange={(event) => onVersionChange(event.currentTarget.value === 'old' ? 'old' : 'new')}
            >
                <option value="old">Removed</option>
                <option value="new">Added</option>
            </select>
        </div>
    );
}

function PRConflictLine({
    line,
    conflictingLineNumbers,
}: {
    line: LineContainingHunk | null;
    conflictingLineNumbers: {
        removed: number[];
        added: number[];
    };
}) {
    if (!line) {
        return <div className="min-h-7 bg-slate-50/70" aria-hidden="true" />;
    }

    const lineNumber = line.type === 'removed' ? line.oldFileLineNumber : line.newFileLineNumber;
    const isConflicting = line.type === 'removed'
        ? conflictingLineNumbers.removed.includes(lineNumber ?? -1)
        : line.type === 'added' && conflictingLineNumbers.added.includes(lineNumber ?? -1);
    const lineStyles = isConflicting
        ? 'bg-amber-50/45 text-slate-800'
        : line.type === 'added'
            ? 'bg-emerald-50/80 text-emerald-950'
            : line.type === 'removed'
                ? 'bg-rose-50/80 text-rose-950'
                : 'bg-white text-slate-700';
    const marker = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : '';

    return (
        <div className={`grid min-h-6 grid-cols-[2.5rem_2.5rem_1.25rem_minmax(0,1fr)] items-stretch font-mono text-[0.6875rem] leading-6 ${lineStyles}`}>
            <span className="select-none border-r border-black/5 px-1 text-center text-slate-400">
                {line.type !== 'added' ? line.oldFileLineNumber ?? '' : ''}
            </span>
            <span className="select-none border-r border-black/5 px-1 text-center text-slate-400">
                {line.type !== 'removed' ? line.newFileLineNumber ?? '' : ''}
            </span>
            <span
                className={`select-none text-center font-semibold ${isConflicting ? 'text-amber-600' : 'opacity-70'}`}
                title={isConflicting ? 'Conflicting line' : undefined}
                aria-label={isConflicting ? 'Conflicting line' : undefined}
            >
                {marker}
            </span>
            <code className="min-w-0 whitespace-pre-wrap px-2 wrap-anywhere">
                {(line.type === 'context' ? line.content : line.content.slice(1)) || ' '}
            </code>
        </div>
    );
}
