"use client";

import { useEffect, useState } from "react";

import {
	getLessonsForCourse,
	getQuizzesForCourse,
} from "@/lib/content-service";
import type { Course, Lesson, Quiz } from "@/types/course";

interface CourseLearningPanelProps {
	course: Course;
}

export function CourseLearningPanel({ course }: CourseLearningPanelProps) {
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
			} catch (err) {
				if (ignore) return;
				setError(err instanceof Error ? err.message : "Unable to load content.");
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
		<div className="space-y-6">
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Your progress
				</p>
				<h2 className="text-2xl font-semibold text-zinc-900">{course.title}</h2>
				<p className="mt-2 text-sm text-zinc-600">
					Start the next lesson or recap previous material. Your progress is saved
					automatically.
				</p>
			</section>
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Lessons
						</p>
						<h3 className="text-xl font-semibold text-zinc-900">
							{lessons.length} lessons · {course.durationMinutes} minutes
						</h3>
					</div>
				</div>
				<ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200">
					{lessons.map((lesson, index) => (
						<li key={lesson.id} className="flex items-center justify-between px-4 py-3 text-sm">
							<div>
								<p className="font-semibold text-zinc-900">
									{index + 1}. {lesson.title}
								</p>
								<p className="text-xs text-zinc-500">
									{lesson.durationMinutes ?? 0} min · {lesson.isPreview ? "Preview" : "Locked"}
								</p>
							</div>
							<button className="text-xs font-semibold text-violet-600">Start</button>
						</li>
					))}
					{lessons.length === 0 && (
						<li className="px-4 py-3 text-sm text-zinc-500">Coming soon.</li>
					)}
				</ul>
			</section>
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Quizzes
						</p>
						<h3 className="text-xl font-semibold text-zinc-900">
							{quizzes.length} knowledge checks
						</h3>
					</div>
				</div>
				<ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200">
					{quizzes.map((quiz) => (
						<li key={quiz.id} className="flex items-center justify-between px-4 py-3 text-sm">
							<div>
								<p className="font-semibold text-zinc-900">{quiz.title}</p>
								<p className="text-xs text-zinc-500">
									{quiz.timeLimitSeconds
										? `${Math.round(quiz.timeLimitSeconds / 60)} min limit`
										: "No timer"}
								</p>
							</div>
							<button className="text-xs font-semibold text-violet-600">Review</button>
						</li>
					))}
					{quizzes.length === 0 && (
						<li className="px-4 py-3 text-sm text-zinc-500">
							Quizzes will appear after the instructor publishes them.
						</li>
					)}
				</ul>
			</section>
		</div>
	);
}
