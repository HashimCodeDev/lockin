"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { Navbar } from "@/components/dashboard/navbar";
import { SubjectNavigator } from "@/components/dashboard/subject-navigator";
import { LiveStudyTracker } from "@/components/dashboard/live-study-tracker";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview";
import { VaultPanel } from "@/components/dashboard/vault-panel";
import { FocusTools } from "@/components/dashboard/focus-tools";
import { AccountabilityPanel } from "@/components/dashboard/accountability-panel";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { GamificationPanel } from "@/components/dashboard/gamification-panel";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SUBJECTS } from "@/lib/constants";
import { usePresence } from "@/hooks/use-presence";
import { createClient } from "@/utils/supabase/client";
import type { SubjectCode } from "@/types/app";
import type { DashboardData } from "@/types/dashboard";

interface DashboardShellProps {
    data: DashboardData;
    currentUserId: string;
}

export function DashboardShell({ data, currentUserId }: DashboardShellProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedSubject, setSelectedSubject] = useState<SubjectCode>(SUBJECTS[0].code);
    const [mobileTab, setMobileTab] = useState<"overview" | "tracker" | "analytics" | "vault">("overview");
    const { activeUsers } = usePresence(currentUserId);

    const profile = data.profile;

    const notifications = useMemo(
        () => [
            {
                id: "1",
                message: "Daily reminder: lock in at least 2 focused study sessions today.",
                time: "Now",
                level: "info" as const,
            },
            {
                id: "2",
                message: "Leaderboard update: You climbed 1 position this week.",
                time: "12 min ago",
                level: "warn" as const,
            },
            {
                id: "3",
                message: "Deadline alert: revision sprint required this weekend.",
                time: "2 hrs ago",
                level: "danger" as const,
            },
        ],
        [],
    );

    const refreshData = async () => {
        startTransition(() => {
            router.refresh();
        });
    };

    const onSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/sign-in");
        toast.success("Signed out");
    };

    const attendancePercent = Math.min(Math.round((data.weeklyMinutes / 900) * 100), 100);

    return (
        <div className="grid-overlay min-h-screen pb-20 lg:pb-6">
            <Navbar username={profile?.username ?? "Cadet"} onSignOut={onSignOut} />
            <CountdownHeader />

            <main className="mx-auto flex w-full max-w-400 gap-4 px-4 py-4 sm:px-6">
                <SubjectNavigator selected={selectedSubject} onSelect={setSelectedSubject} />

                <section className="flex-1 space-y-4">
                    <div className="rounded-lg border border-line bg-card p-3 text-sm text-muted">
                        Active subject filter: <span className="text-foreground">{selectedSubject}</span>
                        {isPending && <span className="ml-2 text-primary">Syncing...</span>}
                    </div>

                    {(mobileTab === "overview" || mobileTab === "tracker") && (
                        <LiveStudyTracker
                            selectedSubject={selectedSubject}
                            onRefresh={refreshData}
                            activeUsers={Math.max(1, activeUsers)}
                        />
                    )}

                    {(mobileTab === "overview" || mobileTab === "analytics") && (
                        <AnalyticsOverview
                            dailyStats={data.dailyStats}
                            subjectStats={data.subjectStats}
                            weeklyMinutes={data.weeklyMinutes}
                        />
                    )}

                    {(mobileTab === "overview" || mobileTab === "vault") && (
                        <VaultPanel
                            selectedSubject={selectedSubject}
                            rows={data.materials}
                            currentUserId={currentUserId}
                            onRefresh={refreshData}
                        />
                    )}
                </section>

                <aside className="hidden w-87.5 shrink-0 space-y-4 xl:block">
                    <LeaderboardCard rows={data.leaderboard} currentUserId={currentUserId} />
                    <GamificationPanel
                        totalXp={profile?.total_xp ?? 0}
                        streakDays={profile?.streak_days ?? 0}
                        weeklyMinutes={data.weeklyMinutes}
                    />
                    <FocusTools />
                    <AccountabilityPanel
                        attendancePercent={attendancePercent}
                        lastActiveAt={
                            data.logs[0]?.created_at
                                ? formatDistanceToNow(new Date(data.logs[0].created_at), { addSuffix: true })
                                : "No sessions yet"
                        }
                    />
                    <NotificationsPanel notifications={notifications} />
                </aside>
            </main>

            <div className="space-y-4 px-4 pb-24 xl:hidden">
                <LeaderboardCard rows={data.leaderboard} currentUserId={currentUserId} />
                <GamificationPanel
                    totalXp={profile?.total_xp ?? 0}
                    streakDays={profile?.streak_days ?? 0}
                    weeklyMinutes={data.weeklyMinutes}
                />
                <FocusTools />
                <AccountabilityPanel
                    attendancePercent={attendancePercent}
                    lastActiveAt={
                        data.logs[0]?.created_at
                            ? formatDistanceToNow(new Date(data.logs[0].created_at), { addSuffix: true })
                            : "No sessions yet"
                    }
                />
                <NotificationsPanel notifications={notifications} />
            </div>

            <MobileNav selected={mobileTab} onSelect={setMobileTab} />
        </div>
    );
}
