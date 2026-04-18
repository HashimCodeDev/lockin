import { AuthForm } from "@/components/auth/auth-form";

export const unstable_instant = { prefetch: "static" };

export default function SignInPage() {
    return <AuthForm mode="sign-in" />;
}
