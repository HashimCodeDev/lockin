"use client";

import { Award, Rocket, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GamificationPanelProps {
    totalXp: number;
    streakDays: number;
    weeklyMinutes: number;
}

export function GamificationPanel({ totalXp, streakDays, weeklyMinutes }: GamificationPanelProps) {
    const level = Math.floor(totalXp / 500) + 1;
    const xpInLevel = totalXp % 500;
    const levelProgress = (xpInLevel / 500) * 100;

    const missionProgress = Math.min((weeklyMinutes / 600) * 100, 100);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Gamification
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="rounded-lg border border-line bg-card p-3">
                    <p className="mb-1 text-xs uppercase tracking-wider text-muted">Level {level}</p>
                    <p className="mb-2 text-xl font-semibold text-foreground">{totalXp} XP</p>
                    <Progress value={levelProgress} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-line bg-card p-3 text-sm">
                        <p className="inline-flex items-center gap-1 text-muted">
                            <Award className="h-4 w-4 text-warning" /> Streak Reward
                        </p>
                        <p className="mt-1 text-lg font-semibold">{streakDays} Days</p>
                    </div>
                    <div className="rounded-lg border border-line bg-card p-3 text-sm">
                        <p className="inline-flex items-center gap-1 text-muted">
                            <Rocket className="h-4 w-4 text-primary" /> Daily Mission
                        </p>
                        <p className="mt-1 text-lg font-semibold">{Math.round(missionProgress)}%</p>
                    </div>
                </div>

                {levelProgress >= 90 && (
                    <div className="rounded-lg border border-primary/60 bg-primary/10 p-3 text-sm text-primary">
                        Milestone almost reached. Next session triggers level-up confetti.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
