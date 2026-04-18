"use client";

import { BookMarked } from "lucide-react";
import { SUBJECTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SubjectCode } from "@/types/app";

interface SubjectNavigatorProps {
    selected: SubjectCode;
    onSelect: (subject: SubjectCode) => void;
}

export function SubjectNavigator({ selected, onSelect }: SubjectNavigatorProps) {
    return (
        <>
            <aside className="hidden w-64 shrink-0 lg:block">
                <div className="glass sticky top-55 rounded-xl p-3">
                    <p className="mb-2 px-2 text-xs uppercase tracking-[0.22em] text-muted">Subjects</p>
                    <div className="space-y-2">
                        {SUBJECTS.map((subject) => (
                            <button
                                key={subject.code}
                                onClick={() => onSelect(subject.code)}
                                className={cn(
                                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                                    selected === subject.code
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-line bg-card text-foreground hover:border-line-strong",
                                )}
                            >
                                <p className="font-semibold">{subject.label}</p>
                                <p className="text-xs text-muted">{subject.code}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            <div className="lg:hidden">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                    <BookMarked className="h-3.5 w-3.5" />
                    Subject Navigator
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {SUBJECTS.map((subject) => (
                        <button
                            key={subject.code}
                            onClick={() => onSelect(subject.code)}
                            className={cn(
                                "rounded-lg border p-2 text-left",
                                selected === subject.code
                                    ? "border-primary bg-primary/10"
                                    : "border-line bg-card",
                            )}
                        >
                            <p className="text-sm font-semibold text-foreground">{subject.label}</p>
                            <p className="text-[11px] text-muted">{subject.code}</p>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
