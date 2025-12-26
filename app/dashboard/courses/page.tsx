"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getInstructorCourses } from "@/lib/content-service";
import type { Course } from "@/types/course";

export default function DashboardCoursesPage() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getInstructorCourses()
			.then(setCourses)
			.catch((err) => console.error("Failed to fetch courses", err))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex h-64 w-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">
					Course catalog
				</p>
				<h1 className="text-3xl font-semibold text-zinc-900">
					Manage your curriculum
				</h1>
				<p className="text-sm text-zinc-600">
					Select a course to view its lessons and quizzes, or open the course
					builder to create new offerings.
				</p>
			</header>
			<div className="flex flex-wrap items-center gap-3">
				<Link
					href="/dashboard/courses/create"
					className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
				>
					Create new course
				</Link>
				<Link
					href="/dashboard/courses/manage"
					className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
				>
					Open course builder
				</Link>
			</div>
			<section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							{courses.length} courses
						</p>
						<h2 className="text-xl font-semibold text-zinc-900">
							Published & drafts
						</h2>
					</div>
				</div>
				{courses.length === 0 ? (
					<p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
						No courses yet. Use the builder to create the first experience.
					</p>
				) : (
					<ul className="space-y-3">
						{courses.map((course) => (
							<li
								key={course.id}
								className="flex flex-wrap items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3"
							>
								<div>
									<Link
										href={`/dashboard/courses/${course.slug}`}
										className="text-sm font-semibold text-zinc-900 transition hover:text-violet-600"
									>
										{course.title}
									</Link>
									<p className="text-xs uppercase tracking-wide text-zinc-500">
										{course.level} · {course.durationMinutes} minutes ·{" "}
										{course.isPublished ? "Published" : "Draft"}
									</p>
								</div>
								<Link
									href={`/dashboard/courses/${course.slug}`}
									className="text-xs font-semibold text-violet-600 transition hover:text-violet-700"
								>
									View details →
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
