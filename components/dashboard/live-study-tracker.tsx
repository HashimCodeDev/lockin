"use client";

import { useMemo, useState } from "react";
import { Play, Pause, Square, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SUBJECTS } from "@/lib/constants";
import { studySessionSchema } from "@/lib/validation";
import { useStopwatch } from "@/hooks/use-stopwatch";
import { createClient } from "@/utils/supabase/client";
import type { SubjectCode } from "@/types/app";

const XP_PER_MINUTE = 2;

interface LiveStudyTrackerProps {
    selectedSubject: SubjectCode;
    onRefresh: () => Promise<void>;
    activeUsers: number;
}

export function LiveStudyTracker({ selectedSubject, onRefresh, activeUsers }: LiveStudyTrackerProps) {
    const timer = useStopwatch();
    const [notes, setNotes] = useState("");
    const [goal, setGoal] = useState("");
    const [subject, setSubject] = useState<SubjectCode>(selectedSubject);
    const [isSaving, setIsSaving] = useState(false);

    const isValidSubject = SUBJECTS.some((item) => item.code === subject);
    const expectedXp = useMemo(
        () => Math.floor(timer.elapsedMs / 1000 / 60) * XP_PER_MINUTE,
        [timer.elapsedMs],
    );

    const saveSession = async () => {
        if (isSaving) return;

        const minutes = Math.max(1, Math.round(timer.stop() / 1000 / 60));
        const parsed = studySessionSchema.safeParse({
            subject_code: subject,
            duration_minutes: minutes,
            notes,
            goal,
        });

        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Invalid session data.");
            return;
        }

        setIsSaving(true);

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Sign in again to save sessions.");
                return;
            }

            const { error: insertError } = await supabase.from("study_logs").insert({
                user_id: user.id,
                subject_code: parsed.data.subject_code,
                duration_minutes: parsed.data.duration_minutes,
                notes: parsed.data.notes ?? null,
            });

            if (insertError) {
                toast.error(insertError.message);
                return;
            }

            const gainedXp = parsed.data.duration_minutes * XP_PER_MINUTE;
            await supabase.rpc("increment_profile_xp", {
                profile_id: user.id,
                xp_delta: gainedXp,
            });

            toast.success(`Session saved. +${gainedXp} XP secured.`);
            setNotes("");
            setGoal("");
            await onRefresh();
        } catch {
            toast.error("Unable to save session right now.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Card className="neon-ring">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span>Live Study Tracker</span>
                        <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            In The Trenches: {activeUsers} Active
                        </span>
                    </CardTitle>
                    <CardDescription>Start, pause, resume and stop tactical study sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-line-strong bg-black/60 p-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted">Session Clock</p>
                            <p className="font-heading text-4xl tracking-widest text-primary">{timer.durationText}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted">Projected XP</p>
                            <p className="text-2xl font-semibold text-foreground">{expectedXp}</p>
                        </div>
                    </div>

                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-wide text-muted">Subject</span>
                            <select
                                value={subject}
                                onChange={(event) => setSubject(event.target.value as SubjectCode)}
                                className="h-10 w-full rounded-lg border border-line bg-black/40 px-3 text-sm"
                            >
                                {SUBJECTS.map((item) => (
                                    <option key={item.code} value={item.code}>
                                        {item.label} ({item.code})
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs uppercase tracking-wide text-muted">Session Goal</span>
                            <Input
                                value={goal}
                                onChange={(event) => setGoal(event.target.value)}
                                placeholder="Finish 2 modules + revise formulas"
                            />
                        </label>
                    </div>

                    <label className="mb-4 block space-y-1">
                        <span className="text-xs uppercase tracking-wide text-muted">Session Notes (optional)</span>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-line bg-black/40 p-3 text-sm outline-none focus:border-primary"
                            placeholder="What worked, blockers, doubts to revisit..."
                        />
                    </label>

                    {!isValidSubject && (
                        <div className="mb-3 flex items-center gap-2 rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
                            <ShieldAlert className="h-4 w-4" />
                            Select a valid subject before starting.
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={timer.start} disabled={timer.isRunning || !isValidSubject}>
                            <Play className="mr-1 h-4 w-4" /> Start
                        </Button>
                        <Button variant="secondary" onClick={timer.pause} disabled={!timer.isRunning}>
                            <Pause className="mr-1 h-4 w-4" /> Pause
                        </Button>
                        <Button variant="secondary" onClick={timer.resume} disabled={timer.isRunning || timer.elapsedMs === 0}>
                            <Play className="mr-1 h-4 w-4" /> Resume
                        </Button>
                        <Button variant="danger" onClick={saveSession} disabled={timer.elapsedMs === 0 || isSaving}>
                            <Square className="mr-1 h-4 w-4" /> Stop & Save
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="fixed inset-x-0 bottom-[74px] z-40 border-y border-line bg-background/95 p-3 backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-md items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted">Live Session</p>
                        <p className="font-heading text-2xl tracking-wider text-primary">{timer.durationText}</p>
                    </div>
                    <Button size="sm" variant={timer.isRunning ? "secondary" : "default"} onClick={timer.isRunning ? timer.pause : timer.resume}>
                        <Zap className="mr-1 h-4 w-4" /> {timer.isRunning ? "Pause" : "Resume"}
                    </Button>
                </div>
            </div>
        </>
    );
}
