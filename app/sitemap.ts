import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://lockin.vercel.app";

    return [
        {
            url: `${base}/sign-in`,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${base}/sign-up`,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${base}/dashboard`,
            changeFrequency: "daily",
            priority: 1,
        },
    ];
}
