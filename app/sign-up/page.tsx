import { AuthForm } from "@/components/auth/auth-form";

export const unstable_instant = { prefetch: "static" };

export default function SignUpPage() {
    return <AuthForm mode="sign-up" />;
}
