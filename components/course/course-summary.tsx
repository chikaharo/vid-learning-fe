"use client";

import type { Course } from "@/types/course";
import Image from "next/image";
import { useState } from "react";

interface CourseSummaryProps {
	course: Course;
}

export function CourseSummary({ course }: CourseSummaryProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const runtimeHours = (course.durationMinutes / 60).toFixed(1);
	const shouldTruncate = course.description.length > 500;
	const displayDescription =
		shouldTruncate && !isExpanded
			? `${course.description.slice(0, 500)}...`
			: course.description;

	return (
		<section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg">
			<div className="flex flex-col gap-4">
				<p className="text-sm font-medium text-violet-600">
					{course.level.toLowerCase()} · {runtimeHours} hours
				</p>
				<h1 className="text-3xl font-semibold text-zinc-900">{course.title}</h1>
				<div>
					<p className="text-lg text-zinc-600 inline">{displayDescription}</p>
					{shouldTruncate && (
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="ml-2 font-medium text-violet-600 hover:underline focus:outline-none"
						>
							{isExpanded ? "Show less" : "Read more"}
						</button>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
					<span className="font-semibold text-zinc-900">
						{course.rating.toFixed(1)} rating
					</span>
					<span>
						{Intl.NumberFormat("en-US", { notation: "compact" }).format(
							course.ratingCount
						)}{" "}
						reviews
					</span>
					<span>
						{Intl.NumberFormat("en-US", { notation: "compact" }).format(
							course.students
						)}{" "}
						learners
					</span>
					<span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
				</div>
			</div>
			<div className="mt-8 flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
				<Image
					src={course.instructor.avatarUrl}
					width={64}
					height={64}
					alt={course.instructor.name}
					className="rounded-full border border-white"
				/>
				<div>
					<p className="text-sm text-zinc-500">Instructor</p>
					<p className="font-medium text-zinc-900">{course.instructor.name}</p>
					<p className="text-sm text-zinc-600">{course.instructor.title}</p>
				</div>
			</div>
		</section>
	);
}
