"use client";

import { BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationsPanelProps {
    notifications: Array<{ id: string; message: string; time: string; level: "info" | "warn" | "danger" }>;
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" /> Notifications
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {notifications.length === 0 && <p className="text-sm text-muted">No notifications right now.</p>}
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            className={`rounded-lg border p-3 text-sm ${item.level === "danger"
                                    ? "border-danger/50 bg-danger/10"
                                    : item.level === "warn"
                                        ? "border-warning/50 bg-warning/10"
                                        : "border-line bg-card"
                                }`}
                        >
                            <p>{item.message}</p>
                            <p className="mt-1 text-xs text-muted">{item.time}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
