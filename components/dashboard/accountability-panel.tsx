"use client";

import { CheckCircle2, Siren, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AccountabilityPanelProps {
    attendancePercent: number;
    lastActiveAt: string;
}

export function AccountabilityPanel({ attendancePercent, lastActiveAt }: AccountabilityPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Accountability System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="rounded-lg border border-line bg-card p-3">
                    <p className="mb-1 text-xs uppercase tracking-widest text-muted">Goal Completion</p>
                    <p className="mb-2 text-xl font-semibold text-foreground">{attendancePercent}%</p>
                    <Progress value={attendancePercent} />
                </div>

                <div className="rounded-lg border border-line bg-card p-3 text-sm text-muted">
                    <p className="mb-1 inline-flex items-center gap-1 text-foreground">
                        <UserCheck className="h-4 w-4 text-primary" /> Last Active
                    </p>
                    {lastActiveAt}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => toast.success("Daily check-in captured")}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Check-in
                    </Button>
                    <Button variant="danger" onClick={() => toast.warning("Missed study reminder sent")}>
                        <Siren className="mr-1 h-4 w-4" /> Remind Squad
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
