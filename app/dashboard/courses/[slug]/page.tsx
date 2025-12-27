import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseDetailClient } from "@/components/course/course-detail-client";
import {
	fetchLiveCourses,
	getAllCourses,
	getCourseBySlug,
} from "@/lib/content-service";

interface CourseDetailPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
	try {
		const liveCourses = await fetchLiveCourses();
		if (liveCourses.length) {
			return liveCourses.map((course) => ({ slug: course.slug }));
		}
	} catch (error) {
		console.warn(
			"Dashboard course detail params falling back to cached courses",
			error
		);
	}
	const fallbackCourses = await getAllCourses();
	return fallbackCourses.map((course) => ({ slug: course.slug }));
}

export default async function CourseDetailPage({
	params,
}: CourseDetailPageProps) {
	const { slug } = await params;
	const course = await getCourseBySlug(slug, { preferLive: true });

	if (!course) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<nav className="text-sm text-zinc-500">
				<Link
					href="/dashboard/courses"
					className="transition hover:text-zinc-900"
				>
					Courses
				</Link>{" "}
				/ <span className="text-zinc-900">{course.title}</span>
			</nav>
			<header className="flex items-start justify-between">
				<div className="space-y-2">
					<p className="text-sm font-semibold text-violet-600">Course detail</p>
					<h1 className="text-3xl font-semibold text-zinc-900">
						{course.title}
					</h1>
					<p className="text-sm text-zinc-600">
						View curriculum, manage lessons, and add quizzes for this course.
					</p>
				</div>
				<div className="flex gap-2">
					<Link
						href={`/dashboard/courses/${slug}/lessons/new`}
						className="rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>
						New lesson
					</Link>
					<Link
						href={`/dashboard/courses/${slug}/quizzes/new`}
						className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
					>
						New quiz
					</Link>
				</div>
			</header>
			<CourseDetailClient course={course} />
		</div>
	);
}
