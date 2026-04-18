import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
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
        return NextResponse.redirect(new URL("/sign-in?error=google_oauth_failed", requestUrl.origin));
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
