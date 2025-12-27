"use client";

import { registerUser, type UserRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

const roleOptions: UserRole[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];

export function RegisterForm() {
	const router = useRouter();
	const [form, setForm] = useState({
		fullName: "",
		email: "",
		password: "",
		role: "STUDENT" as UserRole,
		avatarUrl: "",
		bio: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	function updateField(field: keyof typeof form) {
		return (
			event:
				| ChangeEvent<HTMLInputElement>
				| ChangeEvent<HTMLSelectElement>
				| ChangeEvent<HTMLTextAreaElement>
		) => {
			setForm((prev) => ({ ...prev, [field]: event.target.value }));
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccessMessage(null);

		const payload = {
			email: form.email,
			password: form.password,
			fullName: form.fullName,
			role: form.role,
			...(form.avatarUrl ? { avatarUrl: form.avatarUrl } : {}),
			...(form.bio ? { bio: form.bio } : {}),
		};

		try {
			await registerUser(payload);
			setSuccessMessage("Account created! Redirecting to login…");
			setForm({
				fullName: "",
				email: "",
				password: "",
				role: "STUDENT",
				avatarUrl: "",
				bio: "",
			});
			setTimeout(() => router.push("/login"), 800);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to create your account. Please try again."
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			{error && (
				<p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</p>
			)}
			{successMessage && (
				<p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					{successMessage}
				</p>
			)}
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Full name
				</span>
				<input
					type="text"
					required
					value={form.fullName}
					onChange={updateField("fullName")}
					placeholder="Amelia Nguyen"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Email address
				</span>
				<input
					type="email"
					required
					autoComplete="email"
					value={form.email}
					onChange={updateField("email")}
					placeholder="you@example.com"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Password
				</span>
				<input
					type="password"
					required
					minLength={8}
					autoComplete="new-password"
					value={form.password}
					onChange={updateField("password")}
					placeholder="••••••••"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Role
				</span>
				<select
					value={form.role}
					onChange={updateField("role")}
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				>
					{roleOptions.map((role) => (
						<option key={role} value={role}>
							{role.charAt(0)}
							{role.slice(1).toLowerCase()}
						</option>
					))}
				</select>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Avatar URL (optional)
				</span>
				<input
					type="url"
					value={form.avatarUrl}
					onChange={updateField("avatarUrl")}
					placeholder="https://yourcdn.com/avatar.png"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Bio (optional)
				</span>
				<textarea
					rows={3}
					value={form.bio}
					onChange={updateField("bio")}
					placeholder="Tell learners why they should join your course."
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full rounded-full bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting ? "Creating account…" : "Create account"}
			</button>
		</form>
	);
}
