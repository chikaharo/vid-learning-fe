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
			error,
		);
	}
	const fallbackCourses = await getAllCourses();
	return fallbackCourses.map((course) => ({ slug: course.slug }));
}

export default async function CourseDetailPage({
	params,
}: CourseDetailPageProps) {
	const { slug } = await params;
	const course = await getCourseBySlug(slug);

	if (!course) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<nav className="text-sm text-zinc-500">
				<Link href="/dashboard/courses" className="transition hover:text-zinc-900">
					Courses
				</Link>{" "}
				/ <span className="text-zinc-900">{course.title}</span>
			</nav>
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">Course detail</p>
				<h1 className="text-3xl font-semibold text-zinc-900">{course.title}</h1>
				<p className="text-sm text-zinc-600">
					View curriculum, manage lessons, and add quizzes for this course.
				</p>
			</header>
			<CourseDetailClient course={course} />
		</div>
	);
}
