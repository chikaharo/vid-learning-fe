import type { Course, Enrollment } from "@/types/course";

interface EnrollmentCardProps {
  enrollment: Enrollment & { course: Course };
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div
          className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${enrollment.course.thumbnailColor}`}
        />
        <div>
          <p className="text-sm font-medium text-zinc-500">In progress</p>
          <h3 className="text-lg font-semibold text-zinc-900">
            {enrollment.course.title}
          </h3>
          <p className="text-sm text-zinc-600">
            Updated {new Date(enrollment.lastAccessed).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div>
        <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="bg-violet-500"
            style={{ width: `${enrollment.progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-600">
          {enrollment.progressPercent}% complete
        </p>
      </div>
      <button className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900">
        Continue lesson
      </button>
    </div>
  );
}
