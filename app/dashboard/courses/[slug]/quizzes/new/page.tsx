import Link from "next/link";
import { notFound } from "next/navigation";

import { QuizForm } from "@/components/course/quiz-form";
import {
	getAllCourses,
	getCourseBySlug,
	getLessonsForCourse,
} from "@/lib/content-service";

interface NewQuizPageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
	const courses = await getAllCourses({ live: true, fallbackToMock: true });
	return courses.map((course) => ({ slug: course.slug }));
}

export default async function NewQuizPage({
	params,
	searchParams,
}: NewQuizPageProps) {
	const { slug } = await params;
	const { order } = await searchParams;
	const initialOrder = order ? Number(order) : undefined;

	const course = await getCourseBySlug(slug);
	if (!course) {
		notFound();
	}
	const lessons = await getLessonsForCourse(course.id);

	return (
		<div className="space-y-6">
			<nav className="text-sm text-zinc-500">
				<Link
					href="/dashboard/courses"
					className="transition hover:text-zinc-900"
				>
					Courses
				</Link>{" "}
				/{" "}
				<Link
					href={`/dashboard/courses/${course.slug}`}
					className="transition hover:text-zinc-900"
				>
					{course.title}
				</Link>{" "}
				/ <span className="text-zinc-900">New quiz</span>
			</nav>
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">New quiz</p>
				<h1 className="text-3xl font-semibold text-zinc-900">
					Create a quiz for {course.title}
				</h1>
				<p className="text-sm text-zinc-600">
					Link a quiz to a specific lesson or keep it course-wide.
				</p>
			</header>
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<QuizForm
					courseId={course.id}
					courseSlug={course.slug}
					mode="create"
					initialLessons={lessons}
					initialOrder={initialOrder}
				/>
			</section>
		</div>
	);
}
