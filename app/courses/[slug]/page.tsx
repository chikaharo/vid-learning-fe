import { CourseCurriculum } from "@/components/course/course-curriculum";
import { CourseSidebar } from "@/components/course/course-sidebar";
import { CourseSummary } from "@/components/course/course-summary";
import { CourseAccessGate } from "@/components/course/course-access-gate";
import {
  getAllCourses,
  getCourseBySlug,
  getTestimonials,
} from "@/lib/content-service";
import { notFound } from "next/navigation";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const courses = await getAllCourses({ live: true });
  return courses.map((course) => ({ slug: course.slug }));
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) {
    notFound();
  }

  const testimonialList = await getTestimonials();
  const courseTestimonials = testimonialList.filter(
    (testimonial) => testimonial.courseId === course.id,
  );

  const defaultContent = (
    <>
      <CourseSummary course={course} />
      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-2xl font-semibold text-zinc-900">
          What you&apos;ll learn
        </h2>
        <ul className="mt-4 grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
          {course.whatYouWillLearn.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-violet-600">▹</span>
              {item}
            </li>
          ))}
        </ul>
      </section>
      <CourseCurriculum course={course} />
      {courseTestimonials.length > 0 && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Learner feedback
          </h2>
          <div className="mt-6 space-y-4">
            {courseTestimonials.map((testimonial) => (
              <blockquote
                key={testimonial.id}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700"
              >
                “{testimonial.quote}”
                <footer className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {testimonial.learnerName} · {testimonial.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <CourseAccessGate course={course} defaultContent={defaultContent} />
      </div>
      <CourseSidebar course={course} />
    </div>
  );
}
