"use client";

import { useRouter } from "next/navigation";
import {
	useEffect,
	useState,
	type ChangeEvent,
	type FormEvent,
} from "react";

import { createQuiz, getLessonsForCourse, updateQuiz } from "@/lib/content-service";
import type { QuizPayload } from "@/lib/content-service";
import type { Lesson, Quiz } from "@/types/course";
import { AUTH_EVENT, getStoredUser, type StoredUser } from "@/lib/session";

interface QuizFormProps {
	courseId: string;
	courseSlug: string;
	mode: "create" | "edit";
	initialQuiz?: Quiz;
	initialLessons?: Lesson[];
	ownerId: string;
}

export function QuizForm({
	courseId,
	courseSlug,
	mode,
	initialQuiz,
	initialLessons = [],
	ownerId,
}: QuizFormProps) {
	const router = useRouter();
	const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
	const [isLoadingLessons, setIsLoadingLessons] = useState(false);
	const [form, setForm] = useState({
		title: initialQuiz?.title ?? "",
		description: initialQuiz?.description ?? "",
		timeLimitSeconds: initialQuiz?.timeLimitSeconds
			? String(initialQuiz.timeLimitSeconds)
			: "",
		isPublished: Boolean(initialQuiz?.isPublished),
		lessonId: initialQuiz?.lessonId ?? "",
	});
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [user, setUser] = useState<StoredUser | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const syncUser = () => setUser(getStoredUser());
		setUser(getStoredUser());
		window.addEventListener("storage", syncUser);
		window.addEventListener(AUTH_EVENT, syncUser);
		return () => {
			window.removeEventListener("storage", syncUser);
			window.removeEventListener(AUTH_EVENT, syncUser);
		};
	}, []);

	const isCourseOwner = Boolean(user?.id && user.id === ownerId);
	const isAdmin = user?.role === "ADMIN";
	const disableMutations = !(isCourseOwner || Boolean(isAdmin));
	const ownershipMessage = !user
		? "Sign in to create or edit quizzes for this course."
		: isAdmin
		? ""
		: "Only the course creator can change quizzes for this course.";

	useEffect(() => {
		if (initialLessons.length) return;
		setIsLoadingLessons(true);
		getLessonsForCourse(courseId)
			.then((data) => setLessons(data))
			.catch((err) =>
				setError(
					err instanceof Error
						? err.message
						: "Unable to load lessons for the dropdown."
				)
			)
			.finally(() => setIsLoadingLessons(false));
	}, [courseId, initialLessons.length]);

	useEffect(() => {
		if (!form.lessonId) return;
		if (!lessons.find((lesson) => lesson.id === form.lessonId)) {
			setForm((prev) => ({ ...prev, lessonId: "" }));
		}
	}, [lessons, form.lessonId]);

	function updateField(
		field: keyof typeof form
	): (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => void {
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
			setError("Quiz title is required.");
			return;
		}
		if (disableMutations) {
			setError(
				ownershipMessage || "You don't have permission to update this course."
			);
			return;
		}

		const payload: QuizPayload = {
			title: form.title.trim(),
			courseId,
			description: form.description.trim() || undefined,
			timeLimitSeconds: form.timeLimitSeconds
				? Number(form.timeLimitSeconds)
				: undefined,
			isPublished: form.isPublished,
			lessonId: form.lessonId || undefined,
		};

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createQuiz(payload);
				setStatus("Quiz created. Redirecting…");
			} else if (initialQuiz) {
				await updateQuiz(initialQuiz.id, payload);
				setStatus("Quiz updated. Redirecting…");
			}
			setTimeout(() => router.push(`/dashboard/courses/${courseSlug}`), 800);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to save quiz right now."
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
			{disableMutations && ownershipMessage && (
				<p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					{ownershipMessage}
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
					placeholder="Module checkpoint quiz"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Description
				</span>
				<textarea
					rows={4}
					value={form.description}
					onChange={updateField("description")}
					placeholder="Share context or instructions for this quiz."
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Time limit (seconds)
					</span>
					<input
						type="number"
						min={60}
						step={30}
						value={form.timeLimitSeconds}
						onChange={updateField("timeLimitSeconds")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Linked lesson (optional)
					</span>
					<select
						value={form.lessonId}
						onChange={updateField("lessonId")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					>
						<option value="">
							{isLoadingLessons ? "Loading…" : "Apply to entire course"}
						</option>
						{lessons.map((lesson) => (
							<option key={lesson.id} value={lesson.id}>
								#{lesson.order ?? 0} · {lesson.title}
							</option>
						))}
					</select>
				</label>
			</div>
			<label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
				<input
					type="checkbox"
					checked={form.isPublished}
					onChange={updateField("isPublished")}
					className="h-4 w-4 rounded border-zinc-300 text-violet-600"
				/>
				Publish quiz immediately
			</label>
			<button
				type="submit"
				disabled={disableMutations || isSubmitting}
				className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting
					? mode === "create"
						? "Creating quiz…"
						: "Saving changes…"
					: mode === "create"
						? "Create quiz"
						: "Save quiz"}
			</button>
		</form>
	);
}
