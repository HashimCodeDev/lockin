"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function JoinRoomPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState(searchParams.get("code") ?? "");
    const [isJoining, setIsJoining] = useState(false);

    const onJoin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsJoining(true);

        try {
            const response = await fetch("/api/rooms/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                toast.error(await response.text());
                return;
            }

            const data = (await response.json()) as { slug: string };
            router.push(`/rooms/${data.slug}`);
            toast.success("You joined the room.");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <main className="grid min-h-screen place-items-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Join Room</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-3" onSubmit={onJoin}>
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Invite Code</span>
                            <Input
                                required
                                value={code}
                                onChange={(event) => setCode(event.target.value.toUpperCase())}
                                placeholder="E.g. H4X9A12B"
                            />
                        </label>
                        <Button className="w-full" disabled={isJoining}>
                            {isJoining ? "Joining..." : "Join Room"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
