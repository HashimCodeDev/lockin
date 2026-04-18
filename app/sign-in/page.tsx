import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const unstable_instant = { prefetch: "static" };

export default function SignInPage() {
    return (
        <Suspense fallback={<main className="grid min-h-screen place-items-center px-4 text-sm text-muted">Loading sign in...</main>}>
            <AuthForm mode="sign-in" />
        </Suspense>
    );
}
