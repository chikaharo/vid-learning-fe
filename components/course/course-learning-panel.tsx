"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

import {
	getLessonsForCourse,
	getQuizzesForCourse,
	updateEnrollment,
} from "@/lib/content-service";
import type { Course, Enrollment, Lesson, Quiz } from "@/types/course";

interface CourseLearningPanelProps {
	course: Course;
	enrollment: Enrollment;
	onEnrollmentUpdate?: (enrollment: Enrollment) => void;
}

type ActiveItem = { type: "lesson"; id: string } | { type: "quiz"; id: string };

export function CourseLearningPanel({
	course,
	enrollment,
	onEnrollmentUpdate,
}: CourseLearningPanelProps) {
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
	const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(
		() => enrollment.completedLessonIds ?? []
	);
	const [isSavingProgress, setIsSavingProgress] = useState(false);
	const [progressMessage, setProgressMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		setCompletedLessonIds(enrollment.completedLessonIds ?? []);
	}, [enrollment.completedLessonIds]);

	useEffect(() => {
		let ignore = false;

		async function load() {
			if (ignore) return;
			setLoading(true);
			setError(null);
			try {
				const [lessonsData, quizzesData] = await Promise.all([
					getLessonsForCourse(course.id),
					getQuizzesForCourse(course.id),
				]);
				if (ignore) return;
				setLessons(lessonsData);
				setQuizzes(quizzesData);
				setActiveItem((prev) => {
					if (prev) return prev;
					if (lessonsData[0]) {
						return { type: "lesson", id: lessonsData[0].id };
					}
					if (quizzesData[0]) {
						return { type: "quiz", id: quizzesData[0].id };
					}
					return null;
				});
			} catch (err) {
				if (ignore) return;
				setError(
					err instanceof Error ? err.message : "Unable to load content."
				);
			} finally {
				if (ignore) return;
				setLoading(false);
			}
		}

		load();
		return () => {
			ignore = true;
		};
	}, [course.id]);

	const lessonGroups = useMemo(() => {
		if (course.modules && course.modules.length > 0) {
			return course.modules.map((module) => {
				const fromApi = lessons.filter(
					(lesson) => lesson.moduleId === module.id
				);
				const fromCourse = module.lessons ?? [];
				const moduleLessons =
					fromApi.length > 0
						? fromApi
						: fromCourse.length > 0
						? fromCourse
						: lessons;
				return {
					id: module.id,
					title: module.title,
					lessons: moduleLessons,
				};
			});
		}
		return [
			{
				id: "default",
				title: "Course outline",
				lessons,
			},
		];
	}, [course.modules, lessons]);

	const currentLesson =
		activeItem?.type === "lesson"
			? lessons.find((lesson) => lesson.id === activeItem.id) ?? null
			: null;
	const currentQuiz =
		activeItem?.type === "quiz"
			? quizzes.find((quiz) => quiz.id === activeItem.id) ?? null
			: null;
	const completedLessonSet = useMemo(
		() => new Set(completedLessonIds),
		[completedLessonIds]
	);
	const completedLessonsCount = useMemo(() => {
		if (!lessons.length) return 0;
		return lessons.reduce(
			(count, lesson) =>
				completedLessonSet.has(lesson.id) ? count + 1 : count,
			0
		);
	}, [completedLessonSet, lessons]);
	const totalLessonsCount = useMemo(() => {
		const uniqueIds = new Set(lessons.map((lesson) => lesson.id));
		return uniqueIds.size;
	}, [lessons]);
	const learningProgressPercent =
		totalLessonsCount > 0
			? Math.round((completedLessonsCount / totalLessonsCount) * 100)
			: 0;
	const handleMarkLessonComplete = async (lessonId: string) => {
		if (
			!lessonId ||
			completedLessonSet.has(lessonId) ||
			isSavingProgress ||
			!totalLessonsCount
		) {
			return;
		}

		const nextCompleted = [...completedLessonIds, lessonId];
		const nextProgressPercent = Math.min(
			100,
			Math.round((nextCompleted.length / totalLessonsCount) * 100)
		);

		setCompletedLessonIds(nextCompleted);
		setIsSavingProgress(true);
		setProgressMessage(null);
		try {
			const updated = await updateEnrollment(enrollment.id, {
				completedLessonIds: nextCompleted,
				progressPercent: nextProgressPercent,
			});
			setCompletedLessonIds(updated.completedLessonIds ?? nextCompleted);
			onEnrollmentUpdate?.(updated);
			setProgressMessage({
				type: "success",
				text: "Progress saved.",
			});
		} catch (error) {
			setCompletedLessonIds((prev) =>
				prev.filter((completedId) => completedId !== lessonId)
			);
			setProgressMessage({
				type: "error",
				text:
					error instanceof Error
						? error.message
						: "Unable to save your progress right now.",
			});
		} finally {
			setIsSavingProgress(false);
		}
	};
	const uploadsBase = useMemo(() => {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		if (!apiUrl) return "";
		return apiUrl.replace(/\/api\/?$/, "");
	}, []);
	const resolvedLessonVideoUrl = useMemo(() => {
		if (!currentLesson?.videoUrl) {
			return "";
		}
		return currentLesson.videoUrl.startsWith("http")
			? currentLesson.videoUrl
			: `${uploadsBase}${currentLesson.videoUrl}`;
	}, [currentLesson?.videoUrl, uploadsBase]);
	const youtubeEmbedUrl = useMemo(() => {
		if (!currentLesson?.videoUrl) {
			return "";
		}
		const url = currentLesson.videoUrl;
		const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
		if (!isYouTube) {
			return "";
		}
		return url
			.replace("watch?v=", "embed/")
			.replace("youtu.be/", "youtube.com/embed/");
	}, [currentLesson?.videoUrl]);

	if (loading) {
		return (
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<p className="text-sm text-zinc-500">Loading your coursework…</p>
			</section>
		);
	}

	if (error) {
		return (
			<section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
				{error}
			</section>
		);
	}

	return (
		<div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
			<div className="grid min-h-[600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
				<aside className="flex flex-col border-b border-zinc-100 lg:border-b-0 lg:border-r">
					<div className="border-b border-zinc-100 px-5 py-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							{course.level} course
						</p>
						<h2 className="text-lg font-semibold text-zinc-900">
							{course.title}
						</h2>
						<p className="text-xs text-zinc-500">
							{lessons.length} lessons · {course.durationMinutes} minutes
						</p>
					</div>
					<div className="flex-1 overflow-y-auto px-4 py-4">
						{lessonGroups.map((group) => (
							<div key={group.id} className="mb-4">
								<p className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
									{group.title}
								</p>
								<ul className="mt-2 space-y-1">
									{group.lessons.map((lesson, index) => {
										const isActive = lesson.id === currentLesson?.id;
										const isCompleted = completedLessonSet.has(lesson.id);
										return (
											<li key={lesson.id}>
												<button
													onClick={() => {
														setActiveItem({ type: "lesson", id: lesson.id });
													}}
													className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
														isActive
															? "bg-rose-50 text-rose-600"
															: "text-zinc-700 hover:bg-zinc-100"
													}`}
												>
													<span className="text-xs font-semibold text-zinc-400">
														{index + 1}.
													</span>
													<div className="flex-1">
														<div className="flex items-center justify-between gap-2">
															<p className="font-semibold">{lesson.title}</p>
															{isCompleted && (
																// <span className="rounded-full border border-emerald-500 px-1.5 text-[10px] font-semibold uppercase text-emerald-600">
																// 	V
																// </span>
																<div>
																	<CheckIcon className="h-4 w-4 text-emerald-500" />
																</div>
															)}
														</div>
														<p className="text-xs text-zinc-500">
															Video · {lesson.durationMinutes ?? 0} mins
														</p>
													</div>
												</button>
											</li>
										);
									})}
									{group.lessons.length === 0 && (
										<li className="px-3 py-2 text-xs text-zinc-500">
											Lessons coming soon.
										</li>
									)}
								</ul>
							</div>
						))}
						{totalLessonsCount > 0 && (
							<div className="mt-5 rounded-2xl border border-zinc-200 bg-white/80 p-3 text-xs text-zinc-600">
								<div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
									<span>Learning progress</span>
									<span>{learningProgressPercent}%</span>
								</div>
								<div className="mt-2 h-2 rounded-full bg-zinc-100">
									<div
										className="h-full rounded-full bg-rose-500 transition-all"
										style={{ width: `${learningProgressPercent}%` }}
									/>
								</div>
								<p className="mt-1 text-[11px] text-zinc-500">
									{completedLessonsCount}/{totalLessonsCount} lessons completed
								</p>
							</div>
						)}

						<div className="mt-6">
							<p className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Quizzes
							</p>
							<ul className="mt-2 space-y-1">
								{quizzes.map((quiz, index) => {
									const isActive =
										activeItem?.type === "quiz" && activeItem.id === quiz.id;
									return (
										<li key={quiz.id}>
											<button
												onClick={() => {
													setActiveItem({ type: "quiz", id: quiz.id });
												}}
												className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
													isActive
														? "bg-sky-50 text-sky-700"
														: "text-zinc-700 hover:bg-zinc-100"
												}`}
											>
												<span className="text-xs font-semibold text-zinc-400">
													Q{index + 1}
												</span>
												<div className="flex-1">
													<p className="font-semibold">{quiz.title}</p>
													<p className="text-xs text-zinc-500">
														{quiz.timeLimitSeconds
															? `${Math.round(
																	quiz.timeLimitSeconds / 60
															  )} min limit`
															: "No timer"}
													</p>
												</div>
											</button>
										</li>
									);
								})}
								{quizzes.length === 0 && (
									<li className="px-3 py-2 text-xs text-zinc-500">
										Knowledge checks coming soon.
									</li>
								)}
							</ul>
						</div>
					</div>
					<div className="border-t border-zinc-100 px-4 py-4">
						<button className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-zinc-900">
							<span>Accomplishment</span>
							<span className="text-xs font-semibold text-violet-600">
								Soon
							</span>
						</button>
					</div>
				</aside>
				<section className="flex flex-col bg-zinc-50/60 p-4 lg:p-8">
					<div className="flex-1 rounded-2xl border border-zinc-200 bg-black/80 p-4 shadow-inner">
						{currentLesson && activeItem?.type === "lesson" ? (
							<div className="flex h-full flex-col rounded-xl border border-black/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6 text-white">
								<div>
									<p className="text-sm text-rose-200">Now playing</p>
									<h3 className="mt-1 text-2xl font-semibold">
										{currentLesson.title}
									</h3>
									<p className="text-sm text-zinc-300">
										{`${
											currentLesson.durationMinutes ?? 0
										} mins • Video lesson`}
									</p>
								</div>
								<div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-black/50 bg-black">
									{currentLesson.videoUrl ? (
										youtubeEmbedUrl ? (
											<iframe
												key={youtubeEmbedUrl}
												title={`Lesson video for ${currentLesson.title}`}
												src={youtubeEmbedUrl}
												className="h-full w-full min-h-[320px]"
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
												allowFullScreen
											/>
										) : resolvedLessonVideoUrl ? (
											<video
												key={resolvedLessonVideoUrl}
												src={resolvedLessonVideoUrl}
												className="h-full w-full min-h-[320px]"
												controls
												preload="metadata"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-sm text-zinc-300">
												Unable to load video.
											</div>
										)
									) : (
										<div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-zinc-300">
											<span>No video uploaded for this lesson yet.</span>
											<span className="text-xs text-zinc-500">
												Please check back later.
											</span>
										</div>
									)}
								</div>
								<div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
									<span>0:00</span>
									<span>
										{currentLesson.durationMinutes
											? `0:${String(currentLesson.durationMinutes).padStart(
													2,
													"0"
											  )}`
											: "0:00"}
									</span>
								</div>
							</div>
						) : (
							<div className="flex h-full flex-col justify-between rounded-xl border border-black/30 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 text-white">
								<div>
									<p className="text-sm text-rose-200">
										{activeItem?.type === "quiz"
											? "Current quiz"
											: "Now playing"}
									</p>
									<h3 className="mt-1 text-2xl font-semibold">
										{currentLesson?.title ??
											currentQuiz?.title ??
											"Choose your next step"}
									</h3>
									<p className="text-sm text-zinc-300">
										{activeItem?.type === "quiz" && currentQuiz
											? `${
													currentQuiz.timeLimitSeconds
														? `${Math.round(
																currentQuiz.timeLimitSeconds / 60
														  )} min limit`
														: "No timer"
											  } • Quiz overview`
											: `${
													currentLesson?.durationMinutes ?? 0
											  } mins • Video lesson`}
									</p>
								</div>
								<div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
									<span>0:00</span>
									<span>
										{currentLesson?.durationMinutes
											? `0:${String(currentLesson.durationMinutes).padStart(
													2,
													"0"
											  )}`
											: currentQuiz?.timeLimitSeconds
											? `0:${String(
													Math.round(currentQuiz.timeLimitSeconds / 60)
											  ).padStart(2, "0")}`
											: "0:00"}
									</span>
								</div>
							</div>
						)}
					</div>
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
						<div>
							<p className="text-xs uppercase tracking-wide text-zinc-500">
								{currentQuiz ? "Quiz details" : "Lesson details"}
							</p>
							<p className="font-semibold text-zinc-900">
								{currentLesson?.title ??
									currentQuiz?.title ??
									"Select a lesson"}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{currentLesson && (
								<>
									<button
										type="button"
										onClick={() => handleMarkLessonComplete(currentLesson.id)}
										disabled={
											completedLessonSet.has(currentLesson.id) ||
											isSavingProgress
										}
										className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
											completedLessonSet.has(currentLesson.id)
												? "border border-emerald-200 bg-emerald-50 text-emerald-600"
												: "border border-zinc-200 text-zinc-700 hover:border-zinc-900"
										}`}
									>
										{completedLessonSet.has(currentLesson.id)
											? "Completed"
											: isSavingProgress
											? "Saving…"
											: "Mark complete"}
									</button>
								</>
							)}
							{currentQuiz && (
								<button className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-900">
									Start quiz
								</button>
							)}
						</div>
					</div>

					{progressMessage && (
						<p
							className={`mt-2 text-xs ${
								progressMessage.type === "error"
									? "text-red-600"
									: "text-emerald-600"
							}`}
						>
							{progressMessage.text}
						</p>
					)}

					{currentQuiz && (
						<div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
							<p className="text-xs uppercase tracking-wide text-zinc-500">
								Quiz overview
							</p>
							<p className="mt-2 text-zinc-700">
								{currentQuiz.description ??
									"Prepare to apply what you learned in the previous lessons."}
							</p>
							<p className="mt-2 text-xs text-zinc-500">
								{currentQuiz.timeLimitSeconds
									? `Time limit: ${Math.round(
											currentQuiz.timeLimitSeconds / 60
									  )} minutes`
									: "No time limit"}
							</p>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
