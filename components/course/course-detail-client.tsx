"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Course, Lesson, Quiz } from "@/types/course";
import {
	deleteLesson,
	deleteQuiz,
	getLessonsForCourse,
	getQuizzesForCourse,
} from "@/lib/content-service";
import { AUTH_EVENT, getStoredUser, type StoredUser } from "@/lib/session";

export type CurriculumItem = (Lesson & { type: "lesson" }) | (Quiz & { type: "quiz" });

type Status = { type: "success" | "error"; message: string } | null;

interface CourseDetailClientProps {
	course: Course;
}





// Combined sort for CurriculumItem
function sortCurriculumItems(list: CurriculumItem[]) {
    return [...list].sort((a, b) => {
        // Prioritize lessons over quizzes if types are different
        if (a.type === "lesson" && b.type === "quiz") return -1;
        if (a.type === "quiz" && b.type === "lesson") return 1;

        // Sort by order for lessons
        if (a.type === "lesson" && b.type === "lesson") {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) {
                return orderDiff;
            }
        }

        // Fallback to createdAt for both lessons and quizzes
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
    });
}

export function CourseDetailClient({ course }: CourseDetailClientProps) {
	const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
	const [curriculumLoading, setCurriculumLoading] = useState(true);
	const [lessonDeletingId, setLessonDeletingId] = useState<string | null>(null);
	const [quizDeletingId, setQuizDeletingId] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>(null);
	const [user, setUser] = useState<StoredUser | null>(() =>
		typeof window === "undefined" ? null : getStoredUser()
	);

	useEffect(() => {
		let ignore = false;
		setCurriculumLoading(true);
		Promise.all([
			getLessonsForCourse(course.id),
			getQuizzesForCourse(course.id),
		])
			.then(([lessonData, quizData]) => {
				if (ignore) return;
				const combined: CurriculumItem[] = [
					...lessonData.map((lesson) => ({ ...lesson, type: "lesson" as const })),
					...quizData.map((quiz) => ({ ...quiz, type: "quiz" as const })),
				];
				setCurriculumItems(sortCurriculumItems(combined));
			})
			.catch((error) => {
				if (ignore) return;
				setStatus({
					type: "error",
					message:
						error instanceof Error
							? error.message
							: "Unable to load course content.",
				});
			})
			.finally(() => {
				if (ignore) return;
				setCurriculumLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [course.id]);

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

	const disableMutations = !user;

	async function handleLessonDelete(id: string) {
		if (!window.confirm("Delete this lesson permanently?")) {
			return;
		}
		setLessonDeletingId(id);
		setStatus(null);
		try {
			await deleteLesson(id);
			setCurriculumItems((prev) =>
				sortCurriculumItems(prev.filter((item) => !(item.type === "lesson" && item.id === id)))
			);
			setStatus({ type: "success", message: "Lesson removed." });
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error ? error.message : "Unable to delete lesson.",
			});
		} finally {
			setLessonDeletingId(null);
		}
	}

	async function handleQuizDelete(id: string) {
		if (!window.confirm("Delete this quiz permanently?")) {
			return;
		}
		setQuizDeletingId(id);
		setStatus(null);
		try {
			await deleteQuiz(id);
			setCurriculumItems((prev) =>
				sortCurriculumItems(prev.filter((item) => !(item.type === "quiz" && item.id === id)))
			);
			setStatus({ type: "success", message: "Quiz removed." });
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error ? error.message : "Unable to delete quiz.",
			});
		} finally {
			setQuizDeletingId(null);
		}
	}

	const curriculumSummary = useMemo(() => {
		if (!curriculumItems.length) {
			return "No content yet";
		}
		const totalLessons = curriculumItems.filter(item => item.type === "lesson").length;
		const totalQuizzes = curriculumItems.filter(item => item.type === "quiz").length;
		const totalMinutes = curriculumItems.reduce(
			(sum, item) => sum + (item.type === "lesson" ? (item.durationMinutes ?? 0) : 0),
			0
		);

		const summaryParts: string[] = [];
		if (totalLessons > 0) {
			summaryParts.push(`${totalLessons} lessons`);
		}
		if (totalQuizzes > 0) {
			summaryParts.push(`${totalQuizzes} quizzes`);
		}
		if (totalMinutes > 0) {
			summaryParts.push(`${totalMinutes} minutes`);
		}

		return summaryParts.join(" · ");
	}, [curriculumItems]);

	return (
		<div className="space-y-6">
			{status && (
				<div
					className={`rounded-2xl border px-4 py-3 text-sm ${
						status.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-800"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{status.message}
				</div>
			)}

			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
					<div className="flex-1 md:pr-8">
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Course overview
						</p>
						<h2 className="text-2xl font-semibold text-zinc-900">
							{course.title}
						</h2>
						<p className="mt-2 text-sm text-zinc-600">{course.description}</p>
					</div>
					<dl className="grid w-full shrink-0 gap-x-8 gap-y-4 text-sm text-zinc-600 md:w-auto md:grid-cols-2">
						<div>
							<dt className="text-xs uppercase tracking-wide text-zinc-500">
								Level
							</dt>
							<dd className="font-semibold text-zinc-900">{course.level}</dd>
						</div>
						<div>
							<dt className="text-xs uppercase tracking-wide text-zinc-500">
								Duration
							</dt>
							<dd className="font-semibold text-zinc-900">
								{Math.round(course.durationMinutes)} min
							</dd>
						</div>
						<div>
							<dt className="text-xs uppercase tracking-wide text-zinc-500">
								Categories
							</dt>
							<dd className="font-semibold text-zinc-900">
								{course.categories.join(", ")}
							</dd>
						</div>
						<div>
							<dt className="text-xs uppercase tracking-wide text-zinc-500">
								Content
							</dt>
							<dd className="font-semibold text-zinc-900">
								{curriculumSummary}
							</dd>
						</div>
					</dl>
				</div>
			</section>

			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Curriculum
						</p>
						<h3 className="text-xl font-semibold text-zinc-900">
							Lessons & Quizzes
						</h3>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href={`/dashboard/courses/${course.slug}/lessons/new`}
							className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
						>
							New lesson
						</Link>
						<Link
							href={`/dashboard/courses/${course.slug}/quizzes/new`}
							className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
						>
							New quiz
						</Link>
					</div>
				</div>
				<div className="mt-4 flex flex-col gap-3">
					{curriculumLoading ? (
						<p className="text-sm text-zinc-500">Loading curriculum…</p>
					) : curriculumItems.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
							No lessons or quizzes yet. Add content to build your curriculum.
						</p>
					) : (
						<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-thumb-zinc-300 scrollbar-thumb-rounded-full scrollbar-track-zinc-100 scrollbar-w-2">
							{curriculumItems.map((item) => (
								<div
									key={item.id}
									className="w-80 shrink-0 snap-center rounded-2xl border border-zinc-200 bg-white p-4"
								>
									{item.type === "lesson" ? (
										<>
											<p className="text-sm font-semibold text-zinc-900">
												#{item.order ?? 0} · {item.title}
											</p>
											<p className="text-xs uppercase tracking-wide text-zinc-500">
												{item.durationMinutes ?? 0} min ·{" "}
												{item.isPreview ? "Preview" : "Locked"}
												{item.videoUrl ? " · Video ready" : ""}
												{item.content ? " · Notes" : ""}
											</p>
											<div className="mt-3 flex items-center gap-2">
												<Link
													href={`/dashboard/courses/${course.slug}/lessons/${item.id}/edit`}
													className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
												>
													Edit
												</Link>
												<button
													type="button"
													onClick={() => handleLessonDelete(item.id)}
													disabled={
														disableMutations || lessonDeletingId === item.id
													}
													className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
												>
													{lessonDeletingId === item.id ? "Deleting…" : "Delete"}
												</button>
											</div>
										</>
									) : (
										<>
											<p className="text-sm font-semibold text-zinc-900">
												{item.title}
											</p>
											<p className="text-xs uppercase tracking-wide text-zinc-500">
												{item.isPublished ? "Published" : "Draft"} ·{" "}
												{item.lessonId ? "Linked to lesson" : "Course-wide"} ·{" "}
												{item.timeLimitSeconds
													? `${Math.round(item.timeLimitSeconds / 60)} min limit`
													: "No timer"}
											</p>
											<div className="mt-3 flex items-center gap-2">
												<Link
													href={`/dashboard/courses/${course.slug}/quizzes/${item.id}/edit`}
													className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
												>
													Edit
												</Link>
												<button
													type="button"
													onClick={() => handleQuizDelete(item.id)}
													disabled={
														disableMutations || quizDeletingId === item.id
													}
													className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
												>
													{quizDeletingId === item.id ? "Deleting…" : "Delete"}
												</button>
											</div>
										</>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
