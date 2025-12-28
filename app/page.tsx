import { CourseCard } from "@/components/course/course-card";
import {
  getCategories,
  getFeaturedCourses,
  getLearningPaths,
  getTestimonials,
} from "@/lib/content-service";
import Link from "next/link";

export default async function HomePage() {
  const [featuredCourses, categoryList, testimonials, learningPaths] =
    await Promise.all([
      getFeaturedCourses(),
      getCategories(),
      getTestimonials(),
      getLearningPaths(),
    ]);

  return (
    <div className="space-y-16">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Built for course marketplaces
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900 lg:text-5xl">
            Welcome to the Ultimate Video Learning Platform
          </h1>
          <p className="text-lg text-zinc-600 lg:w-3/4">
            Discover a wide range of courses, enhance your skills, and achieve your goals. 
            Join our community of learners and start your journey today.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="rounded-full bg-zinc-900 px-6 py-3 text-center font-medium text-white transition hover:bg-zinc-800"
            >
              Explore the catalog
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 px-6 py-3 text-center font-medium text-zinc-900 transition hover:border-zinc-900"
            >
              View learner dashboard
            </Link>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { label: "Learners impacted", value: "52K+" },
            { label: "Video hours", value: "90+" },
            { label: "Instructor partners", value: "25" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
            >
              <p className="text-3xl font-semibold text-zinc-900">
                {item.value}
              </p>
              <p className="text-sm text-zinc-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">
              Browse categories
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Curated for builders and educators
            </h2>
          </div>
          <Link
            href="/courses"
            className="hidden rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900 md:inline-flex"
          >
            View all courses
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {categoryList.map((category) => (
            <span
              key={category}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
            >
              {category}
            </span>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        {learningPaths.map((path) => (
          <div
            key={path.id}
            className="rounded-3xl border border-zinc-200 bg-white p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
              Playbook
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-zinc-900">
              {path.title}
            </h3>
            <ol className="mt-6 space-y-4 text-sm text-zinc-600">
              {path.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Learner stories
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-900">
            Built for ambitious teams
          </h3>
          <div className="mt-6 space-y-6">
            {testimonials.map((testimonial) => (
              <blockquote
                key={testimonial.id}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700"
              >
                “{testimonial.quote}”
                <footer className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {testimonial.learnerName} · {testimonial.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
