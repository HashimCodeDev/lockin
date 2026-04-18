import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

interface RoomSettingsRelation {
    slug: string;
    name: string;
    description: string | null;
    privacy: "public" | "private" | "invite_only";
    exam_date: string | null;
}

interface RoomSettingsMembership {
    role: "owner" | "admin" | "member";
    rooms: RoomSettingsRelation | RoomSettingsRelation[] | null;
}

function getRelation<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

interface RoomSettingsPageProps {
    params: Promise<{ slug: string }>;
}

export default async function RoomSettingsPage({ params }: RoomSettingsPageProps) {
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
        .select("role,rooms!inner(slug,name,description,privacy,exam_date)")
        .eq("user_id", user.id)
        .eq("rooms.slug", slug)
        .maybeSingle();

    const membership = membershipRaw as RoomSettingsMembership | null;

    if (!membership) {
        redirect("/dashboard");
    }

    const room = getRelation(membership.rooms) ?? {
        slug,
        name: "Unknown Room",
        description: null,
        privacy: "private" as const,
        exam_date: null,
    };

    return (
        <main className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
            <section className="glass rounded-xl p-5">
                <h1 className="font-heading text-3xl text-primary">{room.name} Settings</h1>
                <p className="mt-2 text-sm text-muted">{room.description || "No room description set."}</p>
                <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                    <p>Privacy: <span className="text-foreground">{room.privacy}</span></p>
                    <p>Exam Date: <span className="text-foreground">{room.exam_date ? new Date(room.exam_date).toLocaleString() : "Not set"}</span></p>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
                <Link href={`/rooms/${slug}/subjects`} className="rounded-lg border border-line bg-card p-4">
                    <h2 className="font-semibold">Manage Subjects</h2>
                    <p className="mt-1 text-sm text-muted">Add, edit, delete, and reorder room subjects.</p>
                </Link>
                <Link href={`/rooms/${slug}/invite`} className="rounded-lg border border-line bg-card p-4">
                    <h2 className="font-semibold">Invite Friends</h2>
                    <p className="mt-1 text-sm text-muted">Share invite code or send direct username/email invites.</p>
                </Link>
            </section>
        </main>
    );
}
