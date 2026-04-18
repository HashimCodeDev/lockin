import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SWRegister } from "@/components/providers/sw-register";
import { getDashboardData } from "@/lib/dashboard-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/supabase/server";

export const unstable_instant = { prefetch: "static" };

export default async function DashboardPage() {
    if (!isSupabaseConfigured()) {
        return (
            <main className="grid min-h-screen place-items-center p-6">
                <div className="glass w-full max-w-lg rounded-xl p-6">
                    <h1 className="font-heading text-3xl text-primary">Supabase setup required</h1>
                    <p className="mt-2 text-muted">
                        Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to run LOCKIN fully.
                    </p>
                </div>
            </main>
        );
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    const data = await getDashboardData(user.id);

    return (
        <>
            <SWRegister />
            <DashboardShell data={data} currentUserId={user.id} />
        </>
    );
}
