"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

import {
	getLessonsForCourse,
	getQuizzesForCourse,
	getQuiz,
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
	const [activeQuizDetails, setActiveQuizDetails] = useState<Quiz | null>(null);
	const [loading, setLoading] = useState(true);
	const [isStartingQuiz, setIsStartingQuiz] = useState(false);
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
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [quizSubmitted, setQuizSubmitted] = useState(false);
	const [timeLeft, setTimeLeft] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Reset active quiz details when switching items
	useEffect(() => {
		setActiveQuizDetails(null);
		setAnswers({});
		setQuizSubmitted(false);
		setTimeLeft(null);
	}, [activeItem?.id]);

	useEffect(() => {
		setCompletedLessonIds(enrollment.completedLessonIds ?? []);
	}, [enrollment.completedLessonIds]);

	useEffect(() => {
		if (
			!activeQuizDetails ||
			quizSubmitted ||
			timeLeft === null ||
			timeLeft <= 0
		) {
			if (timeLeft === 0 && !quizSubmitted) {
				handleSubmitQuiz();
			}
			return;
		}

		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
		}, 1000);

		return () => clearInterval(timer);
	}, [timeLeft, quizSubmitted, activeQuizDetails]);

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

	const curriculumGroups = useMemo(() => {
		const quizMap = new Map<string, Quiz[]>();
		const courseQuizzes: Quiz[] = [];

		quizzes.forEach((q) => {
			if (q.lessonId) {
				const list = quizMap.get(q.lessonId) ?? [];
				list.push(q);
				quizMap.set(q.lessonId, list);
			} else {
				courseQuizzes.push(q);
			}
		});

		const mergeLessons = (lessonsToMerge: Lesson[]) => {
			const items: Array<{
				type: "lesson" | "quiz";
				data: Lesson | Quiz;
			}> = [];
			lessonsToMerge.forEach((lesson) => {
				items.push({ type: "lesson", data: lesson });
				const related = quizMap.get(lesson.id);
				if (related) {
					related.forEach((q) => items.push({ type: "quiz", data: q }));
				}
			});
			return items;
		};

		if (course.modules && course.modules.length > 0) {
			const groups = course.modules.map((module) => {
				const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
				// Sort logic if needed, assuming API order or mapped order
				// simple merge for now
				return {
					id: module.id,
					title: module.title,
					items: mergeLessons(moduleLessons),
				};
			});

			const orphanedLessons = lessons.filter((l) => !l.moduleId);
			if (orphanedLessons.length > 0 || courseQuizzes.length > 0) {
				const items = mergeLessons(orphanedLessons);
				courseQuizzes.forEach((q) => items.push({ type: "quiz", data: q }));
				groups.push({
					id: "general",
					title: "General",
					items,
				});
			}
			return groups;
		}

		const items = mergeLessons(lessons);
		courseQuizzes.forEach((q) => items.push({ type: "quiz", data: q }));
		return [
			{
				id: "default",
				title: "Course outline",
				items,
			},
		];
	}, [course.modules, lessons, quizzes]);

	const filteredCurriculumGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return curriculumGroups;
		}
		const lowerQuery = searchQuery.toLowerCase();
		return curriculumGroups
			.map((group) => ({
				...group,
				items: group.items.filter((item) => {
					if (item.type === "lesson") {
						return (item.data as Lesson).title
							.toLowerCase()
							.includes(lowerQuery);
					}
					return (item.data as Quiz).title.toLowerCase().includes(lowerQuery);
				}),
			}))
			.filter((group) => group.items.length > 0);
	}, [curriculumGroups, searchQuery]);

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

	const isReviewing = Boolean(
		currentQuiz && completedLessonSet.has(currentQuiz.id)
	);

	const completedItemsCount = useMemo(() => {
		let count = 0;
		lessons.forEach((l) => {
			if (completedLessonSet.has(l.id)) count++;
		});
		quizzes.forEach((q) => {
			if (completedLessonSet.has(q.id)) count++;
		});
		return count;
	}, [completedLessonSet, lessons, quizzes]);

	const totalItemsCount = useMemo(() => {
		const uniqueIds = new Set([
			...lessons.map((l) => l.id),
			...quizzes.map((q) => q.id),
		]);
		return uniqueIds.size;
	}, [lessons, quizzes]);

	const learningProgressPercent =
		totalItemsCount > 0
			? Math.round((completedItemsCount / totalItemsCount) * 100)
			: 0;

	const handleMarkLessonComplete = async (itemId: string) => {
		if (
			!itemId ||
			completedLessonSet.has(itemId) ||
			isSavingProgress ||
			!totalItemsCount
		) {
			return;
		}

		const nextCompleted = [...completedLessonIds, itemId];
		const nextProgressPercent = Math.min(
			100,
			Math.round((nextCompleted.length / totalItemsCount) * 100)
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
				prev.filter((completedId) => completedId !== itemId)
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

	const handleOptionSelect = (questionId: string, optionId: string) => {
		if (quizSubmitted) return;
		setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
	};

	const quizScore = useMemo(() => {
		if (!activeQuizDetails?.questions) return null;
		let correctCount = 0;
		activeQuizDetails.questions.forEach((q) => {
			const selected = answers[q.id];
			const correctOption = q.options.find((o) => o.isCorrect);
			if (selected && correctOption && selected === correctOption.id) {
				correctCount++;
			}
		});
		return {
			correct: correctCount,
			total: activeQuizDetails.questions.length,
			percent: Math.round(
				(correctCount / activeQuizDetails.questions.length) * 100
			),
		};
	}, [activeQuizDetails, answers]);

	const handleSubmitQuiz = async () => {
		setQuizSubmitted(true);
		setTimeLeft(null);
		if (currentQuiz && quizScore && quizScore.percent >= 70) {
			await handleMarkLessonComplete(currentQuiz.id);
		}
	};

	const handleRetryQuiz = () => {
		setQuizSubmitted(false);
		setAnswers({});
		if (activeQuizDetails?.timeLimitSeconds) {
			setTimeLeft(activeQuizDetails.timeLimitSeconds);
		} else {
			setTimeLeft(null);
		}
	};

	const handleStartQuiz = async () => {
		if (!currentQuiz || isStartingQuiz) return;
		setIsStartingQuiz(true);
		setAnswers({});
		setQuizSubmitted(false);
		try {
			const fullQuiz = await getQuiz(currentQuiz.id);
			if (fullQuiz) {
				setActiveQuizDetails(fullQuiz);
				if (completedLessonSet.has(currentQuiz.id)) {
					setQuizSubmitted(true);
					setTimeLeft(null);
				} else if (fullQuiz.timeLimitSeconds) {
					setTimeLeft(fullQuiz.timeLimitSeconds);
				} else {
					setTimeLeft(null);
				}
			}
		} catch (error) {
			console.error("Failed to start quiz:", error);
			setProgressMessage({
				type: "error",
				text: "Unable to load quiz questions.",
			});
		} finally {
			setIsStartingQuiz(false);
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

	const isQuizActive =
		activeItem?.type === "quiz" &&
		activeQuizDetails &&
		activeQuizDetails.id === activeItem.id;

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

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

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
						<div className="mt-4">
							<input
								type="text"
								placeholder="Search content..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-400 focus:bg-white"
							/>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto px-4 py-4">
						{filteredCurriculumGroups.map((group) => (
							<details key={group.id} open className="group mb-4">
								<summary className="flex cursor-pointer list-none items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 outline-none hover:text-zinc-700">
									{group.title}
									<ChevronDownIcon className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" />
								</summary>
								<ul className="mt-2 space-y-1">
									{group.items.map((item, index) => {
										if (item.type === "lesson") {
											const lesson = item.data as Lesson;
											const isActive =
												activeItem?.type === "lesson" &&
												activeItem.id === lesson.id;
											const isCompleted = completedLessonSet.has(lesson.id);
											return (
												<li key={`lesson-${lesson.id}`}>
													<button
														onClick={() => {
															setActiveItem({
																type: "lesson",
																id: lesson.id,
															});
														}}
														className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
															isActive
																? "bg-rose-50 text-rose-600"
																: "text-zinc-700 hover:bg-zinc-100"
														}`}
													>
														<span className="text-xs font-semibold text-zinc-400">
															L{index + 1}
														</span>
														<div className="flex-1">
															<div className="flex items-center justify-between gap-2">
																<p className="font-semibold">{lesson.title}</p>
																{isCompleted && (
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
										}
										const quiz = item.data as Quiz;
										const isActive =
											activeItem?.type === "quiz" && activeItem.id === quiz.id;
										const isCompleted = completedLessonSet.has(quiz.id);
										return (
											<li key={`quiz-${quiz.id}`}>
												<button
													onClick={() => {
														setActiveItem({
															type: "quiz",
															id: quiz.id,
															// Reset quiz state when switching to it? handled in useEffect
														});
													}}
													className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
														isActive
															? "bg-sky-50 text-sky-700"
															: "text-zinc-700 hover:bg-zinc-100"
													}`}
												>
													<span className="text-xs font-semibold text-zinc-400">
														Q
													</span>
													<div className="flex-1">
														<div className="flex items-center justify-between gap-2">
															<p className="font-semibold">{quiz.title}</p>
															{isCompleted && (
																<div>
																	<CheckIcon className="h-4 w-4 text-emerald-500" />
																</div>
															)}
														</div>
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
									{group.items.length === 0 && (
										<li className="px-3 py-2 text-xs text-zinc-500">
											No content yet.
										</li>
									)}
								</ul>
							</details>
						))}
						{totalItemsCount > 0 && (
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
									{completedItemsCount}/{totalItemsCount} items completed
								</p>
							</div>
						)}
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
					<div
						className={`flex-1 rounded-2xl border border-zinc-200 bg-black/80 p-4 shadow-inner ${
							isQuizActive ? "bg-white overflow-y-auto" : ""
						}`}
					>
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
						) : isQuizActive ? (
							<div className="h-full space-y-6 bg-white p-4">
								<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
									<div>
										<h2 className="text-2xl font-bold text-zinc-900">
											{activeQuizDetails?.title}
										</h2>
										<p className="text-sm text-zinc-600">
											{activeQuizDetails?.description}
										</p>
									</div>
									{timeLeft !== null && (
										<div
											className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-sm font-semibold ${
												timeLeft < 60
													? "bg-red-50 text-red-600"
													: "bg-zinc-100 text-zinc-700"
											}`}
										>
											<span>{formatTime(timeLeft)}</span>
										</div>
									)}
								</div>

								{quizSubmitted && (
									<div
										className={`rounded-2xl border p-4 ${
											isReviewing || (quizScore && quizScore.percent >= 70)
												? "border-emerald-200 bg-emerald-50"
												: "border-red-200 bg-red-50"
										}`}
									>
										<h3
											className={`text-lg font-bold ${
												isReviewing || (quizScore && quizScore.percent >= 70)
													? "text-emerald-800"
													: "text-red-800"
											}`}
										>
											{isReviewing
												? "Quiz Completed"
												: quizScore && quizScore.percent >= 70
												? "Quiz Passed!"
												: "Quiz Failed"}
										</h3>
										{!isReviewing && quizScore && (
											<p
												className={
													quizScore.percent >= 70
														? "text-emerald-700"
														: "text-red-700"
												}
											>
												You scored {quizScore.correct} out of {quizScore.total}{" "}
												({quizScore.percent}%)
											</p>
										)}
										{isReviewing && (
											<p className="text-emerald-700">
												Reviewing correct answers.
											</p>
										)}
										{!isReviewing && quizScore && quizScore.percent < 70 && (
											<button
												onClick={handleRetryQuiz}
												className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
											>
												Retry Quiz
											</button>
										)}
									</div>
								)}

								<div className="space-y-8">
									{activeQuizDetails?.questions?.map((question, index) => {
										const selectedOptionId = answers[question.id];
										return (
											<div key={question.id} className="space-y-3">
												<div className="flex items-start gap-2">
													<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
														{index + 1}
													</span>
													<div className="flex-1">
														<p className="font-medium text-zinc-900">
															{question.prompt}
														</p>
														<div className="mt-3 space-y-2">
															{question.options.map((option) => {
																const isSelected =
																	selectedOptionId === option.id;
																const isCorrect = option.isCorrect;
																let optionClass =
																	"border-zinc-200 text-zinc-700 hover:bg-zinc-50";
																if (quizSubmitted) {
																	if (
																		isReviewing ||
																		(quizScore && quizScore.percent >= 70)
																	) {
																		if (isCorrect) {
																			optionClass =
																				"border-emerald-500 bg-emerald-50 text-emerald-700";
																		} else if (isSelected && !isCorrect) {
																			optionClass =
																				"border-red-500 bg-red-50 text-red-700";
																		} else {
																			optionClass =
																				"border-zinc-200 text-zinc-400 opacity-60";
																		}
																	} else {
																		// Failed state: highlight selected, don't show correct
																		if (isSelected) {
																			optionClass =
																				"border-zinc-900 bg-zinc-100 text-zinc-900";
																		} else {
																			optionClass =
																				"border-zinc-200 text-zinc-400 opacity-60";
																		}
																	}
																} else if (isSelected) {
																	optionClass =
																		"border-violet-600 bg-violet-50 text-violet-700";
																}

																return (
																	<label
																		key={option.id}
																		className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${optionClass} ${
																			quizSubmitted ? "cursor-default" : ""
																		}`}
																	>
																		<input
																			type="radio"
																			name={`q-${question.id}`}
																			checked={isSelected}
																			onChange={() =>
																				handleOptionSelect(
																					question.id,
																					option.id
																				)
																			}
																			disabled={quizSubmitted}
																			className="mt-0.5 h-4 w-4 text-violet-600"
																		/>
																		<div className="flex-1">
																			<span>{option.label}</span>
																			{quizSubmitted &&
																				(isReviewing ||
																					(quizScore &&
																						quizScore.percent >= 70)) &&
																				isCorrect &&
																				option.explanation && (
																					<p className="mt-1 text-xs text-emerald-600">
																						{option.explanation}
																					</p>
																				)}
																		</div>
																	</label>
																);
															})}
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
								{!quizSubmitted && (
									<div className="flex justify-end pt-6">
										<button
											onClick={handleSubmitQuiz}
											className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
										>
											Submit Quiz
										</button>
									</div>
								)}
							</div>
						) : activeItem?.type === "quiz" && currentQuiz ? (
							<div className="flex h-full flex-col justify-center items-center rounded-xl border border-zinc-200 bg-white p-8 text-center">
								<div className="mb-6 rounded-full bg-violet-50 p-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="h-12 w-12 text-violet-600"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9"
										/>
									</svg>
								</div>
								<h3 className="mb-2 text-2xl font-bold text-zinc-900">
									{completedLessonSet.has(currentQuiz.id)
										? "Quiz Completed"
										: currentQuiz.title}
								</h3>
								<p className="mb-8 max-w-md text-zinc-600">
									{completedLessonSet.has(currentQuiz.id)
										? "You have already passed this quiz. You can review the questions below."
										: currentQuiz.description ||
										  "Test your knowledge with this quiz."}
								</p>

								<div className="grid w-full max-w-lg grid-cols-3 gap-4 border-t border-zinc-100 pt-8">
									<div className="flex flex-col items-center">
										<span className="text-xs font-semibold uppercase text-zinc-500">
											Questions
										</span>
										<span className="mt-1 text-xl font-bold text-zinc-900">
											{currentQuiz.questions?.length ?? "-"}
										</span>
									</div>
									<div className="flex flex-col items-center border-l border-zinc-100">
										<span className="text-xs font-semibold uppercase text-zinc-500">
											Time Limit
										</span>
										<span className="mt-1 text-xl font-bold text-zinc-900">
											{currentQuiz.timeLimitSeconds
												? `${Math.round(currentQuiz.timeLimitSeconds / 60)}m`
												: "None"}
										</span>
									</div>
									<div className="flex flex-col items-center border-l border-zinc-100">
										<span className="text-xs font-semibold uppercase text-zinc-500">
											Max Score
										</span>
										<span className="mt-1 text-xl font-bold text-zinc-900">
											{currentQuiz.questions?.reduce(
												(sum, q) => sum + (q.points || 1),
												0
											) ?? "-"}
										</span>
									</div>
								</div>
							</div>
						) : (
							<div className="flex h-full flex-col justify-between rounded-xl border border-black/30 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 text-white">
								<div>
									<p className="text-sm text-rose-200">Now playing</p>
									<h3 className="mt-1 text-2xl font-semibold">
										{currentLesson?.title ?? "Choose your next step"}
									</h3>
									<p className="text-sm text-zinc-300">
										{`${
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
											isSavingProgress ||
											!totalItemsCount
										}
										className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
											completedLessonSet.has(currentLesson.id)
												? "border border-emerald-200 bg-emerald-50 text-emerald-600"
												: "border border-zinc-200 text-zinc-700 hover:border-zinc-900"
										}`}
									>
										{" "}
										{completedLessonSet.has(currentLesson.id)
											? "Completed"
											: isSavingProgress
											? "Saving…"
											: "Mark complete"}
									</button>
								</>
							)}
							{currentQuiz && !isQuizActive && (
								<button
									onClick={handleStartQuiz}
									disabled={isStartingQuiz}
									className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-900 disabled:opacity-50"
								>
									{isStartingQuiz
										? "Loading..."
										: completedLessonSet.has(currentQuiz.id)
										? "Review Quiz"
										: "Start quiz"}
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

					{currentQuiz && !isQuizActive && (
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
