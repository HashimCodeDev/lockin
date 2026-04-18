import type { Material, Profile, Room, RoomMember, StudyLog, Subject } from "@/types/app";

export interface LeaderboardEntry {
    room_id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    weekly_minutes: number;
    sessions_count: number;
}

export interface SubjectStat {
    subject_id: string;
    subject_name: string;
    color: string;
    minutes: number;
}

export interface DailyStat {
    date: string;
    minutes: number;
}

export interface DashboardData {
    profile: Profile | null;
    room: Room;
    membership: RoomMember;
    rooms: Array<{
        id: string;
        slug: string;
        name: string;
        favorite: boolean;
        role: RoomMember["role"];
        last_seen_at: string | null;
    }>;
    subjects: Subject[];
    logs: StudyLog[];
    materials: Material[];
    leaderboard: LeaderboardEntry[];
    subjectStats: SubjectStat[];
    dailyStats: DailyStat[];
    weeklyMinutes: number;
}
