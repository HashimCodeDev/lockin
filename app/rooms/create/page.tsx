import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CreateRoomForm } from "@/components/rooms/create-room-form";
import { createClient } from "@/utils/supabase/server";

export default async function CreateRoomPage() {
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
