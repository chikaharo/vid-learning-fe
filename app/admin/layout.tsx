'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserGroupIcon, BookOpenIcon, ChatBubbleLeftRightIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/admin/users', label: 'Users', icon: UserGroupIcon },
  { href: '/admin/courses', label: 'Courses', icon: BookOpenIcon },
  { href: '/admin/reviews', label: 'Moderation', icon: ChatBubbleLeftRightIcon },
  { href: '/admin/reports', label: 'Reports', icon: ChartBarIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-64 flex-col border-r border-stone-200 bg-white shadow-sm md:flex">
        <div className="flex h-16 items-center border-b border-stone-100 px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
              VU
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              Admin Portal
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            Menu
          </p>
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-stone-100 p-4">
          <div className="rounded-xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Logged in as</p>
            <p className="text-sm font-semibold text-zinc-900">Administrator</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 max-w-7xl">
            {children}
        </div>
      </main>
    </div>
  );
}
