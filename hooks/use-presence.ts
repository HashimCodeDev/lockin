"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function usePresence(roomId?: string, userId?: string) {
    const [activeUsers, setActiveUsers] = useState(0);

    useEffect(() => {
        if (!userId || !roomId) return;

        let isMounted = true;
        const client = createClient();
        const channel = client.channel(`study-presence:${roomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const total = Object.values(state).flat().length;
                if (isMounted) {
                    setActiveUsers(total);
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        studying: true,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            isMounted = false;
            void client.removeChannel(channel);
        };
    }, [roomId, userId]);

    return useMemo(() => ({ activeUsers }), [activeUsers]);
}
