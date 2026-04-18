import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InvitePanel, type InviteRecord } from "@/components/rooms/invite-panel";
import { createClient } from "@/utils/supabase/server";

interface RoomRelation {
    id: string;
    slug: string;
    name: string;
    invite_code: string;
}

interface RoomInviteMembership {
    role: "owner" | "admin" | "member";
    rooms: RoomRelation | RoomRelation[] | null;
}

function getRelation<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

interface InvitePageProps {
    params: Promise<{ slug: string }>;
}

export default async function RoomInvitePage({ params }: InvitePageProps) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    const { data: membershipRaw } = await supabase
        .from("room_members")
        .select("role,rooms!inner(id,slug,name,invite_code)")
        .eq("user_id", user.id)
        .eq("rooms.slug", slug)
        .maybeSingle();

    const membership = membershipRaw as RoomInviteMembership | null;

    if (!membership) {
        redirect("/dashboard");
    }

    const room = getRelation(membership.rooms);

    if (!room) {
        redirect("/dashboard");
    }

    const { data: invites } = await supabase
        .from("room_invites")
        .select("id,target_email,target_username,role,status,created_at,expires_at")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false });

    const initialInviteCode = room.invite_code;
    const initialInviteLink = `/rooms/join?code=${room.invite_code}`;
    const initialInvites = (invites ?? []) as InviteRecord[];

    return (
        <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            <InvitePanel
                slug={slug}
                role={membership.role}
                roomName={room.name}
                initialInviteCode={initialInviteCode}
                initialInviteLink={initialInviteLink}
                initialInvites={initialInvites}
            />
        </main>
    );
}
