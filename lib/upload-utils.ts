import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE } from "@/lib/constants";

export function validateFileTypeAndSize(file: File) {
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
        return "File type not allowed. Upload PDF, DOCX, PPTX, XLSX, JPG or PNG only.";
    }

    if (file.size > MAX_UPLOAD_SIZE) {
        return "File exceeds 25MB limit.";
    }

    return null;
}

export async function hashFile(file: File) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function compressImageIfNeeded(file: File) {
    if (!["image/png", "image/jpeg"].includes(file.type)) {
        return file;
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = URL.createObjectURL(file);
    });

    const maxWidth = 1920;
    const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.8);
    });

    if (!blob || blob.size >= file.size) {
        return file;
    }

    return new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
}
