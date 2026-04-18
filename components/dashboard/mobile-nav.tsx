"use client";

import { BarChart3, FolderArchive, House, Timer } from "lucide-react";

const tabs = [
    { id: "overview", label: "Home", icon: House },
    { id: "tracker", label: "Track", icon: Timer },
    { id: "analytics", label: "Stats", icon: BarChart3 },
    { id: "vault", label: "Vault", icon: FolderArchive },
] as const;

interface MobileNavProps {
    selected: (typeof tabs)[number]["id"];
    onSelect: (value: (typeof tabs)[number]["id"]) => void;
}

export function MobileNav({ selected, onSelect }: MobileNavProps) {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-background/95 p-2 backdrop-blur lg:hidden">
            <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = selected === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onSelect(tab.id)}
                            className={`rounded-lg px-1 py-2 text-center text-xs ${active ? "bg-primary/12 text-primary" : "text-muted"
                                }`}
                        >
                            <Icon className="mx-auto mb-1 h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
