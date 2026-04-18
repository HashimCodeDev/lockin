import { z } from "zod";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE } from "@/lib/constants";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const studySessionSchema = z.object({
    room_id: z.string().uuid(),
    subject_id: z.string().uuid().nullable(),
    duration_minutes: z.number().int().min(1).max(720),
    notes: z.string().trim().max(500).optional(),
    goal: z.string().trim().max(140).optional(),
});

export const uploadMetadataSchema = z.object({
    room_id: z.string().uuid(),
    subject_id: z.string().uuid().nullable().optional(),
    file_name: z.string().trim().min(3).max(120),
    file_size: z.number().int().min(1).max(MAX_UPLOAD_SIZE),
    file_type: z.enum(ALLOWED_UPLOAD_TYPES),
    checksum: z.string().trim().min(40).max(128),
});

export const createRoomSchema = z.object({
    name: z.string().trim().min(3).max(60),
    description: z.string().trim().max(240).optional().or(z.literal("")),
    exam_date: z.string().datetime().optional().or(z.literal("")),
    privacy: z.enum(["public", "private", "invite_only"]),
    banner_url: z.string().url().optional().or(z.literal("")),
    icon: z.string().trim().max(24).optional().or(z.literal("")),
    slug: z.string().trim().min(3).max(64).regex(slugRegex, "Use lowercase letters, numbers, and hyphens"),
});

export const createSubjectSchema = z.object({
    room_id: z.string().uuid(),
    name: z.string().trim().min(2).max(60),
    code: z.string().trim().min(2).max(20),
    color: z.string().trim().regex(/^#([0-9A-Fa-f]{6})$/, "Use hex color like #53FF78"),
    icon: z.string().trim().max(32).optional().or(z.literal("")),
    sort_order: z.number().int().min(0),
});

export const updateSubjectSchema = createSubjectSchema.extend({
    id: z.string().uuid(),
});

export const reorderSubjectsSchema = z.object({
    room_id: z.string().uuid(),
    subjects: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })).min(1),
});

export const createInviteSchema = z.object({
    room_id: z.string().uuid(),
    role: z.enum(["admin", "member"]).default("member"),
    target_email: z.string().email().optional().or(z.literal("")),
    target_username: z.string().trim().min(3).max(30).optional().or(z.literal("")),
});

export const joinRoomSchema = z.object({
    code: z.string().trim().min(6).max(16),
});
