import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/auth/callback")) {
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }

    return await updateSession(request);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};