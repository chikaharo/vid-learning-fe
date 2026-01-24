'use client';

import { useEffect, useState } from 'react';
import { 
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { fetchFromApi } from '@/lib/api';

interface Review {
  id: string;
  comment: string;
  rating: number;
  user: {
    fullName: string;
    email: string;
  };
  course: {
    title: string;
  };
  createdAt: string;
}

interface ReviewResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [page, search]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });
      const res = await fetchFromApi<ReviewResponse>(`/reviews/admin?${query}`, {}, { auth: true });
      if (res) {
        setReviews(res.data);
        setTotal(res.total);
      }
    } catch (error) {
      console.error('Failed to load reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      await fetchFromApi(`/reviews/${review.id}`, {
        method: 'DELETE',
      }, { auth: true });
      loadReviews();
    } catch (error) {
      alert('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Content Moderation</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review and moderate user comments and ratings.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search reviews by comment or user..."
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Review</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="transition hover:bg-zinc-50/50">
                    <td className="px-6 py-4 w-48">
                      <div className="font-medium text-zinc-900">{review.user?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{review.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-1 text-amber-400">
                        <span className="font-bold text-zinc-900 mr-1">{review.rating}</span>
                        <StarIcon className="h-4 w-4" />
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 truncate w-40" title={review.course?.title}>
                        {review.course?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 text-zinc-700" title={review.comment}>
                        {review.comment}
                      </p>
                    </td>
                    <td className="px-6 py-4 w-32 whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right w-24">
                      <button
                        onClick={() => handleDelete(review)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition"
                        title="Delete Review"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
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
