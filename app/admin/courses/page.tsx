'use client';

import { useEffect, useState } from 'react';
import { 
  MagnifyingGlassIcon,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid';
import { 
  StarIcon as StarIconOutline 
} from '@heroicons/react/24/outline';
import { fetchFromApi } from '@/lib/api';

interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  instructor: {
    id: string;
    fullName?: string;
    email: string;
  };
  rating: number;
  ratingCount: number;
}

interface CourseResponse {
  data: AdminCourse[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, [page, search]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });
      const res = await fetchFromApi<CourseResponse>(`/courses/admin?${query}`, {}, { auth: true });
      if (res) {
        setCourses(res.data);
        setTotal(res.total);
      }
    } catch (error) {
      console.error('Failed to load courses', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (course: AdminCourse) => {
    try {
      const newStatus = !course.isPublished;
      await fetchFromApi(`/courses/${course.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: newStatus }),
      }, { auth: true });
      loadCourses();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const toggleFeature = async (course: AdminCourse) => {
    try {
      const newFeatured = !course.isFeatured;
      await fetchFromApi(`/courses/${course.id}/feature`, {
        method: 'PATCH',
        body: JSON.stringify({ isFeatured: newFeatured }),
      }, { auth: true });
      loadCourses();
    } catch (error) {
      alert('Failed to update feature status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Course Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Oversee course content, availability, and featured status.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search courses by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value); 
              setPage(1);
            }}
            className="w-full border-0 bg-transparent py-2 pl-10 pr-4 placeholder:text-zinc-400 focus:ring-0 sm:text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    Loading courses...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No courses found.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="transition hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 w-64 truncate" title={course.title}>
                        {course.title}
                      </div>
                      <div className="text-xs text-zinc-500">{course.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">
                        {course.instructor?.fullName || 'Unknown'}
                      </div>
                      <div className="text-xs text-zinc-500">{course.instructor?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        course.isPublished 
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleFeature(course)}
                        title={course.isFeatured ? "Remove from featured" : "Add to featured"}
                        className={`transition hover:scale-110 ${course.isFeatured ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}
                      >
                         {course.isFeatured ? (
                           <StarIconSolid className="h-6 w-6" />
                         ) : (
                           <StarIconOutline className="h-6 w-6" />
                         )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button
                           onClick={() => toggleStatus(course)}
                           className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                             course.isPublished 
                               ? 'bg-white text-orange-600 ring-1 ring-orange-200 hover:bg-orange-50'
                               : 'bg-emerald-600 text-white hover:bg-emerald-700'
                           }`}
                         >
                           {course.isPublished ? 'Unpublish' : 'Publish'}
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
            <div className="text-sm text-zinc-500">
                Page {page} of {Math.ceil(total / 10)}
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-sm disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 10)}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-sm disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
