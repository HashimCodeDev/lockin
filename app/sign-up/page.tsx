import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const unstable_instant = { prefetch: "static" };

export default function SignUpPage() {
    return (
        <Suspense fallback={<main className="grid min-h-screen place-items-center px-4 text-sm text-muted">Loading sign up...</main>}>
            <AuthForm mode="sign-up" />
        </Suspense>
    );
}
