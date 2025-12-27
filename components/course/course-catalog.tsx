'use client';

import type { Course } from "@/types/course";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CourseCard } from "./course-card";

interface CourseCatalogProps {
  courses: Course[];
  categories: string[];
}

export function CourseCatalog({ courses, categories }: CourseCatalogProps) {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q");
  const [query, setQuery] = useState(initialQ ?? "");
  const [prevQ, setPrevQ] = useState(initialQ);
  const [level, setLevel] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const q = searchParams.get("q");
  if (q !== prevQ) {
    setPrevQ(q);
    if (q !== null) {
      setQuery(q);
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesQuery =
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase());
      const matchesLevel = level === "all" || course.level === level;
      const matchesCategory =
        category === "all" || course.categories.includes(category);
      return matchesQuery && matchesLevel && matchesCategory;
    });
  }, [courses, query, level, category]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6 md:grid-cols-4">
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Course title, instructor..."
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Level
          </span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          >
            <option value="all">All</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Category
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
          >
            <option value="all">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filteredCourses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No courses match your filters yet. Try adjusting the search.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
