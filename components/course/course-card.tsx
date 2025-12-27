import type { Course } from "@/types/course";
import Link from "next/link";
import Image from "next/image";

interface CourseCardProps {
  course: Course;
  showCategory?: boolean;
}

export function CourseCard({ course, showCategory = true }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {course.thumbnailUrl ? (
        <div className="relative h-44 w-full overflow-hidden rounded-xl">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className={`h-44 rounded-xl bg-gradient-to-br ${course.thumbnailColor}`}
        />
      )}
      <div className="flex flex-col gap-2">
        {showCategory && course.categories.length > 0 && (
          <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {course.categories[0]}
          </span>
        )}
        <h3 className="text-lg font-semibold text-zinc-900">{course.title}</h3>
        <p className="text-sm text-zinc-600 line-clamp-2">
          {course.description}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">
          {course.rating.toFixed(1)} ·{" "}
          <span className="text-zinc-600">
            {Intl.NumberFormat("en-US", {
              notation: "compact",
            }).format(course.ratingCount)}{" "}
            reviews
          </span>
        </span>
        <span>{Math.round(course.durationMinutes / 60)}h</span>
      </div>
    </Link>
  );
}
