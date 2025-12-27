"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCourse, type CoursePayload } from "@/lib/content-service";
import { getStoredUser } from "@/lib/session";

interface CourseFormState {
	title: string;
	slug: string;
	description: string;
	level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
	durationMinutes: string;
	isPublished: boolean;
	tags: string;
	thumbnailUrl: string;
}

const emptyForm: CourseFormState = {
	title: "",
	slug: "",
	description: "",
	level: "BEGINNER",
	durationMinutes: "0",
	isPublished: false,
	tags: "",
	thumbnailUrl: "",
};

type Status = { type: "success" | "error"; message: string } | null;

export default function CreateCoursePage() {
	const router = useRouter();
	const [form, setForm] = useState<CourseFormState>(emptyForm);
	const [status, setStatus] = useState<Status>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function updateField(
		field: keyof CourseFormState
	): (
		event: ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
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

		const user = getStoredUser();
		if (!user) {
			setStatus({
				type: "error",
				message: "You must be logged in to create a course.",
			});
			return;
		}

		if (!form.title.trim() || !form.slug.trim()) {
			setStatus({
				type: "error",
				message: "Title and slug are required.",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const tags = form.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean);

			const payload: CoursePayload = {
				title: form.title.trim(),
				slug: form.slug.trim(),
				description: form.description.trim() || undefined,
				level: form.level,
				durationMinutes: Number(form.durationMinutes) || 0,
				isPublished: form.isPublished,
				tags,
				thumbnailUrl: form.thumbnailUrl.trim() || undefined,
				instructorId: user.id,
			};

			const created = await createCourse(payload);
			setStatus({
				type: "success",
				message: "Course created successfully. Redirecting...",
			});
			// Redirect to the course details or management page
			setTimeout(() => {
				router.push(`/dashboard/courses/${created.slug}`);
			}, 1000);
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to create course. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="max-w-2xl mx-auto space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">Course Creator</p>
				<h1 className="text-3xl font-semibold text-zinc-900">
					Create a new course
				</h1>
				<p className="text-sm text-zinc-600">
					Fill in the details below to start your new curriculum.
				</p>
			</header>

			{status && (
				<div
					className={`rounded-2xl border px-4 py-3 text-sm ${
						status.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{status.message}
				</div>
			)}

			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Title
						</span>
						<input
							type="text"
							value={form.title}
							onChange={updateField("title")}
							placeholder="Course Title"
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
							required
						/>
					</label>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Slug
						</span>
						<input
							type="text"
							value={form.slug}
							onChange={updateField("slug")}
							placeholder="course-slug"
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
							required
						/>
					</label>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Description
						</span>
						<textarea
							value={form.description}
							onChange={updateField("description")}
							rows={4}
							placeholder="Course description..."
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
						/>
					</label>
					<div className="grid gap-4 md:grid-cols-2">
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Level
							</span>
							<select
								value={form.level}
								onChange={updateField("level")}
								className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
							>
								<option value="BEGINNER">Beginner</option>
								<option value="INTERMEDIATE">Intermediate</option>
								<option value="ADVANCED">Advanced</option>
							</select>
						</label>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Duration (minutes)
							</span>
							<input
								type="number"
								min={0}
								value={form.durationMinutes}
								onChange={updateField("durationMinutes")}
								className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
							/>
						</label>
					</div>
					<label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
						<input
							type="checkbox"
							checked={form.isPublished}
							onChange={updateField("isPublished")}
							className="h-4 w-4 rounded border-zinc-300 text-violet-600"
						/>
						Visible to learners (published)
					</label>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Tags (comma separated)
						</span>
						<input
							type="text"
							value={form.tags}
							onChange={updateField("tags")}
							placeholder="video, learning, design"
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
						/>
					</label>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Thumbnail url
						</span>
						<input
							type="text"
							value={form.thumbnailUrl}
							onChange={updateField("thumbnailUrl")}
							placeholder="thumbnail image url"
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
						/>
					</label>
					<div className="flex gap-4 pt-4">
						<button
							type="button"
							onClick={() => router.back()}
							className="flex-1 rounded-full border border-zinc-200 px-4 py-3 font-medium text-zinc-900 transition hover:bg-zinc-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 rounded-full bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSubmitting ? "Creating…" : "Create course"}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
