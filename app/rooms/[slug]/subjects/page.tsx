import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SubjectManager } from "@/components/rooms/subject-manager";
import { createClient } from "@/utils/supabase/server";

interface SubjectsPageProps {
    params: Promise<{ slug: string }>;
}

export default async function RoomSubjectsPage({ params }: SubjectsPageProps) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    const { data: membership } = await supabase
        .from("room_members")
        .select("role,rooms!inner(slug,name)")
        .eq("user_id", user.id)
        .eq("rooms.slug", slug)
        .maybeSingle();

    if (!membership) {
        redirect("/dashboard");
    }

    const roomName = Array.isArray(membership.rooms) ? membership.rooms[0]?.name : (membership.rooms as any)?.name;

    return (
        <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
            <SubjectManager slug={slug} role={membership.role} roomName={roomName ?? "Unknown Room"} />
        </main>
    );
}
