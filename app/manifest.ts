import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "LOCKIN",
        short_name: "LOCKIN",
        description:
            "Cyber-military command center for engineering students preparing for April 2026 B.Tech S4 exams.",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#060906",
        theme_color: "#53ff78",
        lang: "en",
        orientation: "portrait",
        icons: [
            {
                src: "/icon.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
