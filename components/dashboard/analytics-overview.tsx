"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Clock3, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DailyStat, SubjectStat } from "@/types/dashboard";

interface AnalyticsOverviewProps {
    dailyStats: DailyStat[];
    subjectStats: SubjectStat[];
    weeklyMinutes: number;
}

const TARGET_WEEKLY_HOURS = 30;

export function AnalyticsOverview({
    dailyStats,
    subjectStats,
    weeklyMinutes,
}: AnalyticsOverviewProps) {
    const pieData = useMemo(
        () =>
            subjectStats.map((item) => ({
                name: item.subject_name,
                color: item.color,
                value: item.minutes,
            })),
        [subjectStats],
    );

    const progress = Math.min((weeklyMinutes / (TARGET_WEEKLY_HOURS * 60)) * 100, 100);
    const bestStudyTime = "20:00 - 22:00";

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Study Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-56 w-full">
                        <ResponsiveContainer>
                            <AreaChart data={dailyStats} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#53ff78" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#53ff78" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f3524" />
                                <XAxis dataKey="date" tick={{ fill: "#8dbb95", fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "#0b110d", border: "1px solid #2f5235" }} />
                                <Area type="monotone" dataKey="minutes" stroke="#53ff78" fill="url(#minutesGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Subject Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                        <div className="h-44 w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={70}
                                        fill="#53ff78"
                                        stroke="#1f3524"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                            {pieData.length === 0 && <p className="text-sm text-muted">No data available yet.</p>}
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between rounded-md border border-line bg-card px-3 py-2 text-sm">
                                    <span>{item.name}</span>
                                    <span className="text-muted">{(item.value / 60).toFixed(1)}h</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-line bg-card p-3">
                            <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted">
                                <Target className="h-3.5 w-3.5" /> Weekly Target
                            </p>
                            <p className="mb-2 text-xl font-semibold text-foreground">{Math.round(progress)}%</p>
                            <Progress value={progress} />
                        </div>
                        <div className="rounded-lg border border-line bg-card p-3">
                            <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted">
                                <Clock3 className="h-3.5 w-3.5" /> Best Study Time
                            </p>
                            <p className="text-xl font-semibold text-foreground">{bestStudyTime}</p>
                            <p className="text-xs text-muted">Based on your top performance windows.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
