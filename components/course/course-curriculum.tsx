import type { Course } from "@/types/course";

interface CourseCurriculumProps {
  course: Course;
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Course curriculum
          </h2>
          <p className="text-sm text-zinc-600">
            {course.modules.length} sections ·{" "}
            {course.modules.reduce((total, module) => total + module.lessons.length, 0)}{" "}
            lectures · {Math.round(course.durationMinutes / 60)} hours total length
          </p>
        </div>
      </header>
      <div className="mt-6 space-y-4">
        {course.modules.map((module) => (
          <div
            key={module.id}
            className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
          >
            <h3 className="font-medium text-zinc-900">{module.title}</h3>
            <p className="text-sm text-zinc-600">{module.description}</p>
            <div className="mt-4 divide-y divide-zinc-200 border border-zinc-200 rounded-xl bg-white">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{lesson.title}</p>
                    {lesson.isPreview && (
                      <span className="text-xs font-semibold text-violet-600">
                        Preview
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-600">
                    {lesson.durationMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
