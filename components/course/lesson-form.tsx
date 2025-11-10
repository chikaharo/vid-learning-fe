"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { createLesson, updateLesson } from "@/lib/content-service";
import type { LessonPayload } from "@/lib/content-service";
import type { Lesson } from "@/types/course";
import { getStoredUser } from "@/lib/session";

interface LessonFormProps {
	courseId: string;
	courseSlug: string;
	mode: "create" | "edit";
	initialLesson?: Lesson;
}

export function LessonForm({
	courseId,
	courseSlug,
	mode,
	initialLesson,
}: LessonFormProps) {
	const router = useRouter();
	const [form, setForm] = useState({
		title: initialLesson?.title ?? "",
		durationMinutes: String(initialLesson?.durationMinutes ?? 5),
		order: String(initialLesson?.order ?? 0),
		isPreview: Boolean(initialLesson?.isPreview),
	});
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const disableMutations = !getStoredUser();

	function updateField(
		field: keyof typeof form
	): (event: ChangeEvent<HTMLInputElement>) => void {
		return (event) => {
			const value =
				event.target.type === "checkbox"
					? (event.target as HTMLInputElement).checked
					: event.target.value;
			setForm((prev) => ({ ...prev, [field]: value }));
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus(null);
		setError(null);

		if (!form.title.trim()) {
			setError("Lesson title is required.");
			return;
		}

		const payload: LessonPayload = {
			title: form.title.trim(),
			courseId,
			durationMinutes: Number(form.durationMinutes) || 5,
			order: Number(form.order) || 0,
			isPreview: form.isPreview,
		};

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createLesson(payload);
				setStatus("Lesson created. Redirecting…");
			} else if (initialLesson) {
				await updateLesson(initialLesson.id, payload);
				setStatus("Lesson updated. Redirecting…");
			}
			setTimeout(() => router.push(`/dashboard/courses/${courseSlug}`), 800);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to save lesson right now."
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
			{status && (
				<p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					{status}
				</p>
			)}
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Title
				</span>
				<input
					type="text"
					value={form.title}
					onChange={updateField("title")}
					placeholder="Design systems for discovery"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Duration (minutes)
					</span>
					<input
						type="number"
						min={1}
						value={form.durationMinutes}
						onChange={updateField("durationMinutes")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Display order
					</span>
					<input
						type="number"
						min={0}
						value={form.order}
						onChange={updateField("order")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					/>
				</label>
			</div>
			<label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
				<input
					type="checkbox"
					checked={form.isPreview}
					onChange={updateField("isPreview")}
					className="h-4 w-4 rounded border-zinc-300 text-violet-600"
				/>
				Mark as preview lesson
			</label>
			<button
				type="submit"
				disabled={disableMutations || isSubmitting}
				className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting
					? mode === "create"
						? "Creating lesson…"
						: "Saving changes…"
					: mode === "create"
						? "Create lesson"
						: "Save lesson"}
			</button>
		</form>
	);
}
