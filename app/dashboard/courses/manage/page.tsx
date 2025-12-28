import { CourseManager } from "@/components/course/course-manager";

export const metadata = {
	title: "Course builder",
};

export default function CourseManagePage() {
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
			<CourseManager initialCourses={[]} />
		</div>
	);
}
