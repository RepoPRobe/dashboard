import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

type CollapsibleProps = {
    label: string;
    children: React.ReactNode;
    onClick?: () => void;
}

export default function Collapsible({ label, children, onClick }: CollapsibleProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className="border border-slate-200 rounded-md">
            <button
                type="button"
                aria-expanded={isExpanded}
                className={`sticky top-0 z-20 flex w-full gap-1 items-center cursor-pointer rounded-t-md bg-slate-50 p-2 text-left ${isExpanded ? 'border-b border-slate-200' : ''}`}
                onClick={() => {
                    setIsExpanded(prev => !prev);
                    onClick?.();
                }}
            >
                <span>
                    {isExpanded ? (
                        <ChevronDown className="text-slate-400 h-4 w-4" />
                    ) : (
                        <ChevronRight className="text-slate-400 h-4 w-4" />
                    )}
                </span>
                <code className="text-xs">{label}</code>
            </button>

            {isExpanded && (
                <div>
                    {children}
                </div>
            )}
        </div>
    )
}