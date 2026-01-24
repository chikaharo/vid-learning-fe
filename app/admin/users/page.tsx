'use client';

import { useEffect, useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  EllipsisVerticalIcon 
} from '@heroicons/react/24/outline';
import { fetchFromApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

interface UserResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Debounce search could be better, but for now simple effect
  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });
      const res = await fetchFromApi<UserResponse>(`/users?${query}`, {}, { auth: true });
      if (res) {
        setUsers(res.data);
        setTotal(res.total);
      }
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      await fetchFromApi(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      }, { auth: true });
      // Optimistic update or reload
      loadUsers();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const changeRole = async (user: User, newRole: string) => {
    if (!confirm(`Are you sure you want to promote/demote ${user.fullName} to ${newRole}?`)) return;
    try {
      await fetchFromApi(`/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      }, { auth: true });
      loadUsers();
    } catch (error) {
      alert('Failed to update role');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">User Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage system users, roles, and access.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value); 
              setPage(1); // Reset to page 1 on search
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user.fullName?.[0] || user.email[0]
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900">{user.fullName || 'No Name'}</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'INSTRUCTOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button
                           onClick={() => toggleStatus(user)}
                           className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                             user.isActive 
                               ? 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50'
                               : 'bg-green-600 text-white hover:bg-green-700'
                           }`}
                         >
                           {user.isActive ? 'Block' : 'Unblock'}
                         </button>
                         {user.role !== 'ADMIN' && (
                           <button
                             onClick={() => changeRole(user, 'INSTRUCTOR')}
                             className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                           >
                             Make Instructor
                           </button>
                         )}
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
