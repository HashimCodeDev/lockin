import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadMetadataSchema } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server";

const uploadWindow = new Map<string, { count: number; startedAt: number }>();
const LIMIT_PER_MINUTE = 12;

function isRateLimited(userId: string) {
    const now = Date.now();
    const current = uploadWindow.get(userId);

    if (!current || now - current.startedAt > 60_000) {
        uploadWindow.set(userId, { count: 1, startedAt: now });
        return false;
    }

    if (current.count >= LIMIT_PER_MINUTE) {
        return true;
    }

    current.count += 1;
    uploadWindow.set(userId, current);
    return false;
}

async function requireUser() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { supabase, user };
}

export async function POST(request: NextRequest) {
    const { supabase, user } = await requireUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isRateLimited(user.id)) {
        return new NextResponse("Upload rate limit exceeded. Try again in 1 minute.", {
            status: 429,
        });
    }

    const body = await request.json();
    const parsed = uploadMetadataSchema.safeParse(body);

    if (!parsed.success) {
        return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid input", {
            status: 400,
        });
    }

    const { data: duplicate } = await supabase
        .from("materials")
        .select("id")
        .eq("room_id", parsed.data.room_id)
        .eq("uploaded_by", user.id)
        .eq("file_name", parsed.data.file_name)
        .eq("file_size", parsed.data.file_size)
        .maybeSingle();

    if (duplicate) {
        return new NextResponse("Duplicate file detected", { status: 409 });
    }

    return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
    const { supabase, user } = await requireUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as {
        room_id: string;
        subject_id: string | null;
        file_name: string;
        file_size: number;
        file_url: string;
        pinned?: boolean;
    };

    const { data: membership } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", body.room_id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        return new NextResponse("Only room members can upload materials", { status: 403 });
    }

    const { error } = await supabase.from("materials").insert({
        room_id: body.room_id,
        uploaded_by: user.id,
        subject_id: body.subject_id,
        file_name: body.file_name,
        file_size: body.file_size,
        file_url: body.file_url,
        pinned: body.pinned ?? false,
    });

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
    const { supabase, user } = await requireUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as { id: string; room_id: string; pinned: boolean };

    const { data: membership } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", body.room_id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        return new NextResponse("Only room members can update materials", { status: 403 });
    }

    const { error } = await supabase
        .from("materials")
        .update({ pinned: body.pinned })
        .eq("id", body.id)
        .eq("room_id", body.room_id);

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
    const { supabase, user } = await requireUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    const roomId = request.nextUrl.searchParams.get("room_id");

    if (!id || !roomId) {
        return new NextResponse("Missing id", { status: 400 });
    }

    const { data: membership } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        return new NextResponse("Only room members can remove files", { status: 403 });
    }

    const isAdmin = membership.role === "owner" || membership.role === "admin";

    const query = supabase.from("materials").delete().eq("id", id).eq("room_id", roomId);

    const { error } = isAdmin ? await query : await query.eq("uploaded_by", user.id);

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
