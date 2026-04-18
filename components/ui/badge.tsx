import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border border-line-strong bg-card px-2.5 py-1 text-xs font-semibold text-foreground",
                className,
            )}
        >
            {children}
        </span>
    );
}
