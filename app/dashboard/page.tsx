import { EnrollmentCard } from "@/components/dashboard/enrollment-card";
import { CourseCard } from "@/components/course/course-card";
import {
  getFeaturedCourses,
  getUserEnrollments,
} from "@/lib/content-service";

export const metadata = {
  title: "My learning",
};

export default async function DashboardPage() {
  const [enrollments, recommended] = await Promise.all([
    getUserEnrollments(),
    getFeaturedCourses(),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-violet-600">Keep learning</p>
        <h1 className="text-3xl font-semibold text-zinc-900">
          Welcome back, future instructor
        </h1>
        <p className="text-sm text-zinc-600">
          Resume where you left off, track progress, and explore new playlists.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {enrollments.map((enrollment) => (
          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              Because you enjoyed video learning
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900">
              Recommended for you
            </h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {recommended.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
