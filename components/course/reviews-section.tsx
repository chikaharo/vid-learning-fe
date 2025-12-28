"use client";

import { useState, useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import {
  createReview,
  checkUserReview,
  fetchEnrollmentForCourse,
} from "@/lib/content-service";
import type { Review } from "@/types/course";
import { getStoredUser } from "@/lib/session";

interface ReviewsSectionProps {
  courseId: string;
  initialReviews: Review[];
}

export function ReviewsSection({
  courseId,
  initialReviews,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const user = getStoredUser();
      if (!user) return;

      try {
        const enrollment = await fetchEnrollmentForCourse(user.id, courseId);
        if (enrollment) {
          setIsEnrolled(true);
          const review = await checkUserReview(courseId);
          if (review) setUserReview(review);
        }
      } catch (err) {
        console.error("Failed to check review status", err);
      }
    };
    checkStatus();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const newReview = await createReview(courseId, rating, comment);
      setReviews([newReview, ...reviews]);
      setUserReview(newReview);
      setComment("");
      setRating(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-zinc-900">Reviews</h2>

      {/* Form */}
      {isEnrolled && !userReview && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 mb-8 border-b border-zinc-100 pb-8"
        >
          <h3 className="text-lg font-medium">Write a review</h3>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                {star <= rating ? (
                  <StarIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <StarIconOutline className="h-6 w-6 text-zinc-300" />
                )}
              </button>
            ))}
          </div>
          <textarea
            className="mt-4 w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-zinc-400"
            rows={3}
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {userReview && (
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">
            You reviewed this course
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < userReview.rating ? "text-yellow-500" : "text-blue-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-blue-600">
              {new Date(userReview.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-blue-700">{userReview.comment}</p>
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-6">
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-zinc-50 pb-4 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "text-yellow-400" : "text-zinc-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {review.user?.fullName ??
                    review.user?.name ??
                    review.user?.email ??
                    "Learner"}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
