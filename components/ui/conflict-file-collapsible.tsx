import { ChevronDown, ChevronRight, FileCode2 } from "lucide-react";
import { useState } from "react";

type ConflictFileCollapsibleProps = {
    label: string;
    children: React.ReactNode;
}

export default function ConflictFileCollapsible({ label, children }: ConflictFileCollapsibleProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="w-full min-w-0 border-l-0">
            <button
                type="button"
                aria-expanded={isExpanded}
                className={`sticky top-0 z-20 flex w-full min-w-0 items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-amber-50/40 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${isExpanded ? 'border-b border-slate-200 bg-amber-50/30' : 'bg-white'}`}
                onClick={() => setIsExpanded(prev => !prev)}
            >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">
                    <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs font-medium text-slate-700">
                    {label}
                </code>
                <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-amber-700">
                    Conflict
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    )}
                </span>
            </button>

            {isExpanded && (
                <div className="bg-white">
                    {children}
                </div>
            )}
        </div>
    );
}
