import { fetchFromApi } from "./api";
import type { Comment } from "@/types/course";

export async function fetchCommentsForLesson(lessonId: string): Promise<Comment[]> {
	const comments = await fetchFromApi<Comment[]>(
		`/comments/lesson/${lessonId}`,
		{ cache: "no-store" },
		{ fallbackToMock: false }
	);
	return comments ?? [];
}

export async function createComment(payload: {
	lessonId: string;
	content: string;
	parentId?: string;
}): Promise<Comment> {
	const comment = await fetchFromApi<Comment>(
		"/comments",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!comment) {
		throw new Error("Failed to create comment");
	}
	return comment;
}

export async function deleteComment(id: string): Promise<void> {
	await fetchFromApi(
		`/comments/${id}`,
		{ method: "DELETE", cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
}
