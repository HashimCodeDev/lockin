import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";

const PROTECTED = ["/dashboard"];
const AUTH_ONLY = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
    const { response, user } = await updateSession(request);

    const isProtectedRoute = PROTECTED.some((route) =>
        request.nextUrl.pathname.startsWith(route),
    );
    const isAuthRoute = AUTH_ONLY.some((route) =>
        request.nextUrl.pathname.startsWith(route),
    );

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/sign-in";
        return NextResponse.redirect(url);
    }

    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
