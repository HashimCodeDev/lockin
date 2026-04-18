import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { CreateRoomForm } from "@/components/rooms/create-room-form";
import { createClient } from "@/utils/supabase/server";

export default function CreateRoomPage() {
    return (
        <Suspense fallback={<main className="mx-auto w-full max-w-3xl p-4 text-sm text-muted sm:p-6">Loading room creation...</main>}>
            <CreateRoomContent />
        </Suspense>
    );
}

async function CreateRoomContent() {
    await connection();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            <CreateRoomForm />
        </main>
    );
}
