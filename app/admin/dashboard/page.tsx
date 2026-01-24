'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

import { fetchFromApi } from '@/lib/api';
import { StatisticsOverview } from '@/types/statistics';

async function fetchStatistics(): Promise<StatisticsOverview> {
  const data = await fetchFromApi<StatisticsOverview>('/statistics/overview', {
    method: 'GET',
    cache: 'no-store',
  }, { auth: true, fallbackToMock: false });
  
  if (!data) {
    throw new Error('Failed to fetch statistics');
  }
  return data;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: number;
  icon: typeof UsersIcon;
  colorClass: string;
}) => (
  <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-md">
    <div className={`absolute right-4 top-4 rounded-full p-2.5 opacity-10 ${colorClass}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="relative">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
        <ArrowTrendingUpIcon className="h-3 w-3" />
        <span>+12% from last month</span>
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-white p-3 shadow-lg ring-1 ring-black/5">
        <p className="mb-1 text-xs text-zinc-500">{new Date(label).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
        <p className="text-sm font-bold text-zinc-900">
          {payload[0].value} <span className="font-medium text-zinc-500">enrollments</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-600">
        <p className="font-semibold">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-zinc-500">
            Welcome back, here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Updates
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard 
          title="Total Users" 
          value={data.overview.totalUsers} 
          icon={UsersIcon}
          colorClass="bg-blue-500 text-blue-500"
        />
        <StatCard 
          title="Active Courses" 
          value={data.overview.totalCourses} 
          icon={BookOpenIcon}
          colorClass="bg-violet-500 text-violet-500"
        />
        <StatCard 
          title="Total Enrollments" 
          value={data.overview.totalEnrollments} 
          icon={AcademicCapIcon}
          colorClass="bg-amber-500 text-amber-500"
        />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold text-zinc-900">Enrollment Trends</h3>
                <p className="text-sm text-zinc-500">New students over the last 7 days</p>
            </div>
            <select className="rounded-lg border-zinc-200 text-sm text-zinc-600 focus:border-zinc-900 focus:ring-zinc-900">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
            </select>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.recentEnrollments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
                tickFormatter={(value: string) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
              <Bar 
                dataKey="count" 
                fill="#18181b" 
                radius={[6, 6, 0, 0]} 
                barSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
