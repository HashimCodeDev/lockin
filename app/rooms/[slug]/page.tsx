import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SWRegister } from "@/components/providers/sw-register";
import { getDashboardData, isRoomAccessError } from "@/lib/dashboard-data";
import { createClient } from "@/utils/supabase/server";

interface RoomPageProps {
    params: Promise<{ slug: string }>;
}

export default function RoomDashboardPage({ params }: RoomPageProps) {
    return (
        <Suspense fallback={<main className="mx-auto grid min-h-screen w-full max-w-2xl place-items-center p-6 text-sm text-muted">Loading room dashboard...</main>}>
            <RoomDashboardContent params={params} />
        </Suspense>
    );
}

async function RoomDashboardContent({ params }: RoomPageProps) {
    await connection();
    const { slug } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    let data;

    try {
        data = await getDashboardData(user.id, slug);
    } catch (error) {
        if (isRoomAccessError(error)) {
            return (
                <main className="mx-auto grid min-h-screen w-full max-w-2xl place-items-center p-6">
                    <section className="glass w-full rounded-xl p-6 text-center">
                        <h1 className="font-heading text-2xl text-primary">Room access unavailable</h1>
                        <p className="mt-2 text-sm text-muted">
                            This room does not exist or you do not have permission to enter it.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <Link href="/dashboard" className="rounded-md border border-line bg-card px-3 py-2 text-sm">
                                Go to Dashboard
                            </Link>
                            <Link href="/rooms/join" className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                                Join with Invite Code
                            </Link>
                        </div>
                    </section>
                </main>
            );
        }

        throw error;
    }

    return (
        <>
            <SWRegister />
            <DashboardShell data={data} currentUserId={user.id} />
        </>
    );
}
