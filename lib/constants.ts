export const EXAM_DATE = "2026-04-27T00:00:00+05:30";

export const SUBJECTS = [
    { code: "GAMAT401", label: "MATHS" },
    { code: "PCCST402", label: "DBMS" },
    { code: "PCCST403", label: "OS" },
    { code: "PBCST404", label: "COA" },
    { code: "PECCT41N", label: "PE-1" },
    { code: "UCHUT346", label: "EE / ETHICS" },
] as const;

export const ALLOWED_UPLOAD_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
] as const;

export const MAX_UPLOAD_MB = 25;
export const MAX_UPLOAD_SIZE = MAX_UPLOAD_MB * 1024 * 1024;

export const STORAGE_QUOTA_BYTES = 1.5 * 1024 * 1024 * 1024;

export function getRankTitle(hours: number) {
    if (hours >= 40) return "General";
    if (hours >= 25) return "Major";
    if (hours >= 15) return "Captain";
    if (hours >= 5) return "Sergeant";
    return "Recruit";
}
