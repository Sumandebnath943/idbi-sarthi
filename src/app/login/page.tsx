import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · IDBI SARTHI" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
