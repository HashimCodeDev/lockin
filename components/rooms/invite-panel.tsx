"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoomRole } from "@/types/app";

interface InvitePanelProps {
    slug: string;
    role: RoomRole;
    roomName: string;
}

interface InviteRecord {
    id: string;
    target_email: string | null;
    target_username: string | null;
    role: "admin" | "member";
    status: string;
    created_at: string;
    expires_at: string | null;
}

export function InvitePanel({ slug, role, roomName }: InvitePanelProps) {
    const [inviteCode, setInviteCode] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [targetEmail, setTargetEmail] = useState("");
    const [targetUsername, setTargetUsername] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
    const [invites, setInvites] = useState<InviteRecord[]>([]);

    const canInvite = role === "owner" || role === "admin";

    const fullInviteLink = useMemo(() => {
        if (!inviteLink) {
            return "";
        }

        if (typeof window === "undefined") {
            return inviteLink;
        }

        return `${window.location.origin}${inviteLink}`;
    }, [inviteLink]);

    const loadInvites = async () => {
        const response = await fetch(`/api/rooms/${slug}/invite`);

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        const payload = (await response.json()) as {
            invite_code: string;
            invite_link: string;
            invites: InviteRecord[];
        };

        setInviteCode(payload.invite_code);
        setInviteLink(payload.invite_link);
        setInvites(payload.invites);
    };

    useEffect(() => {
        void loadInvites();
    }, [slug]);

    const sendInvite = async () => {
        const response = await fetch(`/api/rooms/${slug}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: inviteRole,
                target_email: targetEmail,
                target_username: targetUsername,
            }),
        });

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        toast.success("Invite queued.");
        setTargetEmail("");
        setTargetUsername("");
        await loadInvites();
    };

    const copyText = async (value: string) => {
        if (!value) {
            return;
        }

        await navigator.clipboard.writeText(value);
        toast.success("Copied.");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading text-2xl text-primary">Invite Friends · {roomName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 rounded-lg border border-line bg-card p-3 sm:grid-cols-[1fr_auto]">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-muted">Room Code</p>
                        <p className="font-heading text-2xl text-primary">{inviteCode || "..."}</p>
                    </div>
                    <Button variant="secondary" onClick={() => void copyText(inviteCode)}>
                        <Copy className="mr-1 h-4 w-4" /> Copy Code
                    </Button>
                </div>

                <div className="grid gap-2 rounded-lg border border-line bg-card p-3 sm:grid-cols-[1fr_auto]">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-muted">Shareable Link</p>
                        <p className="truncate text-sm text-foreground">{fullInviteLink || "Loading..."}</p>
                    </div>
                    <Button variant="secondary" onClick={() => void copyText(fullInviteLink)}>
                        <Link2 className="mr-1 h-4 w-4" /> Copy Link
                    </Button>
                </div>

                {!canInvite && (
                    <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                        You are a member. Only owner/admin can send username/email invites.
                    </p>
                )}

                {canInvite && (
                    <div className="grid gap-2 rounded-lg border border-line bg-card p-3 sm:grid-cols-[1fr_1fr_120px_auto]">
                        <Input
                            placeholder="friend@example.com"
                            value={targetEmail}
                            onChange={(event) => setTargetEmail(event.target.value)}
                        />
                        <Input
                            placeholder="or username"
                            value={targetUsername}
                            onChange={(event) => setTargetUsername(event.target.value)}
                        />
                        <select
                            value={inviteRole}
                            onChange={(event) => setInviteRole(event.target.value as "admin" | "member")}
                            className="h-10 rounded-md border border-line bg-card px-2 text-sm"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                        <Button onClick={() => void sendInvite()}>
                            <Send className="mr-1 h-4 w-4" /> Send
                        </Button>
                    </div>
                )}

                <div className="space-y-2">
                    {invites.map((invite) => (
                        <div key={invite.id} className="rounded-lg border border-line bg-card p-3 text-sm">
                            <p className="font-semibold text-foreground">
                                {invite.target_email || invite.target_username || "Invite via code"}
                            </p>
                            <p className="text-xs text-muted">
                                Role: {invite.role} · Status: {invite.status} · {new Date(invite.created_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
                    {invites.length === 0 && <p className="text-sm text-muted">No direct invites yet.</p>}
                </div>
            </CardContent>
        </Card>
    );
}
