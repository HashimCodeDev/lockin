"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/supabase/client";

interface AuthFormProps {
    mode: "sign-in" | "sign-up";
}

export function AuthForm({ mode }: AuthFormProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const isSignUp = mode === "sign-up";

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();

            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                    },
                });

                if (error) {
                    toast.error(error.message);
                    return;
                }

                toast.success("Account created. Check your email to confirm login.");
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Welcome back. Redirecting...");
            window.location.href = "/dashboard";
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="grid min-h-screen place-items-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isSignUp ? "Create LOCKIN Account" : "Sign in to LOCKIN"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-3" onSubmit={submit}>
                        {isSignUp && (
                            <label className="block space-y-1">
                                <span className="text-xs uppercase tracking-wider text-muted">Username</span>
                                <Input required value={username} onChange={(event) => setUsername(event.target.value)} />
                            </label>
                        )}
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Email</span>
                            <Input
                                required
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted">Password</span>
                            <Input
                                required
                                type="password"
                                minLength={8}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        </label>

                        <Button className="w-full" disabled={loading}>
                            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted">
                        {isSignUp ? "Already have an account?" : "Need an account?"} {" "}
                        <Link className="text-primary underline" href={isSignUp ? "/sign-in" : "/sign-up"}>
                            {isSignUp ? "Sign in" : "Sign up"}
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
