"use client";

import { useMemo, useState } from "react";
import { Download, FileUp, Pin, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { STORAGE_QUOTA_BYTES } from "@/lib/constants";
import { compressImageIfNeeded, hashFile, validateFileTypeAndSize } from "@/lib/upload-utils";
import { createClient } from "@/utils/supabase/client";
import type { Material, Subject } from "@/types/app";

interface VaultPanelProps {
    roomId: string;
    selectedSubjectId: string | null;
    subjects: Subject[];
    rows: Material[];
    currentUserId: string;
    canModerate: boolean;
    onRefresh: () => Promise<void>;
}

export function VaultPanel({ roomId, selectedSubjectId, subjects, rows, currentUserId, canModerate, onRefresh }: VaultPanelProps) {
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [isUploading, setIsUploading] = useState(false);

    const usedStorage = rows.reduce((sum, item) => sum + item.file_size, 0);
    const storagePercent = Math.min((usedStorage / STORAGE_QUOTA_BYTES) * 100, 100);

    const filteredRows = useMemo(
        () =>
            rows.filter((item) => {
                const matchesSubject = selectedSubjectId ? item.subject_id === selectedSubjectId : true;
                const matchesQuery = item.file_name.toLowerCase().includes(query.toLowerCase());
                const ext = item.file_name.split(".").pop()?.toLowerCase() ?? "";
                const matchesType = typeFilter === "all" ? true : ext === typeFilter;
                return matchesSubject && matchesQuery && matchesType;
            }),
        [query, rows, selectedSubjectId, typeFilter],
    );

    const uploadFiles = async (fileList: FileList | null) => {
        if (!fileList?.length || isUploading) return;

        setIsUploading(true);

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Sign in to upload files.");
                return;
            }

            for (const originalFile of Array.from(fileList)) {
                const typeError = validateFileTypeAndSize(originalFile);
                if (typeError) {
                    toast.error(typeError);
                    continue;
                }

                const file = await compressImageIfNeeded(originalFile);
                const checksum = await hashFile(file);

                const metadataResponse = await fetch("/api/materials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        room_id: roomId,
                        subject_id: selectedSubjectId,
                        file_name: file.name,
                        file_size: file.size,
                        file_type: file.type,
                        checksum,
                    }),
                });

                if (!metadataResponse.ok) {
                    const message = await metadataResponse.text();
                    toast.error(message || "Validation failed.");
                    continue;
                }

                const path = `materials/${roomId}/${user.id}/${Date.now()}-${file.name}`;
                const { error } = await supabase.storage.from("materials").upload(path, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type,
                });

                if (error) {
                    toast.error(error.message);
                    continue;
                }

                const { data } = supabase.storage.from("materials").getPublicUrl(path);
                const recordResponse = await fetch("/api/materials", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        room_id: roomId,
                        subject_id: selectedSubjectId,
                        file_name: file.name,
                        file_size: file.size,
                        file_url: data.publicUrl,
                        pinned: false,
                    }),
                });

                if (!recordResponse.ok) {
                    toast.error("Uploaded file but failed to save metadata.");
                } else {
                    toast.success(`${file.name} uploaded`);
                }
            }

            await onRefresh();
        } catch {
            toast.error("Upload failed unexpectedly.");
        } finally {
            setIsUploading(false);
        }
    };

    const deleteMaterial = async (item: Material) => {
        try {
            const response = await fetch(`/api/materials?id=${item.id}&room_id=${roomId}`, { method: "DELETE" });
            if (!response.ok) {
                toast.error("Unable to delete file.");
                return;
            }
            toast.success("Material removed");
            await onRefresh();
        } catch {
            toast.error("Delete failed.");
        }
    };

    const togglePin = async (item: Material) => {
        const response = await fetch("/api/materials", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, room_id: roomId, pinned: !item.pinned }),
        });

        if (!response.ok) {
            toast.error("Unable to update pin status.");
            return;
        }

        toast.success(item.pinned ? "Unpinned" : "Pinned");
        await onRefresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>The Vault (Low Storage Mode)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 rounded-lg border border-line bg-card p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted">Storage Used</span>
                        <span>{storagePercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={storagePercent} />
                </div>

                <div
                    className="mb-4 rounded-lg border border-dashed border-line-strong bg-black/30 p-4 text-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                        event.preventDefault();
                        void uploadFiles(event.dataTransfer.files);
                    }}
                >
                    <FileUp className="mx-auto mb-2 h-5 w-5 text-primary" />
                    <p className="text-sm text-muted">Drag and drop files here (max 25MB)</p>
                    <label className="mt-2 inline-block cursor-pointer rounded-md border border-line bg-card px-3 py-1.5 text-xs">
                        Browse Files
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png"
                            onChange={(event) => void uploadFiles(event.target.files)}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
                        <Input
                            className="pl-9"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search files"
                        />
                    </div>
                    <select
                        className="h-10 rounded-lg border border-line bg-black/40 px-2 text-sm"
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value)}
                    >
                        <option value="all">All types</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">DOCX</option>
                        <option value="pptx">PPTX</option>
                        <option value="xlsx">XLSX</option>
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                    </select>
                </div>

                <div className="space-y-2">
                    {filteredRows.length === 0 && <p className="text-sm text-muted">No materials found for this subject.</p>}
                    {filteredRows.map((item) => (
                        <div key={item.id} className="rounded-lg border border-line bg-card p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{item.file_name}</p>
                                    <p className="text-xs text-muted">
                                        {Math.round(item.file_size / 1024)} KB • {subjects.find((s) => s.id === item.subject_id)?.name ?? "Uncategorized"}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => void togglePin(item)}>
                                        <Pin className={`h-4 w-4 ${item.pinned ? "text-warning" : ""}`} />
                                    </Button>
                                    <a href={item.file_url} target="_blank" rel="noreferrer">
                                        <Button size="icon" variant="ghost">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                    {(item.uploaded_by === currentUserId || canModerate) && (
                                        <Button size="icon" variant="ghost" onClick={() => void deleteMaterial(item)}>
                                            <Trash2 className="h-4 w-4 text-danger" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
