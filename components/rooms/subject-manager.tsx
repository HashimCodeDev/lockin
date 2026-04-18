"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoomRole, Subject } from "@/types/app";

interface SubjectManagerProps {
    slug: string;
    role: RoomRole;
    roomName: string;
}

type DraftSubject = {
    id?: string;
    name: string;
    code: string;
    color: string;
    icon: string;
    sort_order: number;
};

export function SubjectManager({ slug, role, roomName }: SubjectManagerProps) {
    const canManage = role === "owner" || role === "admin";
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [draft, setDraft] = useState<DraftSubject>({
        name: "",
        code: "",
        color: "#53FF78",
        icon: "",
        sort_order: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadSubjects = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/rooms/${slug}/subjects`);
            if (!response.ok) {
                toast.error(await response.text());
                return;
            }
            const payload = (await response.json()) as { subjects: Subject[] };
            setSubjects(payload.subjects);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadSubjects();
    }, [slug]);

    const nextSortOrder = useMemo(() => Math.max(...subjects.map((subject) => subject.sort_order), -1) + 1, [subjects]);

    const createSubject = async () => {
        const response = await fetch(`/api/rooms/${slug}/subjects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...draft, sort_order: nextSortOrder }),
        });

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        toast.success("Subject added.");
        setDraft({ name: "", code: "", color: "#53FF78", icon: "", sort_order: nextSortOrder + 1 });
        await loadSubjects();
    };

    const updateSubject = async (subject: Subject) => {
        const response = await fetch(`/api/rooms/${slug}/subjects`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subject),
        });

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        toast.success("Subject updated.");
    };

    const reorder = async (direction: "up" | "down", index: number) => {
        const clone = [...subjects];
        const swapIndex = direction === "up" ? index - 1 : index + 1;

        if (swapIndex < 0 || swapIndex >= clone.length) {
            return;
        }

        const current = clone[index];
        clone[index] = clone[swapIndex];
        clone[swapIndex] = current;

        const reordered = clone.map((subject, idx) => ({ id: subject.id, sort_order: idx }));
        const response = await fetch(`/api/rooms/${slug}/subjects`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjects: reordered }),
        });

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        toast.success("Subject order updated.");
        await loadSubjects();
    };

    const removeSubject = async (id: string) => {
        const response = await fetch(`/api/rooms/${slug}/subjects?id=${id}`, { method: "DELETE" });

        if (!response.ok) {
            toast.error(await response.text());
            return;
        }

        toast.success("Subject removed.");
        await loadSubjects();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-heading text-2xl text-primary">Manage Subjects · {roomName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!canManage && (
                    <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                        You are a member. Only owner/admin can modify subjects.
                    </p>
                )}

                {canManage && (
                    <div className="grid gap-2 rounded-lg border border-line bg-card p-3 md:grid-cols-[1.6fr_1fr_120px_120px_auto]">
                        <Input placeholder="Subject name" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
                        <Input placeholder="Code" value={draft.code} onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))} />
                        <Input placeholder="#53FF78" value={draft.color} onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))} />
                        <Input placeholder="Icon" value={draft.icon} onChange={(event) => setDraft((prev) => ({ ...prev, icon: event.target.value }))} />
                        <Button onClick={() => void createSubject()}>Add</Button>
                    </div>
                )}

                <div className="space-y-2">
                    {!isLoading && subjects.length === 0 && <p className="text-sm text-muted">No subjects in this room yet.</p>}
                    {subjects.map((subject, index) => (
                        <div key={subject.id} className="grid items-center gap-2 rounded-lg border border-line bg-card p-3 md:grid-cols-[1.6fr_1fr_120px_120px_auto]">
                            <Input
                                value={subject.name}
                                disabled={!canManage}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSubjects((prev) => prev.map((item) => (item.id === subject.id ? { ...item, name: value } : item)));
                                }}
                                onBlur={() => canManage && void updateSubject(subject)}
                            />
                            <Input
                                value={subject.code}
                                disabled={!canManage}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSubjects((prev) => prev.map((item) => (item.id === subject.id ? { ...item, code: value } : item)));
                                }}
                                onBlur={() => canManage && void updateSubject(subject)}
                            />
                            <Input
                                value={subject.color}
                                disabled={!canManage}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSubjects((prev) => prev.map((item) => (item.id === subject.id ? { ...item, color: value } : item)));
                                }}
                                onBlur={() => canManage && void updateSubject(subject)}
                            />
                            <Input
                                value={subject.icon ?? ""}
                                disabled={!canManage}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSubjects((prev) => prev.map((item) => (item.id === subject.id ? { ...item, icon: value } : item)));
                                }}
                                onBlur={() => canManage && void updateSubject(subject)}
                            />

                            <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" disabled={!canManage} onClick={() => void reorder("up", index)}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" disabled={!canManage} onClick={() => void reorder("down", index)}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" disabled={!canManage} onClick={() => void removeSubject(subject.id)}>
                                    <Trash2 className="h-4 w-4 text-danger" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
