"use client";

import { Flame, Medal, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRankTitle } from "@/lib/constants";
import type { LeaderboardEntry } from "@/types/dashboard";

interface LeaderboardCardProps {
    rows: LeaderboardEntry[];
    currentUserId: string;
}

export function LeaderboardCard({ rows, currentUserId }: LeaderboardCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    Weekly Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {rows.length === 0 && <p className="text-sm text-muted">No sessions logged this week yet.</p>}
                    {rows.map((entry, index) => {
                        const hours = entry.weekly_minutes / 60;
                        const isCurrent = entry.user_id === currentUserId;

                        return (
                            <div
                                key={entry.user_id}
                                className={`rounded-lg border p-3 ${isCurrent ? "border-primary bg-primary/10" : "border-line bg-card"
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-7 w-7 place-items-center rounded-md bg-black text-xs font-bold text-primary">
                                            #{index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{entry.username}</p>
                                            <p className="text-xs text-muted">{hours.toFixed(1)} hrs</p>
                                        </div>
                                    </div>
                                    <Badge>{getRankTitle(hours)}</Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                                    <span className="inline-flex items-center gap-1">
                                        <Medal className="h-3.5 w-3.5 text-primary" /> XP {entry.total_xp}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Flame className="h-3.5 w-3.5 text-danger" /> {entry.streak_days}d streak
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
