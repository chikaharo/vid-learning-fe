import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonForm } from "@/components/course/lesson-form";
import {
	fetchLiveCourses,
	getAllCourses,
	getCourseBySlug,
} from "@/lib/content-service";

interface NewLessonPageProps {
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
			"Dashboard lesson creation params falling back to cached courses",
			error,
		);
	}
	const fallbackCourses = await getAllCourses();
	return fallbackCourses.map((course) => ({ slug: course.slug }));
}

export default async function NewLessonPage({ params }: NewLessonPageProps) {
	const { slug } = await params;
	const course = await getCourseBySlug(slug, { preferLive: true });
	if (!course) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<nav className="text-sm text-zinc-500">
				<Link href="/dashboard/courses" className="transition hover:text-zinc-900">
					Courses
				</Link>{" "}
				/{" "}
				<Link
					href={`/dashboard/courses/${course.slug}`}
					className="transition hover:text-zinc-900"
				>
					{course.title}
				</Link>{" "}
				/ <span className="text-zinc-900">New lesson</span>
			</nav>
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">New lesson</p>
				<h1 className="text-3xl font-semibold text-zinc-900">
					Add a lesson to {course.title}
				</h1>
				<p className="text-sm text-zinc-600">
					Set the lesson title, duration, order, and whether it is a free preview.
				</p>
			</header>
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<LessonForm
					courseId={course.id}
					courseSlug={course.slug}
					ownerId={course.instructor.id}
					mode="create"
				/>
			</section>
		</div>
	);
}
