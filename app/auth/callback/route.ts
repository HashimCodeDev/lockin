import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { ensureProfileExists } from "@/lib/profile-bootstrap";
import { createClient } from "@/utils/supabase/server";

function getSafeRedirectPath(next: string | null) {
    if (!next) {
        return "/dashboard";
    }

    if (next.startsWith("/") && !next.startsWith("//")) {
        return next;
    }

    return "/dashboard";
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

    if (!code) {
        return NextResponse.redirect(new URL("/sign-in", requestUrl.origin));
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        const redirectUrl = new URL("/sign-in", requestUrl.origin);
        redirectUrl.searchParams.set("error", "google_oauth_failed");
        redirectUrl.searchParams.set("reason", error.message.slice(0, 160));
        return NextResponse.redirect(redirectUrl);
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        const redirectUrl = new URL("/sign-in", requestUrl.origin);
        redirectUrl.searchParams.set("error", "google_oauth_failed");
        redirectUrl.searchParams.set("reason", (userError?.message ?? "Unable to read authenticated user").slice(0, 160));
        return NextResponse.redirect(redirectUrl);
    }

    const ensuredProfile = await ensureProfileExists(supabase, user);

    if (!ensuredProfile.ok) {
        const redirectUrl = new URL("/sign-in", requestUrl.origin);
        redirectUrl.searchParams.set("error", "google_oauth_failed");
        redirectUrl.searchParams.set("reason", ensuredProfile.message.slice(0, 160));
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
