import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                "flex h-10 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-muted/80 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
                className,
            )}
            {...props}
        />
    );
});

Input.displayName = "Input";

export { Input };
