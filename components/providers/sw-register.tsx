"use client";

import { useEffect } from "react";

export function SWRegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.register("/sw.js").catch(() => {
            // Ignore registration errors in unsupported environments.
        });
    }, []);

    return null;
}
