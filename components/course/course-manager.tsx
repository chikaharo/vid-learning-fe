"use client";

import {
	useEffect,
	useMemo,
	useState,
	type ChangeEvent,
	type FormEvent,
} from "react";

import type { Course } from "@/types/course";
import {
	createCourse,
	deleteCourse,
	fetchLiveCourses,
	updateCourse,
	type CoursePayload,
	type CourseUpdatePayload,
} from "@/lib/content-service";
import { AUTH_EVENT, getStoredUser, type StoredUser } from "@/lib/session";

interface CourseManagerProps {
	initialCourses: Course[];
}

interface CourseFormState {
	title: string;
	slug: string;
	description: string;
	level: Course["level"];
	durationMinutes: string;
	isPublished: boolean;
	tags: string;
	thumbnailUrl: string;
}

type Status = { type: "success" | "error" | "info"; message: string } | null;

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

function courseToFormState(course: Course): CourseFormState {
	return {
		title: course.title,
		slug: course.slug,
		description: course.description ?? "",
		level: course.level,
		durationMinutes: String(course.durationMinutes ?? 0),
		isPublished: Boolean(course.isPublished),
		tags: course.tags.join(", "),
		thumbnailUrl: course.thumbnailUrl ?? "",
	};
}

export function CourseManager({ initialCourses }: CourseManagerProps) {
	const [courses, setCourses] = useState<Course[]>(initialCourses);
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
	const [form, setForm] = useState<CourseFormState>(emptyForm);
	const [status, setStatus] = useState<Status>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [user, setUser] = useState<StoredUser | null>(() =>
		typeof window === "undefined" ? null : getStoredUser()
	);

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === selectedCourseId) ?? null,
		[courses, selectedCourseId]
	);

	useEffect(() => {
		setForm(selectedCourse ? courseToFormState(selectedCourse) : emptyForm);
	}, [selectedCourse]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const syncUser = () => setUser(getStoredUser());

		window.addEventListener("storage", syncUser);
		window.addEventListener(AUTH_EVENT, syncUser);
		return () => {
			window.removeEventListener("storage", syncUser);
			window.removeEventListener(AUTH_EVENT, syncUser);
		};
	}, []);

	const sortedCourses = useMemo(() => {
		return [...courses].sort((a, b) => {
			const aTime = new Date(a.updatedAt).getTime();
			const bTime = new Date(b.updatedAt).getTime();
			return bTime - aTime;
		});
	}, [courses]);

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

	function resetForm() {
		setSelectedCourseId(null);
		setForm(emptyForm);
		setStatus(null);
	}

	function derivePayloadBase() {
		const tags = form.tags
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);

		return {
			title: form.title.trim(),
			slug: form.slug.trim(),
			description: form.description.trim() || undefined,
			level: form.level,
			durationMinutes: Number(form.durationMinutes) || 0,
			isPublished: form.isPublished,
			tags,
			thumbnailUrl: form.thumbnailUrl.trim() || undefined,
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus(null);

		if (!form.title.trim() || !form.slug.trim()) {
			setStatus({
				type: "error",
				message: "Title and slug are required.",
			});
			return;
		}

		const basePayload = derivePayloadBase();
		setIsSubmitting(true);

		try {
			if (selectedCourse) {
				const payload: CourseUpdatePayload = user?.id
					? { ...basePayload, instructorId: user.id }
					: basePayload;
				const updated = await updateCourse(selectedCourse.id, payload);
				setCourses((prev) =>
					prev.map((course) => (course.id === updated.id ? updated : course))
				);
				setStatus({
					type: "success",
					message: "Course updated successfully.",
				});
			} else {
				if (!user?.id) {
					throw new Error("You need to sign in before creating courses.");
				}

				const payload: CoursePayload = {
					...basePayload,
					instructorId: user.id,
				};
				const created = await createCourse(payload);
				setCourses((prev) => [created, ...prev]);
				setSelectedCourseId(created.id);
				setStatus({
					type: "success",
					message: "Course created successfully.",
				});
			}
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to save course. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDelete(id: string) {
		if (!window.confirm("This will permanently delete the course. Continue?")) {
			return;
		}

		setDeletingId(id);
		setStatus(null);
		try {
			await deleteCourse(id);
			setCourses((prev) => prev.filter((course) => course.id !== id));
			if (selectedCourseId === id) {
				resetForm();
			}
			setStatus({
				type: "success",
				message: "Course deleted.",
			});
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to delete the course.",
			});
		} finally {
			setDeletingId(null);
		}
	}

	async function handleRefresh() {
		setIsRefreshing(true);
		setStatus(null);
		try {
			const fresh = await fetchLiveCourses();
			setCourses(fresh);
			if (selectedCourseId) {
				const stillExists = fresh.find(
					(course) => course.id === selectedCourseId
				);
				if (!stillExists) {
					resetForm();
				}
			}
			setStatus({
				type: "success",
				message: "Courses synced with the API.",
			});
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to refresh courses from the API.",
			});
		} finally {
			setIsRefreshing(false);
		}
	}

	const disableMutations = !user;

	return (
		<div className="space-y-6">
			{status && (
				<div
					className={`rounded-2xl border px-4 py-3 text-sm ${
						status.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: status.type === "error"
							? "border-red-200 bg-red-50 text-red-700"
							: "border-blue-200 bg-blue-50 text-blue-700"
					}`}
				>
					{status.message}
				</div>
			)}

			{disableMutations && (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Sign in to create, edit, or delete courses. Viewing is available
					without authentication.
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={handleRefresh}
					disabled={isRefreshing}
					className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isRefreshing ? "Refreshing…" : "Refresh from API"}
				</button>
				<button
					type="button"
					onClick={resetForm}
					className="rounded-full border border-transparent bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
				>
					New course
				</button>
				{user && (
					<p className="text-sm text-zinc-500">
						Editing as{" "}
						<span className="font-medium text-zinc-900">
							{user.fullName ?? user.name ?? user.email}
						</span>
					</p>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
				<section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6">
					<header className="flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								{sortedCourses.length} Courses
							</p>
							<h2 className="text-xl font-semibold text-zinc-900">
								Published + drafts
							</h2>
						</div>
					</header>
					{sortedCourses.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
							No courses yet. Create one using the form on the right.
						</p>
					) : (
						<div className="space-y-3">
							{sortedCourses.map((course) => (
								<article
									key={course.id}
									className={`rounded-2xl border px-4 py-3 text-sm transition ${
										course.id === selectedCourseId
											? "border-violet-300 bg-violet-50"
											: "border-zinc-200 bg-white hover:border-zinc-300"
									}`}
								>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="font-semibold text-zinc-900">
												{course.title}
											</p>
											<p className="text-xs uppercase tracking-wide text-zinc-500">
												{course.level} · {course.durationMinutes} min ·{" "}
												{course.isPublished ? "Published" : "Draft"}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => setSelectedCourseId(course.id)}
												className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-900 transition hover:border-zinc-900"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => handleDelete(course.id)}
												disabled={disableMutations || deletingId === course.id}
												className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{deletingId === course.id ? "Deleting…" : "Delete"}
											</button>
										</div>
									</div>
								</article>
							))}
						</div>
					)}
				</section>

				<section className="rounded-3xl border border-zinc-200 bg-white p-6">
					<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						{selectedCourse ? "Edit course" : "Create course"}
					</p>
					<h2 className="text-2xl font-semibold text-zinc-900">
						{selectedCourse ? selectedCourse.title : "New curriculum"}
					</h2>
					<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Title
							</span>
							<input
								type="text"
								value={form.title}
								onChange={updateField("title")}
								placeholder="Production-ready course builder"
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
								placeholder="production-ready-course-builder"
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
								placeholder="Tell learners why this course matters."
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
							<span className="mt-1 block text-xs text-zinc-500">
								Thumbnail shown on course cards.
							</span>
						</label>
						<button
							type="submit"
							disabled={disableMutations || isSubmitting}
							className="w-full rounded-full bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{selectedCourse
								? isSubmitting
									? "Saving changes…"
									: "Save changes"
								: isSubmitting
								? "Creating…"
								: "Create course"}
						</button>
					</form>
				</section>
			</div>
		</div>
	);
}
