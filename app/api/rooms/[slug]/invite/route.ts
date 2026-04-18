import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createInviteSchema } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server";

async function requireRoomAccess(slug: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, user: null, room: null, membership: null };
    }

    const { data: room } = await supabase
        .from("rooms")
        .select("id,slug,name,invite_code")
        .eq("slug", slug)
        .maybeSingle();

    if (!room) {
        return { supabase, user, room: null, membership: null };
    }

    const { data: membership } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();

    return { supabase, user, room, membership };
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const { supabase, user, room, membership } = await requireRoomAccess(slug);

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!room || !membership) {
        return new NextResponse("Room not found", { status: 404 });
    }

    const { data: invites, error } = await supabase
        .from("room_invites")
        .select("id,target_email,target_username,role,status,created_at,expires_at")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false });

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({
        invite_code: room.invite_code,
        invite_link: `/rooms/join?code=${room.invite_code}`,
        invites: invites ?? [],
    });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const { supabase, user, room, membership } = await requireRoomAccess(slug);

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!room || !membership) {
        return new NextResponse("Room not found", { status: 404 });
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
        return new NextResponse("Only owner/admin can invite users", { status: 403 });
    }

    const body = await request.json();
    const parsed = createInviteSchema.safeParse({ ...body, room_id: room.id });

    if (!parsed.success) {
        return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid invite payload", {
            status: 400,
        });
    }

    if (!parsed.data.target_email && !parsed.data.target_username) {
        return new NextResponse("Provide email or username", { status: 400 });
    }

    const { error } = await supabase.from("room_invites").insert({
        room_id: room.id,
        invited_by: user.id,
        invite_code: room.invite_code,
        target_email: parsed.data.target_email || null,
        target_username: parsed.data.target_username || null,
        role: parsed.data.role,
        status: "pending",
        expires_at: null,
    });

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
