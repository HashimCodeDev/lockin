import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";

type EnsureProfileSuccess = {
    ok: true;
    created: boolean;
};

type EnsureProfileFailure = {
    ok: false;
    status: number;
    message: string;
    code?: string;
};

export type EnsureProfileResult = EnsureProfileSuccess | EnsureProfileFailure;

function normalizeUsername(value: string) {
    const cleaned = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "");

    return (cleaned || "user").slice(0, 24);
}

function resolveBaseUsername(user: User) {
    const usernameMeta = typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "";
    const fullNameMeta = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const emailLocal = user.email?.split("@")[0] ?? "";

    return normalizeUsername(usernameMeta || fullNameMeta || emailLocal || "user");
}

function resolveAvatarUrl(user: User) {
    const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "";
    const pictureUrl = typeof user.user_metadata?.picture === "string" ? user.user_metadata.picture : "";

    return (avatarUrl || pictureUrl || null) as string | null;
}

function withStableSuffix(username: string, userId: string) {
    const suffix = userId.replace(/-/g, "").slice(0, 12);
    const trimmed = username.slice(0, 18);
    return `${trimmed}_${suffix}`;
}

function mapProfileError(error: PostgrestError): EnsureProfileFailure {
    if (error.code === "42501") {
        return {
            ok: false,
            status: 403,
            code: error.code,
            message: "Profile creation blocked by database policy. Apply the latest schema migration and retry.",
        };
    }

    if (error.code === "23503") {
        return {
            ok: false,
            status: 400,
            code: error.code,
            message: "Authenticated user was not found in auth.users. Please sign in again.",
        };
    }

    return {
        ok: false,
        status: 400,
        code: error.code,
        message: error.message,
    };
}

export async function ensureProfileExists(supabase: SupabaseClient, user: User): Promise<EnsureProfileResult> {
    const { data: existingProfile, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (lookupError) {
        return {
            ok: false,
            status: 400,
            code: lookupError.code,
            message: lookupError.message,
        };
    }

    if (existingProfile) {
        return { ok: true, created: false };
    }

    const avatarUrl = resolveAvatarUrl(user);
    const baseUsername = resolveBaseUsername(user);
    const candidates = [baseUsername, withStableSuffix(baseUsername, user.id)];

    for (const username of candidates) {
        const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            username,
            avatar_url: avatarUrl,
        });

        if (!insertError) {
            return { ok: true, created: true };
        }

        if (insertError.code !== "23505") {
            return mapProfileError(insertError);
        }

        const { data: profileAfterConflict } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileAfterConflict) {
            return { ok: true, created: false };
        }
    }

    return {
        ok: false,
        status: 409,
        message: "Unable to create a unique profile username automatically. Please retry.",
    };
}
