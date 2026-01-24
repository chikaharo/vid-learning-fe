'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowDownTrayIcon,
  ChartBarIcon, 
  TrophyIcon
} from '@heroicons/react/24/outline';
import { fetchFromApi } from '@/lib/api';

interface TopCourse {
  id: string;
  title: string;
  slug: string;
  students: string; // TypeORM raw count returns string
}

interface InstructorStat {
  user_id: string;
  user_fullName: string;
  user_email: string;
  courses_count: string;
  total_students: string;
}

export default function AdminReportsPage() {
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [instructorStats, setInstructorStats] = useState<InstructorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [coursesRes, instructorsRes] = await Promise.all([
        fetchFromApi<TopCourse[]>('/statistics/reports/top-courses', {}, { auth: true }),
        fetchFromApi<InstructorStat[]>('/statistics/reports/instructor-stats', {}, { auth: true })
      ]);
      
      if (coursesRes) setTopCourses(coursesRes);
      if (instructorsRes) setInstructorStats(instructorsRes);
    } catch (error) {
      console.error('Failed to load reports', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (filename: string, data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Insights on platform performance and engagement.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Top Courses Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
                    <TrophyIcon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-zinc-900">Top Performing Courses</h3>
            </div>
            <button 
                onClick={() => downloadCSV('top_courses', topCourses)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-zinc-500 bg-zinc-50">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Course</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Students</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {topCourses.map((course, i) => (
                        <tr key={course.id}>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                                        {i + 1}
                                    </span>
                                    <span className="font-medium text-zinc-900 truncate max-w-[200px]" title={course.title}>
                                        {course.title}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                                {course.students}
                            </td>
                        </tr>
                    ))}
                    {topCourses.length === 0 && !loading && (
                        <tr><td colSpan={2} className="p-4 text-center text-zinc-500">No data available</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>

        {/* Instructor Stats Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <ChartBarIcon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-zinc-900">Instructor Leaderboard</h3>
            </div>
            <button 
                onClick={() => downloadCSV('instructor_stats', instructorStats)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-zinc-500 bg-zinc-50">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Instructor</th>
                        <th className="px-4 py-3 text-right">Courses</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Students</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {instructorStats.map((stat, i) => (
                        <tr key={stat.user_id}>
                            <td className="px-4 py-3">
                                <div className="font-medium text-zinc-900">{stat.user_fullName}</div>
                                <div className="text-xs text-zinc-500">{stat.user_email}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-600">
                                {stat.courses_count}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                                {stat.total_students}
                            </td>
                        </tr>
                    ))}
                    {instructorStats.length === 0 && !loading && (
                        <tr><td colSpan={3} className="p-4 text-center text-zinc-500">No data available</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
