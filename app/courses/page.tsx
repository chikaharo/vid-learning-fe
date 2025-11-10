import { CourseCatalog } from "@/components/course/course-catalog";
import { getAllCourses, getCategories } from "@/lib/content-service";

export const metadata = {
  title: "Course catalog",
};

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    getAllCourses(),
    getCategories(),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-8">
        <p className="text-sm font-semibold text-violet-600">Udemy-style</p>
        <h1 className="text-4xl font-semibold text-zinc-900">
          Choose your next video course
        </h1>
        <p className="text-lg text-zinc-600">
          Browse curated playlists inspired by top-performing learning
          marketplaces. Filter by level, category, and search for specific
          instructors.
        </p>
      </header>

      <CourseCatalog courses={courses} categories={categories} />
    </div>
  );
}
