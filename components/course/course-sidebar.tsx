"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
	addCourseToWishlist,
	enrollInCourse,
	fetchEnrollmentForCourse,
	fetchUserWishlist,
} from "@/lib/content-service";
import {
	AUTH_EVENT,
	ENROLLMENT_EVENT,
	getStoredUser,
	type StoredUser,
} from "@/lib/session";
import type { Course } from "@/types/course";
import { CourseEnrollModal } from "./course-enroll-modal";

interface CourseSidebarProps {
	course: Course;
}

type BannerStatus = { type: "success" | "error"; message: string } | null;

export function CourseSidebar({ course }: CourseSidebarProps) {
	const [user, setUser] = useState<StoredUser | null>(() =>
		typeof window === "undefined" ? null : getStoredUser()
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [status, setStatus] = useState<BannerStatus>(null);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [isWishlisted, setIsWishlisted] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
		if (typeof window === "undefined") return;
		const syncUser = () => setUser(getStoredUser());
		window.addEventListener("storage", syncUser);
		window.addEventListener(AUTH_EVENT, syncUser);
		return () => {
			window.removeEventListener("storage", syncUser);
			window.removeEventListener(AUTH_EVENT, syncUser);
		};
	}, []);

	useEffect(() => {
		let ignore = false;
		async function load() {
			if (!user) {
				setIsEnrolled(false);
				setIsWishlisted(false);
				return;
			}
			try {
				const [enrollment, wishlist] = await Promise.all([
					fetchEnrollmentForCourse(user.id, course.id),
					fetchUserWishlist(user.id),
				]);
				if (ignore) return;
				setIsEnrolled(Boolean(enrollment));
				setIsWishlisted(
					wishlist?.some((item) => item.courseId === course.id) ?? false
				);
			} catch (error) {
				if (ignore) return;
				console.warn("Unable to preload enrollment info", error);
			}
		}
		load();
		return () => {
			ignore = true;
		};
	}, [user, course.id]);

	const price = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: course.currency,
	}).format(course.price);

	async function handleEnroll() {
		if (!user) {
			setStatus({
				type: "error",
				message: "Please log in to enroll in this course.",
			});
			return;
		}
		setStatus(null);
		setIsBusy(true);
		try {
			await enrollInCourse({ userId: user.id, courseId: course.id });
			setIsEnrolled(true);
			window.dispatchEvent(new Event(ENROLLMENT_EVENT));
			setStatus({
				type: "success",
				message: "Enrollment confirmed! You can now access the lessons.",
			});
			setIsModalOpen(false);
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to enroll right now.",
			});
		} finally {
			setIsBusy(false);
		}
	}

	async function handleWishlist() {
		if (!user) {
			setStatus({
				type: "error",
				message: "Please log in to save courses to your wishlist.",
			});
			return;
		}
		setStatus(null);
		setIsBusy(true);
		try {
			await addCourseToWishlist({ userId: user.id, courseId: course.id });
			setIsWishlisted(true);
			setStatus({
				type: "success",
				message: "Course added to your wishlist.",
			});
		} catch (error) {
			setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to update wishlist right now.",
			});
		} finally {
			setIsBusy(false);
		}
	}

	const authDisabled = !user;
	const enrollDisabled = !hydrated ? true : authDisabled || isEnrolled;
	const wishlistDisabled = !hydrated ? true : authDisabled || isWishlisted;
	const enrollLabel = !hydrated
		? "Enroll now"
		: !user
		? "Log in to enroll"
		: isEnrolled
		? "You're enrolled"
		: "Enroll now";
	const wishlistLabel = !hydrated
		? "Add to wishlist"
		: isWishlisted
		? "Saved to wishlist"
		: "Add to wishlist";

	return (
		<>
			<aside className="sticky top-28 rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg">
				<div
					className={`h-48 rounded-2xl bg-gradient-to-br ${course.thumbnailColor}`}
				/>
				<div className="mt-6 space-y-4">
					<p className="text-3xl font-semibold text-zinc-900">{price}</p>
					{status && (
						<div
							className={`rounded-2xl border px-4 py-2 text-xs ${
								status.type === "success"
									? "border-emerald-200 bg-emerald-50 text-emerald-700"
									: "border-red-200 bg-red-50 text-red-700"
							}`}
						>
							{status.message}
						</div>
					)}
					<button
						className="w-full rounded-full bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
						onClick={() => setIsModalOpen(true)}
						disabled={enrollDisabled}
					>
						{enrollLabel}
					</button>
					<button
						className="w-full rounded-full border border-zinc-200 px-4 py-3 font-medium text-zinc-900 transition hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
						onClick={handleWishlist}
						disabled={wishlistDisabled}
					>
						{wishlistLabel}
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
			<CourseEnrollModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onConfirmEnroll={handleEnroll}
				onAddToWishlist={handleWishlist}
				course={course}
				isBusy={isBusy}
			/>
		</>
	);
}
