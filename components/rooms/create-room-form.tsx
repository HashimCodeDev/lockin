"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function CreateRoomForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [slug, setSlug] = useState("");
    const [privacy, setPrivacy] = useState<"public" | "private" | "invite_only">("private");
    const [examDate, setExamDate] = useState("");
    const [icon, setIcon] = useState("rocket");
    const [bannerUrl, setBannerUrl] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const resolvedSlug = useMemo(() => (slug ? slugify(slug) : slugify(name)), [name, slug]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    slug: resolvedSlug,
                    privacy,
                    exam_date: examDate ? new Date(examDate).toISOString() : "",
                    banner_url: bannerUrl,
                    icon,
                }),
            });

            if (!response.ok) {
                toast.error(await response.text());
                return;
            }

            const payload = (await response.json()) as { room: { slug: string } };
            toast.success("Room created successfully.");
            router.push(`/rooms/${payload.room.slug}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading text-3xl text-primary">Create Study Room</CardTitle>
                <CardDescription>
                    Launch a room with custom subjects, invite code access, and isolated leaderboard analytics.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={onSubmit}>
                    <label className="block space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted">Room Name</span>
                        <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="S4 Exam Room" />
                    </label>

                    <label className="block space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted">Slug</span>
                        <Input
                            required
                            value={resolvedSlug}
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="s4-exam-room"
                        />
                    </label>

                    <label className="block space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted">Description</span>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-line bg-card p-3 text-sm"
                            placeholder="Mission, scope, and strategy for this room"
                        />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Exam Date</span>
                            <Input type="datetime-local" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Privacy</span>
                            <select
                                value={privacy}
                                onChange={(event) => setPrivacy(event.target.value as "public" | "private" | "invite_only")}
                                className="h-10 w-full rounded-md border border-line bg-card px-3 text-sm"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="invite_only">Invite only</option>
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Room Icon</span>
                            <Input value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="📚" maxLength={24} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Banner URL</span>
                            <Input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} placeholder="https://..." />
                        </label>
                    </div>

                    <Button className="w-full" disabled={isCreating}>
                        {isCreating ? "Creating Room..." : "Create Room"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
