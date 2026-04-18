"use client";

import Image from "next/image";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
    username: string;
    onSignOut: () => Promise<void>;
}

export function Navbar({ username, onSignOut }: NavbarProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-line/80 bg-background/90 backdrop-blur-lg">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="neon-ring grid h-10 w-10 place-items-center rounded-md border border-line-strong bg-black">
                        <Image src="/icon.png" alt="LOCKIN logo" width={24} height={24} className="h-6 w-6" priority />
                    </div>
                    <div>
                        <p className="font-heading text-xl tracking-[0.22em] text-primary">LOCKIN</p>
                        <p className="text-xs text-muted">Student Command Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button variant="secondary" size="icon" aria-label="Notifications">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <div className="hidden rounded-md border border-line bg-card px-3 py-2 text-xs text-muted sm:block">
                        Signed in as <span className="text-foreground">{username}</span>
                    </div>
                    <Button variant="danger" size="sm" onClick={onSignOut}>
                        <LogOut className="mr-1 h-3.5 w-3.5" />
                        Exit
                    </Button>
                </div>
            </div>
        </header>
    );
}
