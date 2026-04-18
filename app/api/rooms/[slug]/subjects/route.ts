import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSubjectSchema, reorderSubjectsSchema, updateSubjectSchema } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server";

async function resolveRoom(slug: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, user: null, room: null, membership: null };
    }

    const { data: room } = await supabase.from("rooms").select("id").eq("slug", slug).maybeSingle();

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
    const { supabase, user, room } = await resolveRoom(slug);

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!room) {
        return new NextResponse("Room not found", { status: 404 });
    }

    const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("room_id", room.id)
        .order("sort_order", { ascending: true });

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ subjects: data ?? [] });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const { supabase, user, room, membership } = await resolveRoom(slug);

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!room) {
        return new NextResponse("Room not found", { status: 404 });
    }

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return new NextResponse("Only owner/admin can add subjects", { status: 403 });
    }

    const body = await request.json();
    const parsed = createSubjectSchema.safeParse({ ...body, room_id: room.id });

    if (!parsed.success) {
        return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid subject payload", {
            status: 400,
        });
    }

    const { data, error } = await supabase
        .from("subjects")
        .insert(parsed.data)
        .select("*")
        .single();

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ subject: data });
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const { supabase, user, room, membership } = await resolveRoom(slug);

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!room) {
        return new NextResponse("Room not found", { status: 404 });
    }

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return new NextResponse("Only owner/admin can edit subjects", { status: 403 });
    }

    const body = await request.json();

    if (Array.isArray(body?.subjects)) {
        const parsed = reorderSubjectsSchema.safeParse({ room_id: room.id, subjects: body.subjects });

        if (!parsed.success) {
            return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid subject order payload", {
                status: 400,
            });
        }

        for (const item of parsed.data.subjects) {
            const { error } = await supabase
                .from("subjects")
                .update({ sort_order: item.sort_order })
                .eq("id", item.id)
                .eq("room_id", room.id);

            if (error) {
                return new NextResponse(error.message, { status: 400 });
            }
        }

        return NextResponse.json({ ok: true });
    }

    const parsed = updateSubjectSchema.safeParse({ ...body, room_id: room.id });

    if (!parsed.success) {
        return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid subject update payload", {
            status: 400,
        });
    }

    const { error } = await supabase
        .from("subjects")
        .update({
            name: parsed.data.name,
            code: parsed.data.code,
            color: parsed.data.color,
            icon: parsed.data.icon || null,
            sort_order: parsed.data.sort_order,
        })
        .eq("id", parsed.data.id)
        .eq("room_id", room.id);

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const { supabase, user, room, membership } = await resolveRoom(slug);

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!room) {
        return new NextResponse("Room not found", { status: 404 });
    }

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        return new NextResponse("Only owner/admin can delete subjects", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing subject id", { status: 400 });
    }

    const { error } = await supabase.from("subjects").delete().eq("id", id).eq("room_id", room.id);

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
