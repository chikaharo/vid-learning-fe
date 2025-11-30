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

type Status = { type: "success" | "error"; message: string } | null;

interface CourseDetailClientProps {
	course: Course;
}

function sortLessons(list: Lesson[]) {
	return [...list].sort((a, b) => {
		const orderDiff = (a.order ?? 0) - (b.order ?? 0);
		if (orderDiff !== 0) {
			return orderDiff;
		}
		const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return aTime - bTime;
	});
}

function sortQuizzes(list: Quiz[]) {
	return [...list].sort((a, b) => {
		const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return bTime - aTime;
	});
}

export function CourseDetailClient({ course }: CourseDetailClientProps) {
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [lessonsLoading, setLessonsLoading] = useState(true);
	const [quizzesLoading, setQuizzesLoading] = useState(true);
	const [lessonDeletingId, setLessonDeletingId] = useState<string | null>(null);
	const [quizDeletingId, setQuizDeletingId] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>(null);
	const [user, setUser] = useState<StoredUser | null>(null);

	useEffect(() => {
		let ignore = false;
		setLessonsLoading(true);
		setQuizzesLoading(true);
		Promise.all([
			getLessonsForCourse(course.id),
			getQuizzesForCourse(course.id),
		])
			.then(([lessonData, quizData]) => {
				if (ignore) return;
				setLessons(sortLessons(lessonData));
				setQuizzes(sortQuizzes(quizData));
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
				setLessonsLoading(false);
				setQuizzesLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [course.id]);

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

	const isCourseCreator = Boolean(user?.id && course.instructor?.id === user.id);
	const isAdmin = user?.role === "ADMIN";
	const canManageCourse = isCourseCreator || Boolean(isAdmin);
	const disableMutations = !canManageCourse;
	const manageRestrictionMessage = !user
		? "Sign in to manage lessons and quizzes for this course."
		: isAdmin
		? ""
		: "Only the course creator can edit or delete this course content.";

	async function handleLessonDelete(id: string) {
		if (disableMutations) {
			setStatus({
				type: "error",
				message:
					manageRestrictionMessage ||
					"You don't have permission to change this course.",
			});
			return;
		}
		if (!window.confirm("Delete this lesson permanently?")) {
			return;
		}
		setLessonDeletingId(id);
		setStatus(null);
		try {
			await deleteLesson(id);
			setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
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
		if (disableMutations) {
			setStatus({
				type: "error",
				message:
					manageRestrictionMessage ||
					"You don't have permission to change this course.",
			});
			return;
		}
		if (!window.confirm("Delete this quiz permanently?")) {
			return;
		}
		setQuizDeletingId(id);
		setStatus(null);
		try {
			await deleteQuiz(id);
			setQuizzes((prev) => prev.filter((quiz) => quiz.id !== id));
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

	const lessonSummary = useMemo(() => {
		if (!lessons.length) {
			return "No lessons yet";
		}
		const totalMinutes = lessons.reduce(
			(sum, lesson) => sum + (lesson.durationMinutes ?? 0),
			0
		);
		return `${lessons.length} lessons · ${totalMinutes} minutes`;
	}, [lessons]);

	const quizSummary = useMemo(() => {
		if (!quizzes.length) {
			return "No quizzes yet";
		}
		return `${quizzes.length} quizzes`;
	}, [quizzes]);

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

			{disableMutations && manageRestrictionMessage && (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					{manageRestrictionMessage}
				</div>
			)}

			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Course overview
						</p>
						<h2 className="text-2xl font-semibold text-zinc-900">
							{course.title}
						</h2>
						<p className="mt-2 text-sm text-zinc-600">{course.description}</p>
					</div>
					<dl className="grid gap-4 text-sm text-zinc-600 md:grid-cols-2">
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
								{lessonSummary} · {quizSummary}
							</dd>
						</div>
					</dl>
				</div>
			</section>

			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Lessons
						</p>
						<h3 className="text-xl font-semibold text-zinc-900">
							Structured curriculum
						</h3>
					</div>
					{disableMutations ? (
						<button
							type="button"
							disabled
							title={manageRestrictionMessage || undefined}
							className="rounded-full border border-dashed border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400"
						>
							New lesson
						</button>
					) : (
						<Link
							href={`/dashboard/courses/${course.slug}/lessons/new`}
							className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
						>
							New lesson
						</Link>
					)}
				</div>
				<div className="mt-4 space-y-3">
					{lessonsLoading ? (
						<p className="text-sm text-zinc-500">Loading lessons…</p>
					) : lessons.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
							No lessons yet. Create the first lesson to kick off the
							curriculum.
						</p>
					) : (
						<ul className="space-y-3">
							{lessons.map((lesson) => (
								<li
									key={lesson.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3"
								>
									<div>
										<p className="text-sm font-semibold text-zinc-900">
											#{lesson.order ?? 0} · {lesson.title}
										</p>
										<p className="text-xs uppercase tracking-wide text-zinc-500">
											{lesson.durationMinutes ?? 0} min ·{" "}
											{lesson.isPreview ? "Preview" : "Locked"}
											{lesson.videoUrl ? " · Video ready" : ""}
											{lesson.content ? " · Notes" : ""}
										</p>
									</div>
									<div className="flex items-center gap-2">
										{disableMutations ? (
											<button
												type="button"
												disabled
												title={manageRestrictionMessage || undefined}
												className="rounded-full border border-dashed border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-400"
											>
												Edit
											</button>
										) : (
											<Link
												href={`/dashboard/courses/${course.slug}/lessons/${lesson.id}/edit`}
												className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
											>
												Edit
											</Link>
										)}
										<button
											type="button"
											onClick={() => handleLessonDelete(lesson.id)}
											disabled={
												disableMutations || lessonDeletingId === lesson.id
											}
											className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
										>
											{lessonDeletingId === lesson.id ? "Deleting…" : "Delete"}
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Quizzes
						</p>
						<h3 className="text-xl font-semibold text-zinc-900">
							Check learner progress
						</h3>
					</div>
					{disableMutations ? (
						<button
							type="button"
							disabled
							title={manageRestrictionMessage || undefined}
							className="rounded-full border border-dashed border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400"
						>
							New quiz
						</button>
					) : (
						<Link
							href={`/dashboard/courses/${course.slug}/quizzes/new`}
							className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
						>
							New quiz
						</Link>
					)}
				</div>
				<div className="mt-4 space-y-3">
					{quizzesLoading ? (
						<p className="text-sm text-zinc-500">Loading quizzes…</p>
					) : quizzes.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
							No quizzes yet. Add assessments to reinforce learning.
						</p>
					) : (
						<ul className="space-y-3">
							{quizzes.map((quiz) => (
								<li
									key={quiz.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3"
								>
									<div>
										<p className="text-sm font-semibold text-zinc-900">
											{quiz.title}
										</p>
										<p className="text-xs uppercase tracking-wide text-zinc-500">
											{quiz.isPublished ? "Published" : "Draft"} ·{" "}
											{quiz.lessonId ? "Linked to lesson" : "Course-wide"} ·{" "}
											{quiz.timeLimitSeconds
												? `${Math.round(quiz.timeLimitSeconds / 60)} min limit`
												: "No timer"}
										</p>
									</div>
									<div className="flex items-center gap-2">
										{disableMutations ? (
											<button
												type="button"
												disabled
												title={manageRestrictionMessage || undefined}
												className="rounded-full border border-dashed border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-400"
											>
												Edit
											</button>
										) : (
											<Link
												href={`/dashboard/courses/${course.slug}/quizzes/${quiz.id}/edit`}
												className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
											>
												Edit
											</Link>
										)}
										<button
											type="button"
											onClick={() => handleQuizDelete(quiz.id)}
											disabled={disableMutations || quizDeletingId === quiz.id}
											className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
										>
											{quizDeletingId === quiz.id ? "Deleting…" : "Delete"}
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	);
}
