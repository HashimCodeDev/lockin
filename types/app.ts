export type SubjectCode =
    | "GAMAT401"
    | "PCCST402"
    | "PCCST403"
    | "PBCST404"
    | "PECCT41N"
    | "UCHUT346";

export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    total_xp: number;
    streak_days: number;
    created_at: string;
}

export interface StudyLog {
    id: string;
    user_id: string;
    subject_code: SubjectCode;
    duration_minutes: number;
    notes: string | null;
    created_at: string;
}

export interface Material {
    id: string;
    uploaded_by: string;
    subject_code: SubjectCode;
    file_url: string;
    file_name: string;
    file_size: number;
    pinned: boolean;
    created_at: string;
}

export interface Mission {
    id: string;
    title: string;
    xp_reward: number;
}
