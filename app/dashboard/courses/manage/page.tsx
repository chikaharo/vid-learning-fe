import { CourseManager } from "@/components/course/course-manager";
import { getInstructorCourses } from "@/lib/content-service";

export const metadata = {
	title: "Course builder",
};

export default async function CourseManagePage() {
	const courses = await getInstructorCourses();

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">Course builder</p>
				<h1 className="text-3xl font-semibold text-zinc-900">
					Create and update courses
				</h1>
				<p className="text-sm text-zinc-600">
					Use the form below to publish new courses or edit existing ones.
				</p>
			</header>
			<CourseManager initialCourses={courses} />
		</div>
	);
}
