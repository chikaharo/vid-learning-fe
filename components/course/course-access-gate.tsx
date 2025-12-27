"use client";

import { useEffect, useState } from "react";

import { fetchEnrollmentForCourse } from "@/lib/content-service";
import {
	AUTH_EVENT,
	ENROLLMENT_EVENT,
	getStoredUser,
	type StoredUser,
} from "@/lib/session";
import type { Course, Enrollment } from "@/types/course";
import { CourseLearningPanel } from "./course-learning-panel";

interface CourseAccessGateProps {
	course: Course;
	defaultContent: React.ReactNode;
}

export function CourseAccessGate({
	course,
	defaultContent,
}: CourseAccessGateProps) {
	const [user, setUser] = useState<StoredUser | null>(() =>
		typeof window === "undefined" ? null : getStoredUser()
	);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
	const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
	const [refreshKey, setRefreshKey] = useState(0);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const syncUser = () => setUser(getStoredUser());
		const refresh = () => setRefreshKey((prev) => prev + 1);

		window.addEventListener("storage", syncUser);
		window.addEventListener(AUTH_EVENT, syncUser);
		window.addEventListener(ENROLLMENT_EVENT, refresh);
		return () => {
			window.removeEventListener("storage", syncUser);
			window.removeEventListener(AUTH_EVENT, syncUser);
			window.removeEventListener(ENROLLMENT_EVENT, refresh);
		};
	}, []);

	useEffect(() => {
		let ignore = false;
		async function load() {
			if (!user) {
				setIsEnrolled(false);
				setEnrollment(null);
				setIsCheckingEnrollment(false);
				return;
			}
			setIsCheckingEnrollment(true);
			const enrollmentRecord = await fetchEnrollmentForCourse(
				user.id,
				course.id
			);
			if (!ignore) {
				const enrolled = Boolean(enrollmentRecord);
				setIsEnrolled(enrolled);
				setEnrollment(enrollmentRecord);
				setIsCheckingEnrollment(false);
			}
		}
		load();
		return () => {
			ignore = true;
		};
	}, [user, course.id, refreshKey]);

	if (isCheckingEnrollment) {
		return (
			<section className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
				Loading your workspace…
			</section>
		);
	}

	if (isEnrolled && enrollment) {
		return (
			<CourseLearningPanel
				course={course}
				enrollment={enrollment}
				onEnrollmentUpdate={setEnrollment}
			/>
		);
	}

	return <>{defaultContent}</>;
}
