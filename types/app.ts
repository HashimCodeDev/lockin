export type RoomPrivacy = "public" | "private" | "invite_only";
export type RoomRole = "owner" | "admin" | "member";

export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
}

export interface Room {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    description: string | null;
    exam_date: string | null;
    privacy: RoomPrivacy;
    invite_code: string;
    banner_url: string | null;
    icon: string | null;
    created_at: string;
}

export interface RoomMember {
    id: string;
    room_id: string;
    user_id: string;
    role: RoomRole;
    favorite: boolean;
    joined_at: string;
    last_seen_at: string | null;
}

export interface Subject {
    id: string;
    room_id: string;
    name: string;
    code: string;
    color: string;
    icon: string | null;
    sort_order: number;
}

export interface StudyLog {
    id: string;
    room_id: string;
    user_id: string;
    subject_id: string | null;
    duration_minutes: number;
    notes: string | null;
    created_at: string;
}

export interface Material {
    id: string;
    room_id: string;
    uploaded_by: string;
    subject_id: string | null;
    file_url: string;
    file_name: string;
    file_size: number;
    pinned: boolean;
    created_at: string;
}
