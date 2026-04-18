import { startOfDay, subDays } from "date-fns";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard";
import type { Room, RoomMember, Subject } from "@/types/app";

class RoomAccessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RoomAccessError";
    }
}

export async function getPrimaryRoomSlug(userId: string): Promise<string | null> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data } = await supabase
        .from("room_members")
        .select("favorite,last_seen_at,rooms!inner(slug)")
        .eq("user_id", userId)
        .order("favorite", { ascending: false })
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    return (data as { rooms?: { slug?: string } | null } | null)?.rooms?.slug ?? null;
}

export async function getDashboardData(userId: string, roomSlug: string): Promise<DashboardData> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30).toISOString();
    const weekAgo = subDays(startOfDay(new Date()), 7).toISOString();

    const { data: room } = await supabase.from("rooms").select("*").eq("slug", roomSlug).maybeSingle<Room>();

    if (!room) {
        throw new RoomAccessError("Room not found");
    }

    let { data: membership } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", userId)
        .maybeSingle<RoomMember>();

    if (!membership && room.privacy === "public") {
        const { data: insertedMembership, error: joinError } = await supabase
            .from("room_members")
            .insert({
                room_id: room.id,
                user_id: userId,
                role: "member",
                last_seen_at: new Date().toISOString(),
            })
            .select("*")
            .single<RoomMember>();

        if (joinError || !insertedMembership) {
            throw new RoomAccessError("Unable to join room");
        }

        membership = insertedMembership;
    }

    if (!membership) {
        throw new RoomAccessError("Room access denied");
    }

    const [{ data: profile }, { data: roomsRaw }, { data: subjects }, { data: logsRaw }, { data: materials }, { data: leaderboardRaw }] =
        await Promise.all([
            supabase.from("profiles").select("*").eq("id", userId).single(),
            supabase
                .from("room_members")
                .select("favorite,role,last_seen_at,rooms!inner(id,slug,name)")
                .eq("user_id", userId)
                .order("favorite", { ascending: false })
                .order("last_seen_at", { ascending: false, nullsFirst: false }),
            supabase.from("subjects").select("*").eq("room_id", room.id).order("sort_order", { ascending: true }),
            supabase
                .from("study_logs")
                .select("id,room_id,user_id,subject_id,duration_minutes,notes,created_at")
                .eq("room_id", room.id)
                .gte("created_at", thirtyDaysAgo)
                .order("created_at", { ascending: false }),
            supabase
                .from("materials")
                .select("*")
                .eq("room_id", room.id)
                .order("pinned", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(100),
            supabase
                .from("room_leaderboard_weekly")
                .select("*")
                .eq("room_id", room.id)
                .order("weekly_minutes", { ascending: false })
                .order("sessions_count", { ascending: false })
                .limit(50),
        ]);

    void supabase
        .from("room_members")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("room_id", room.id)
        .eq("user_id", userId);

    const rooms = (roomsRaw ?? []).map((item: any) => {
        const roomData = item.rooms?.[0] ?? item.rooms ?? { id: "", slug: "", name: "" };

        return {
            id: roomData.id,
            slug: roomData.slug,
            name: roomData.name,
            favorite: item.favorite,
            role: item.role,
            last_seen_at: item.last_seen_at,
        };
    });

    const typedSubjects = (subjects ?? []) as Subject[];
    const logs = logsRaw ?? [];

    const subjectIndex = new Map(
        typedSubjects.map((subject) => [subject.id, { name: subject.name, color: subject.color }]),
    );

    const subjectMap = new Map<string, { subject_name: string; color: string; minutes: number }>();
    const dayMap = new Map<string, number>();

    for (const log of logs) {
        const key = log.subject_id ?? "uncategorized";
        const subjectMeta = subjectIndex.get(log.subject_id ?? "") ?? {
            name: "Uncategorized",
            color: "#64748b",
        };

        const current = subjectMap.get(key) ?? {
            subject_name: subjectMeta.name,
            color: subjectMeta.color,
            minutes: 0,
        };

        current.minutes += log.duration_minutes;
        subjectMap.set(key, current);

        const day = new Date(log.created_at).toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + log.duration_minutes);
    }

    const subjectStats = [...subjectMap.entries()].map(([subject_id, data]) => ({
        subject_id,
        subject_name: data.subject_name,
        color: data.color,
        minutes: data.minutes,
    }));

    const dailyStats = [...dayMap.entries()]
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const weeklyMinutes = logs
        .filter((item) => item.created_at >= weekAgo)
        .reduce((acc, item) => acc + item.duration_minutes, 0);

    return {
        profile: profile ?? null,
        room,
        membership,
        rooms,
        subjects: typedSubjects,
        logs,
        materials: materials ?? [],
        leaderboard: (leaderboardRaw ?? []) as LeaderboardEntry[],
        subjectStats,
        dailyStats,
        weeklyMinutes,
    };
}

export function isRoomAccessError(error: unknown): error is RoomAccessError {
    return error instanceof RoomAccessError;
}
