import type { Course } from "@/types/course";
import Link from "next/link";

interface CourseSidebarProps {
  course: Course;
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: course.currency,
  }).format(course.price);

  return (
    <aside className="sticky top-28 rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg">
      <div className={`h-48 rounded-2xl bg-gradient-to-br ${course.thumbnailColor}`} />
      <div className="mt-6 space-y-4">
        <p className="text-3xl font-semibold text-zinc-900">{price}</p>
        <button className="w-full rounded-full bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800">
          Enroll now
        </button>
        <button className="w-full rounded-full border border-zinc-200 px-4 py-3 font-medium text-zinc-900 transition hover:border-zinc-900">
          Add to wishlist
        </button>
      </div>
      <ul className="mt-6 space-y-3 text-sm text-zinc-600">
        <li>Lifetime access + certificate</li>
        <li>Downloadable exercises</li>
        <li>30-day satisfaction guarantee</li>
      </ul>
      <p className="mt-6 text-xs text-zinc-500">
        Ready to keep growing?{" "}
        <Link href="/dashboard" className="font-semibold text-zinc-900">
          Continue learning
        </Link>
      </p>
    </aside>
  );
}
