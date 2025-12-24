"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EnrollmentCard } from "@/components/dashboard/enrollment-card";
import { CourseCard } from "@/components/course/course-card";
import {
  getFeaturedCourses,
  getUserEnrollments,
} from "@/lib/content-service";
import type { Course, Enrollment } from "@/types/course";

export default function DashboardPage() {
  const [enrollments, setEnrollments] = useState<(Enrollment & { course: Course })[]>([]);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [enrollmentsData, recommendedData] = await Promise.all([
          getUserEnrollments(),
          getFeaturedCourses(),
        ]);
        setEnrollments(enrollmentsData || []);
        setRecommended(recommendedData || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
     return (
      <div className="space-y-10 animate-pulse">
        <header className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-zinc-200 rounded"></div>
          <div className="h-8 w-96 bg-zinc-200 rounded"></div>
          <div className="h-4 w-64 bg-zinc-200 rounded"></div>
        </header>
         <section className="grid gap-6 lg:grid-cols-2">
             <div className="h-48 bg-zinc-200 rounded-3xl"></div>
             <div className="h-48 bg-zinc-200 rounded-3xl"></div>
         </section>
      </div>
    );
  }

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
        <div className="pt-2">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
          >
            Manage courses
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
          ))
        ) : (
             <div className="col-span-full rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                <p className="text-zinc-600">You haven't enrolled in any courses yet.</p>
                <Link href="/courses" className="mt-2 inline-block text-violet-600 hover:underline">Browse courses</Link>
             </div>
        )}
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