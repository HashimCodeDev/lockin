import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { joinRoomSchema } from "@/lib/validation";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = joinRoomSchema.safeParse(body);

    if (!parsed.success) {
        return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid invite code", {
            status: 400,
        });
    }

    const { error: joinError, data: roomId } = await supabase.rpc("join_room_by_code", {
        input_code: parsed.data.code,
    });

    if (joinError || !roomId) {
        return new NextResponse(joinError?.message ?? "Unable to join room", {
            status: 400,
        });
    }

    const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("slug")
        .eq("id", roomId)
        .single();

    if (roomError || !room) {
        return new NextResponse(roomError?.message ?? "Joined room but could not resolve slug", {
            status: 400,
        });
    }

    return NextResponse.json({ slug: room.slug });
}
