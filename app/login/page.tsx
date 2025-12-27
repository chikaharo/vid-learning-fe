import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export const metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg">
      <div>
        <p className="text-sm font-semibold text-violet-600">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Log in to continue learning
        </h1>
        <p className="text-sm text-zinc-600">
          Use the same credentials as your NestJS backend (POST /auth/login).
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-zinc-900">
          Sign up instead
        </Link>
      </p>
    </div>
  );
}
