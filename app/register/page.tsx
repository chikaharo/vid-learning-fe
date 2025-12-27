import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export const metadata = {
  title: "Sign up",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg">
      <div>
        <p className="text-sm font-semibold text-violet-600">
          Start teaching & learning
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Create your Video Learning account
        </h1>
        <p className="text-sm text-zinc-600">
          Accounts map to the NestJS `/users` endpoint. Passwords must be 8+
          characters.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-zinc-600">
        Already learning with us?{" "}
        <Link href="/login" className="font-semibold text-zinc-900">
          Log in
        </Link>
      </p>
    </div>
  );
}
