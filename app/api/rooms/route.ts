import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRoomSchema } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server";

function generateInviteCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function requireUser() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
}

export async function GET() {
    const { supabase, user } = await requireUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data, error } = await supabase
        .from("room_members")
        .select("favorite,role,last_seen_at,rooms!inner(id,slug,name,description,privacy,invite_code)")
        .eq("user_id", user.id)
        .order("favorite", { ascending: false })
        .order("last_seen_at", { ascending: false, nullsFirst: false });

    if (error) {
        return new NextResponse(error.message, { status: 400 });
    }

    const rooms = (data ?? []).map((item: any) => {
        const roomData = item.rooms?.[0] ?? item.rooms;

        return {
            id: roomData.id,
            slug: roomData.slug,
            name: roomData.name,
            description: roomData.description,
            privacy: roomData.privacy,
            invite_code: roomData.invite_code,
            favorite: item.favorite,
            role: item.role,
            last_seen_at: item.last_seen_at,
        };
    });

    return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
    const { supabase, user } = await requireUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await request.json();
    const parsed = createRoomSchema.safeParse(payload);

    if (!parsed.success) {
        return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid room payload", {
            status: 400,
        });
    }

    const roomData = {
        owner_id: user.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        exam_date: parsed.data.exam_date || null,
        privacy: parsed.data.privacy,
        invite_code: generateInviteCode(),
        banner_url: parsed.data.banner_url || null,
        icon: parsed.data.icon || null,
    };

    const { data: room, error: roomError } = await supabase.from("rooms").insert(roomData).select("*").single();

    if (roomError || !room) {
        return new NextResponse(roomError?.message ?? "Unable to create room", { status: 400 });
    }

    const { error: memberError } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        role: "owner",
        favorite: true,
        last_seen_at: new Date().toISOString(),
    });

    if (memberError) {
        return new NextResponse(memberError.message, { status: 400 });
    }

    const defaultSubjects = [
        { name: "Maths", code: "MATH", color: "#53FF78", sort_order: 0 },
        { name: "Aptitude", code: "APT", color: "#22D3EE", sort_order: 1 },
        { name: "DSA", code: "DSA", color: "#FACC15", sort_order: 2 },
        { name: "Revision", code: "REV", color: "#FB7185", sort_order: 3 },
    ];

    const { error: subjectError } = await supabase.from("subjects").insert(
        defaultSubjects.map((subject) => ({
            room_id: room.id,
            ...subject,
        })),
    );

    if (subjectError) {
        return new NextResponse(subjectError.message, { status: 400 });
    }

    return NextResponse.json({ room });
}
