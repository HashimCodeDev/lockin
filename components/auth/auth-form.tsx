"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

interface AuthFormProps {
    mode: "sign-in" | "sign-up";
}

function GoogleIcon() {
    return (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
            <path
                d="M21.35 11.1H12v2.96h5.37c-.23 1.5-1.76 4.4-5.37 4.4-3.24 0-5.88-2.68-5.88-5.98s2.64-5.98 5.88-5.98c1.85 0 3.09.79 3.8 1.47l2.59-2.5C16.74 3.93 14.62 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.19 0 8.63-3.65 8.63-8.8 0-.59-.06-1.04-.14-1.45Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function AuthForm({ mode }: AuthFormProps) {
    const searchParams = useSearchParams();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loadingAction, setLoadingAction] = useState<"credentials" | "google" | null>(null);
    const oauthErrorHandledRef = useRef(false);

    const isSignUp = mode === "sign-up";
    const isLoading = loadingAction !== null;
    const isCredentialsLoading = loadingAction === "credentials";
    const isGoogleLoading = loadingAction === "google";

    useEffect(() => {
        if (oauthErrorHandledRef.current) {
            return;
        }

        if (searchParams.get("error") === "google_oauth_failed") {
            toast.error("Google sign in failed. Please try again.");
            oauthErrorHandledRef.current = true;
        }
    }, [searchParams]);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoadingAction("credentials");

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
            setLoadingAction(null);
        }
    };

    const signInWithGoogle = async () => {
        setLoadingAction("google");

        try {
            const supabase = createClient();
            const callbackUrl = new URL("/auth/callback", window.location.origin);
            callbackUrl.searchParams.set("next", "/dashboard");

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: callbackUrl.toString(),
                },
            });

            if (error) {
                toast.error(error.message);
                setLoadingAction(null);
            }
        } catch {
            toast.error("Google sign in failed. Please try again.");
            setLoadingAction(null);
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

                        <Button className="w-full" disabled={isLoading}>
                            {isCredentialsLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                        </Button>
                    </form>

                    <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
                        <span className="h-px flex-1 bg-line" />
                        or continue with
                        <span className="h-px flex-1 bg-line" />
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full gap-2"
                        onClick={signInWithGoogle}
                        disabled={isLoading}
                    >
                        <GoogleIcon />
                        {isGoogleLoading ? "Redirecting..." : "Google"}
                    </Button>

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
