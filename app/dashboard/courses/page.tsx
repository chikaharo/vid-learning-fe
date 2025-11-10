import Link from "next/link";

import { getAllCourses } from "@/lib/content-service";

export const metadata = {
	title: "Courses",
};

export default async function DashboardCoursesPage() {
	const courses = await getAllCourses({ live: true });

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
