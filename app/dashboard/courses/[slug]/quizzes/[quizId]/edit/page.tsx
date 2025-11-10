import Link from "next/link";
import { notFound } from "next/navigation";

import { QuizForm } from "@/components/course/quiz-form";
import {
	getCourseBySlug,
	getLessonsForCourse,
	getQuiz,
} from "@/lib/content-service";

interface EditQuizPageProps {
	params: Promise<{ slug: string; quizId: string }>;
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
	const { slug, quizId } = await params;
	const course = await getCourseBySlug(slug);
	if (!course) {
		notFound();
	}
	const quiz = await getQuiz(quizId);
	if (!quiz || quiz.courseId !== course.id) {
		notFound();
	}
	const lessons = await getLessonsForCourse(course.id);

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
				/ <span className="text-zinc-900">Edit quiz</span>
			</nav>
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">Edit quiz</p>
				<h1 className="text-3xl font-semibold text-zinc-900">{quiz.title}</h1>
				<p className="text-sm text-zinc-600">
					Update quiz metadata, timers, and lesson linkage.
				</p>
			</header>
			<section className="rounded-3xl border border-zinc-200 bg-white p-6">
				<QuizForm
					courseId={course.id}
					courseSlug={course.slug}
					mode="edit"
					initialQuiz={quiz}
					initialLessons={lessons}
				/>
			</section>
		</div>
	);
}
