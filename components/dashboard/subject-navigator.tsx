"use client";

import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/app";

interface SubjectNavigatorProps {
    subjects: Subject[];
    selected: string | null;
    onSelect: (subjectId: string) => void;
}

export function SubjectNavigator({ subjects, selected, onSelect }: SubjectNavigatorProps) {
    return (
        <>
            <aside className="hidden w-64 shrink-0 lg:block">
                <div className="glass sticky top-55 rounded-xl p-3">
                    <p className="mb-2 px-2 text-xs uppercase tracking-[0.22em] text-muted">Subjects</p>
                    <div className="space-y-2">
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                onClick={() => onSelect(subject.id)}
                                className={cn(
                                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                                    selected === subject.id
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-line bg-card text-foreground hover:border-line-strong",
                                )}
                            >
                                <p className="font-semibold">{subject.name}</p>
                                <p className="text-xs text-muted">{subject.code}</p>
                            </button>
                        ))}
                        {subjects.length === 0 && (
                            <p className="rounded-md border border-line bg-card px-3 py-2 text-xs text-muted">
                                No subjects yet. Add subjects from room settings.
                            </p>
                        )}
                    </div>
                </div>
            </aside>

            <div className="lg:hidden">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                    <BookMarked className="h-3.5 w-3.5" />
                    Subject Navigator
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {subjects.map((subject) => (
                        <button
                            key={subject.id}
                            onClick={() => onSelect(subject.id)}
                            className={cn(
                                "rounded-lg border p-2 text-left",
                                selected === subject.id
                                    ? "border-primary bg-primary/10"
                                    : "border-line bg-card",
                            )}
                        >
                            <p className="text-sm font-semibold text-foreground">{subject.name}</p>
                            <p className="text-[11px] text-muted">{subject.code}</p>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
