"use client";

import { useEffect, useState } from "react";

import { fetchEnrollmentForCourse } from "@/lib/content-service";
import { AUTH_EVENT, getStoredUser, type StoredUser } from "@/lib/session";
import type { Course } from "@/types/course";
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

	useEffect(() => {
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
				return;
			}
			const enrollment = await fetchEnrollmentForCourse(user.id, course.id);
			if (!ignore) {
				const enrolled = Boolean(enrollment);
				setIsEnrolled(enrolled);
			}
		}
		load();
		return () => {
			ignore = true;
		};
	}, [user, course.id]);

	if (isEnrolled) {
		return <CourseLearningPanel course={course} />;
	}

	return <>{defaultContent}</>;
}
