import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerVariant = "info" | "success" | "warning" | "error";

type BannerProps = {
    variant?: BannerVariant;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
};

const bannerStyles: Record<BannerVariant, { container: string; icon: string; Icon: typeof Info }> = {
    info: {
        container: "border-sky-200 bg-sky-50 text-sky-950",
        icon: "text-sky-600",
        Icon: Info,
    },
    success: {
        container: "border-emerald-200 bg-emerald-50 text-emerald-950",
        icon: "text-emerald-600",
        Icon: CheckCircle2,
    },
    warning: {
        container: "border-amber-200 bg-amber-50 text-amber-950",
        icon: "text-amber-600",
        Icon: AlertTriangle,
    },
    error: {
        container: "border-red-200 bg-red-50 text-red-950",
        icon: "text-red-600",
        Icon: XCircle,
    },
};

function Banner({
    variant = "info",
    title,
    description,
    action,
    className,
}: BannerProps) {
    const { container, icon, Icon } = bannerStyles[variant];

    return (
        <div
            role={variant === "warning" || variant === "error" ? "alert" : "status"}
            className={cn("flex gap-3 rounded-xl border p-4", container, className)}
        >
            <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", icon)} />
            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed opacity-85">{description}</p>
                {action && <div className="mt-3">{action}</div>}
            </div>
        </div>
    );
}

export { Banner };
