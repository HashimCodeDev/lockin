import { startOfDay, subDays } from "date-fns";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard";

export async function getDashboardData(userId: string): Promise<DashboardData> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30).toISOString();
    const weekAgo = subDays(startOfDay(new Date()), 7).toISOString();

    const [{ data: profile }, { data: logs }, { data: materials }, { data: leaderboardRaw }] =
        await Promise.all([
            supabase.from("profiles").select("*").eq("id", userId).single(),
            supabase
                .from("study_logs")
                .select("*")
                .gte("created_at", thirtyDaysAgo)
                .order("created_at", { ascending: false }),
            supabase
                .from("materials")
                .select("*")
                .order("pinned", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(100),
            supabase
                .from("leaderboard_weekly")
                .select("*")
                .order("weekly_minutes", { ascending: false })
                .limit(50),
        ]);

    const leaderboard = (leaderboardRaw ?? []) as LeaderboardEntry[];
    const safeLogs = logs ?? [];

    const subjectMap = new Map<string, number>();
    const dayMap = new Map<string, number>();

    for (const log of safeLogs) {
        subjectMap.set(log.subject_code, (subjectMap.get(log.subject_code) ?? 0) + log.duration_minutes);

        const day = new Date(log.created_at).toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + log.duration_minutes);
    }

    const subjectStats = [...subjectMap.entries()].map(([subject_code, minutes]) => ({
        subject_code,
        minutes,
    }));

    const dailyStats = [...dayMap.entries()]
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const weeklyMinutes = safeLogs
        .filter((item) => item.created_at >= weekAgo)
        .reduce((acc, item) => acc + item.duration_minutes, 0);

    return {
        profile: profile ?? null,
        logs: safeLogs,
        materials: materials ?? [],
        leaderboard,
        subjectStats: subjectStats as DashboardData["subjectStats"],
        dailyStats,
        weeklyMinutes,
    };
}
