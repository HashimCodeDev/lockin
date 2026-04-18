import type { Material, Profile, StudyLog, SubjectCode } from "@/types/app";

export interface LeaderboardEntry {
    user_id: string;
    username: string;
    avatar_url: string | null;
    weekly_minutes: number;
    total_xp: number;
    streak_days: number;
}

export interface SubjectStat {
    subject_code: SubjectCode;
    minutes: number;
}

export interface DailyStat {
    date: string;
    minutes: number;
}

export interface DashboardData {
    profile: Profile | null;
    logs: StudyLog[];
    materials: Material[];
    leaderboard: LeaderboardEntry[];
    subjectStats: SubjectStat[];
    dailyStats: DailyStat[];
    weeklyMinutes: number;
}
