"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface StopwatchState {
    isRunning: boolean;
    elapsedMs: number;
    startedAt: number | null;
}

export function useStopwatch() {
    const [state, setState] = useState<StopwatchState>({
        isRunning: false,
        elapsedMs: 0,
        startedAt: null,
    });
    const startReference = useRef<number | null>(null);

    useEffect(() => {
        if (!state.isRunning || startReference.current === null) return;

        const interval = window.setInterval(() => {
            const now = Date.now();
            setState((prev) => ({
                ...prev,
                elapsedMs: prev.startedAt ? now - prev.startedAt : prev.elapsedMs,
            }));
        }, 1000);

        return () => window.clearInterval(interval);
    }, [state.isRunning]);

    const start = () => {
        const now = Date.now();
        startReference.current = now;
        setState({
            isRunning: true,
            elapsedMs: 0,
            startedAt: now,
        });
    };

    const pause = () => {
        setState((prev) => ({
            ...prev,
            isRunning: false,
            elapsedMs: prev.startedAt ? Date.now() - prev.startedAt : prev.elapsedMs,
        }));
    };

    const resume = () => {
        setState((prev) => ({
            isRunning: true,
            startedAt: Date.now() - prev.elapsedMs,
            elapsedMs: prev.elapsedMs,
        }));
    };

    const stop = () => {
        const finalMs = state.startedAt ? Date.now() - state.startedAt : state.elapsedMs;
        setState({
            isRunning: false,
            elapsedMs: 0,
            startedAt: null,
        });
        startReference.current = null;
        return finalMs;
    };

    const reset = () => {
        setState({
            isRunning: false,
            elapsedMs: 0,
            startedAt: null,
        });
    };

    const durationText = useMemo(() => {
        const totalSeconds = Math.floor(state.elapsedMs / 1000);
        const h = Math.floor(totalSeconds / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((totalSeconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = Math.floor(totalSeconds % 60)
            .toString()
            .padStart(2, "0");

        return `${h}:${m}:${s}`;
    }, [state.elapsedMs]);

    return {
        ...state,
        start,
        pause,
        resume,
        stop,
        reset,
        durationText,
    };
}
