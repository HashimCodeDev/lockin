"use client";

import { Brain, Coffee, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePomodoro } from "@/hooks/use-pomodoro";

export function FocusTools() {
    const pomodoro = usePomodoro();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Focus Tools</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 rounded-lg border border-line bg-card p-3">
                    <p className="text-xs uppercase tracking-widest text-muted">
                        {pomodoro.isBreak ? "Break Mode" : "Pomodoro 25/5"}
                    </p>
                    <p className="font-heading text-4xl text-primary">{pomodoro.formatted}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <Button onClick={pomodoro.start} disabled={pomodoro.isRunning}>
                        <Brain className="mr-1 h-4 w-4" /> Start
                    </Button>
                    <Button variant="secondary" onClick={pomodoro.pause}>
                        <Coffee className="mr-1 h-4 w-4" /> Break
                    </Button>
                    <Button variant="ghost" onClick={pomodoro.reset}>
                        <TimerReset className="mr-1 h-4 w-4" /> Reset
                    </Button>
                </div>

                <div className="mt-3 grid gap-2">
                    <Button variant="secondary" onClick={() => toast.message("Deep Work mode enabled for 90 minutes")}>Enable Deep Work</Button>
                    <Button variant="secondary" onClick={() => toast.message("Motivational alert armed")}>Motivational Alert</Button>
                </div>
            </CardContent>
        </Card>
    );
}
