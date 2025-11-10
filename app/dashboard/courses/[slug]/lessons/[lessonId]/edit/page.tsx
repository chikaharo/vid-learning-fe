import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonForm } from "@/components/course/lesson-form";
import { getCourseBySlug, getLesson } from "@/lib/content-service";

interface EditLessonPageProps {
	params: Promise<{ slug: string; lessonId: string }>;
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
	const { slug, lessonId } = await params;
	const course = await getCourseBySlug(slug);
	if (!course) {
		notFound();
	}
	const lesson = await getLesson(lessonId);
	if (!lesson || lesson.courseId !== course.id) {
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
				/ <span className="text-zinc-900">Edit lesson</span>
			</nav>
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">Edit lesson</p>
				<h1 className="text-3xl font-semibold text-zinc-900">{lesson.title}</h1>
				<p className="text-sm text-zinc-600">
					Update lesson metadata, ordering, and preview status.
				</p>
			</header>
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<LessonForm
					courseId={course.id}
					courseSlug={course.slug}
					mode="edit"
					initialLesson={lesson}
				/>
			</section>
		</div>
	);
}
