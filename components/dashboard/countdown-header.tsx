"use client";

import { AlertTriangle, Timer } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_COUNTDOWN_TARGET = new Date(Date.now() + THIRTY_DAYS_IN_MS).toISOString();

function TimeCell({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex min-w-18 flex-col items-center rounded-lg border border-line bg-card p-2">
            <span className="font-heading text-2xl text-primary sm:text-3xl">{value.toString().padStart(2, "0")}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
        </div>
    );
}

interface CountdownHeaderProps {
    examDate: string | null;
    roomName: string;
}

export function CountdownHeader({ examDate, roomName }: CountdownHeaderProps) {
    const targetDate = examDate ?? DEFAULT_COUNTDOWN_TARGET;
    const { days, hours, minutes, seconds, isUrgent } = useCountdown(targetDate);

    return (
        <section className="sticky top-15.25 z-30 border-b border-line bg-background/95 py-3 backdrop-blur">
            <div className="mx-auto flex w-full max-w-400 flex-col gap-3 px-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted sm:text-sm">
                        <Timer className="h-4 w-4 text-primary" />
                        {roomName} Countdown Target
                    </div>
                    {isUrgent && (
                        <span className="animate-pulse rounded-md border border-danger/60 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">
                            Critical Week
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <TimeCell label="Days" value={days} />
                    <TimeCell label="Hours" value={hours} />
                    <TimeCell label="Minutes" value={minutes} />
                    <TimeCell label="Seconds" value={seconds} />
                </div>

                {isUrgent && (
                    <div className="flex items-center gap-2 rounded-lg border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
                        <AlertTriangle className="h-4 w-4" />
                        Less than 7 days remaining. Escalate daily target and lock distractions.
                    </div>
                )}
            </div>
        </section>
    );
}
