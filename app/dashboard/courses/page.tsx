import { CourseManager } from "@/components/course/course-manager";
import { getAllCourses } from "@/lib/content-service";

export const metadata = {
	title: "Manage courses",
};

export default async function DashboardCoursesPage() {
	const courses = await getAllCourses();

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-semibold text-violet-600">
					Course operations
				</p>
				<h1 className="text-3xl font-semibold text-zinc-900">
					Create, edit, and delete courses
				</h1>
				<p className="text-sm text-zinc-600">
					Changes sync with the NestJS API in real time. Use the editor to
					publish new offerings or keep drafts private.
				</p>
			</header>
			<CourseManager initialCourses={courses} />
		</div>
	);
}
