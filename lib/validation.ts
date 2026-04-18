import { z } from "zod";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE, SUBJECTS } from "@/lib/constants";

const subjectCodes = SUBJECTS.map((item) => item.code) as [string, ...string[]];

export const studySessionSchema = z.object({
    subject_code: z.enum(subjectCodes),
    duration_minutes: z.number().int().min(1).max(720),
    notes: z.string().trim().max(500).optional(),
    goal: z.string().trim().max(140).optional(),
});

export const uploadMetadataSchema = z.object({
    subject_code: z.enum(subjectCodes),
    file_name: z.string().trim().min(3).max(120),
    file_size: z.number().int().min(1).max(MAX_UPLOAD_SIZE),
    file_type: z.enum(ALLOWED_UPLOAD_TYPES),
    checksum: z.string().trim().min(40).max(128),
});
