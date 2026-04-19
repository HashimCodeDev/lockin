import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { createRoomSchema } from "@/lib/validation";
import { ensureProfileExists } from "@/lib/profile-bootstrap";
import { createClient } from "@/utils/supabase/server";
import type { Room, RoomMember } from "@/types/app";

type RoomListRow = {
    favorite: boolean;
    role: RoomMember["role"];
    last_seen_at: string | null;
    rooms:
    | {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        privacy: Room["privacy"];
        invite_code: string;
    }
    | {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        privacy: Room["privacy"];
        invite_code: string;
    }[]
    | null;
};

function generateInviteCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function requireUser() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    return { supabase, user, authError: error };
}

function mapDatabaseError(error: PostgrestError | null, fallbackMessage: string) {
    if (!error) {
        return { status: 400, message: fallbackMessage };
    }

    if (error.code === "42501") {
        return {
            status: 403,
            message: "Database policy blocked this action. Ensure your session is valid and schema policies are up to date.",
        };
    }

    if (error.code === "23503") {
        return {
            status: 400,
            message: "Profile mapping is missing for this account. Please sign out and sign in again.",
        };
    }

    if (error.code === "23505") {
        return {
            status: 409,
            message: "Room slug or invite code is already in use. Please retry.",
        };
    }

    return { status: 400, message: error.message || fallbackMessage };
}

export async function GET() {
    const { supabase, user, authError } = await requireUser();

    if (!user) {
        return new NextResponse(authError?.message ?? "Unauthorized", { status: 401 });
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

    const rooms = ((data ?? []) as RoomListRow[]).flatMap((item) => {
        const roomData = Array.isArray(item.rooms) ? item.rooms[0] : item.rooms;

        if (!roomData) {
            return [];
        }

        return [
            {
                id: roomData.id,
                slug: roomData.slug,
                name: roomData.name,
                description: roomData.description,
                privacy: roomData.privacy,
                invite_code: roomData.invite_code,
                favorite: item.favorite,
                role: item.role,
                last_seen_at: item.last_seen_at,
            },
        ];
    });

    return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
    const { supabase, user, authError } = await requireUser();

    if (!user) {
        return new NextResponse(authError?.message ?? "Unauthorized", { status: 401 });
    }

    const ensuredProfile = await ensureProfileExists(supabase, user);

    if (!ensuredProfile.ok) {
        return new NextResponse(ensuredProfile.message, { status: ensuredProfile.status });
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
        const mapped = mapDatabaseError(roomError, "Unable to create room");
        return new NextResponse(mapped.message, { status: mapped.status });
    }

    const { error: memberError } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        role: "owner",
        favorite: true,
        last_seen_at: new Date().toISOString(),
    });

    if (memberError) {
        await supabase.from("rooms").delete().eq("id", room.id);
        const mapped = mapDatabaseError(memberError, "Unable to register room owner");
        return new NextResponse(mapped.message, { status: mapped.status });
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
        await supabase.from("rooms").delete().eq("id", room.id);
        const mapped = mapDatabaseError(subjectError, "Unable to create default subjects");
        return new NextResponse(mapped.message, { status: mapped.status });
    }

    return NextResponse.json({ room });
}
