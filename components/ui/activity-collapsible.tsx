import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

type ActivityCollapsibleProps = {
    label: string;
    children: React.ReactNode;
}

export default function ActivityCollapsible({ label, children }: ActivityCollapsibleProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="w-full min-w-0">
            <button
                type="button"
                aria-expanded={isExpanded}
                className="flex items-center gap-1.5 px-3 pb-2 text-left text-xs text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                onClick={() => setIsExpanded(prev => !prev)}
            >
                {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{label}</span>
            </button>
            {isExpanded && (
                <div className="mx-3 mb-3 overflow-hidden rounded-md bg-slate-50 ring-1 ring-inset ring-slate-200">
                    {children}
                </div>
            )}
        </div>
    );
}
