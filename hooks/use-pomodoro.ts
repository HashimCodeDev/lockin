"use client";

import { useEffect, useMemo, useState } from "react";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

export function usePomodoro() {
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(WORK_MINUTES * 60);

    useEffect(() => {
        if (!isRunning) return;

        const timer = window.setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev > 1) return prev - 1;

                const nextIsBreak = !isBreak;
                setIsBreak(nextIsBreak);
                return (nextIsBreak ? BREAK_MINUTES : WORK_MINUTES) * 60;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isRunning, isBreak]);

    const formatted = useMemo(() => {
        const minutes = Math.floor(remainingSeconds / 60)
            .toString()
            .padStart(2, "0");
        const seconds = Math.floor(remainingSeconds % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}`;
    }, [remainingSeconds]);

    return {
        isRunning,
        isBreak,
        formatted,
        start: () => setIsRunning(true),
        pause: () => setIsRunning(false),
        reset: () => {
            setIsRunning(false);
            setIsBreak(false);
            setRemainingSeconds(WORK_MINUTES * 60);
        },
    };
}
