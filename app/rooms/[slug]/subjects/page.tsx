import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SubjectManager } from "@/components/rooms/subject-manager";
import { createClient } from "@/utils/supabase/server";
import type { Subject } from "@/types/app";

interface RoomSubjectsRelation {
    id: string;
    slug: string;
    name: string;
}

interface RoomSubjectsMembership {
    role: "owner" | "admin" | "member";
    rooms: RoomSubjectsRelation | RoomSubjectsRelation[] | null;
}

function getRelation<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

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

    const { data: membershipRaw } = await supabase
        .from("room_members")
        .select("role,rooms!inner(id,slug,name)")
        .eq("user_id", user.id)
        .eq("rooms.slug", slug)
        .maybeSingle();

    const membership = membershipRaw as RoomSubjectsMembership | null;

    if (!membership) {
        redirect("/dashboard");
    }

    const room = getRelation(membership.rooms);

    if (!room) {
        redirect("/dashboard");
    }

    const { data: subjects } = await supabase
        .from("subjects")
        .select("*")
        .eq("room_id", room.id)
        .order("sort_order", { ascending: true });

    const initialSubjects = (subjects ?? []) as Subject[];

    return (
        <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
            <SubjectManager
                slug={slug}
                role={membership.role}
                roomName={room.name}
                initialSubjects={initialSubjects}
            />
        </main>
    );
}
