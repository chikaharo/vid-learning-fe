"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Course, Lesson, Quiz } from "@/types/course";
import {
	deleteLesson,
	deleteQuiz,
	getLessonsForCourse,
	getQuizzesForCourse,
	updateLesson,
	updateQuiz,
} from "@/lib/content-service";
import { AUTH_EVENT, getStoredUser, type StoredUser } from "@/lib/session";

const SortableItemContext = React.createContext<any>(null);

type Status = { type: "success" | "error"; message: string } | null;

interface CourseDetailClientProps {
	course: Course;
}

type ContentItem = (Lesson & { type: "lesson" }) | (Quiz & { type: "quiz" });

function sortContent(list: ContentItem[]) {
	console.log("Before Sorting content", list);
	const afterSorted = [...list].sort((a, b) => {
		// const orderDiff = (a.order ?? 0) - (b.order ?? 0);
		// if (orderDiff !== 0) {
		// 	return orderDiff;
		// }
		// const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		// const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		// return aTime - bTime;
		return (a.order ?? 0) - (b.order ?? 0);
	});
	console.log("After Sorting content", afterSorted);
	return afterSorted;
}

function SortableItem({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : "auto",
		position: "relative" as const,
	};

	const contextValue = useMemo(
		() => ({ attributes, listeners, ref: setActivatorNodeRef }),
		[attributes, listeners, setActivatorNodeRef]
	);

	return (
		<li
			ref={setNodeRef}
			style={style}
			className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3 bg-white hover:border-zinc-300 transition-colors"
		>
			<SortableItemContext.Provider value={contextValue}>
				{children}
			</SortableItemContext.Provider>
		</li>
	);
}

function DragHandle() {
	const { attributes, listeners, ref } = React.useContext(SortableItemContext);
	return (
		<div
			ref={ref}
			{...attributes}
			{...listeners}
			className="flex cursor-grab items-center gap-2 p-2 touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				viewBox="0 0 256 256"
				className="pointer-events-none"
			>
				<path d="M104,40V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0Zm64,0V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0Z"></path>
			</svg>
		</div>
	);
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

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

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
				setLessons(lessonData);
				setQuizzes(quizData);
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
		setUser(getStoredUser());
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

	const unifiedContent: ContentItem[] = useMemo(() => {
		const l = lessons.map((x) => ({ ...x, type: "lesson" as const }));
		const q = quizzes.map((x) => ({ ...x, type: "quiz" as const }));
		return sortContent([...l, ...q]);
	}, [lessons, quizzes]);

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = unifiedContent.findIndex(
			(item) => `${item.type}-${item.id}` === active.id
		);
		const newIndex = unifiedContent.findIndex(
			(item) => `${item.type}-${item.id}` === over.id
		);

		const newOrder = arrayMove(unifiedContent, oldIndex, newIndex);

		// Optimistic update with immutability
		const nextLessons = lessons.map((l) => ({ ...l }));
		const nextQuizzes = quizzes.map((q) => ({ ...q }));
		const updates: Promise<any>[] = [];

		newOrder.forEach((item, index) => {
			if (item.type === "lesson") {
				const lesson = nextLessons.find((l) => l.id === item.id);
				if (lesson && lesson.order !== index) {
					lesson.order = index;
					updates.push(updateLesson(lesson.id, { order: index }));
				}
			} else {
				const quiz = nextQuizzes.find((q) => q.id === item.id);
				if (quiz && quiz.order !== index) {
					quiz.order = index;
					updates.push(updateQuiz(quiz.id, { order: index }));
				}
			}
		});

		setLessons(nextLessons);
		setQuizzes(nextQuizzes);

		try {
			await Promise.all(updates);
		} catch (error) {
			console.error("Failed to persist order:", error);
			setStatus({
				type: "error",
				message: "Failed to save new order. Please refresh.",
			});
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

	const isLoading = lessonsLoading || quizzesLoading;

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
							Content
						</p>
						<h3 className="text-xl font-semibold text-zinc-900">
							Course content
						</h3>
					</div>
					{user && (
						<div className="flex gap-2">
							<Link
								href={`/dashboard/courses/${course.slug}/lessons/new`}
								className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
							>
								New lesson
							</Link>
							<Link
								href={{
									pathname: `/dashboard/courses/${course.slug}/quizzes/new`,
									query: { order: unifiedContent.length },
								}}
								className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
							>
								New quiz
							</Link>
						</div>
					)}
				</div>
				<div className="mt-4 space-y-3">
					{isLoading ? (
						<p className="text-sm text-zinc-500">Loading content…</p>
					) : unifiedContent.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
							No content yet. Create lessons or quizzes to build your
							curriculum.
						</p>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={unifiedContent.map((item) => `${item.type}-${item.id}`)}
								strategy={verticalListSortingStrategy}
							>
								<ul className="space-y-3">
									{unifiedContent.map((item) => (
										<SortableItem
											key={`${item.type}-${item.id}`}
											id={`${item.type}-${item.id}`}
										>
											<div className="flex-1">
												<div className="mb-1 flex items-center gap-2">
													<DragHandle />
													<span
														className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
															item.type === "lesson"
																? "bg-violet-100 text-violet-700"
																: "bg-emerald-100 text-emerald-700"
														}`}
													>
														{item.type === "lesson" ? "Lesson" : "Quiz"}
													</span>
													<p className="text-sm font-semibold text-zinc-900">
														{item.title}
													</p>
												</div>
												<p className="pl-6 text-xs uppercase tracking-wide text-zinc-500">
													{item.type === "lesson" ? (
														<>
															{item.durationMinutes ?? 0} min ·{" "}
															{item.isPreview ? "Preview" : "Locked"}
															{item.videoUrl ? " · Video ready" : ""}
															{item.content ? " · Notes" : ""}
														</>
													) : (
														<>
															{item.isPublished ? "Published" : "Draft"} ·{" "}
															{item.lessonId
																? "Linked to lesson"
																: "Course-wide"}{" "}
															·{" "}
															{item.timeLimitSeconds
																? `${Math.round(
																		item.timeLimitSeconds / 60
																  )} min limit`
																: "No timer"}
														</>
													)}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Link
													href={`/dashboard/courses/${course.slug}/${
														item.type === "lesson" ? "lessons" : "quizzes"
													}/${item.id}/edit`}
													className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
												>
													Edit
												</Link>
												<button
													type="button"
													onPointerDown={(e) => {
														e.stopPropagation();
														e.preventDefault();
													}}
													onClick={(e) => {
														e.stopPropagation();
														item.type === "lesson"
															? handleLessonDelete(item.id)
															: handleQuizDelete(item.id);
													}}
													disabled={
														disableMutations ||
														(item.type === "lesson"
															? lessonDeletingId === item.id
															: quizDeletingId === item.id)
													}
													className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
												>
													{(item.type === "lesson"
														? lessonDeletingId
														: quizDeletingId) === item.id
														? "Deleting…"
														: "Delete"}
												</button>
											</div>
										</SortableItem>
									))}
								</ul>
							</SortableContext>
						</DndContext>
					)}
				</div>
			</section>
		</div>
	);
}
