import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getPrimaryRoomSlug } from "@/lib/dashboard-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/utils/supabase/server";

export const unstable_instant = false;

export default async function DashboardPage() {
    if (!isSupabaseConfigured()) {
        return (
            <main className="grid min-h-screen place-items-center p-6">
                <div className="glass w-full max-w-lg rounded-xl p-6">
                    <h1 className="font-heading text-3xl text-primary">Supabase setup required</h1>
                    <p className="mt-2 text-muted">
                        Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to run LOCKIN fully.
                    </p>
                </div>
            </main>
        );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    const slug = await getPrimaryRoomSlug(user.id);

    if (!slug) {
        redirect("/rooms/create");
    }

    redirect(`/rooms/${slug}`);
}
