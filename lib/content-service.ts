import {
	courses,
	wishlistItems,
	learningPaths,
	testimonials,
	categories as mockCategories,
} from "@/data/mock-data";
import type {
	Course,
	Enrollment,
	WishlistItem,
	Lesson,
	Quiz,
	Testimonial,
	Review,
} from "@/types/course";
import { fetchFromApi } from "./api";

interface ApiModule {
	id: string;
	title: string;
	description?: string;
	lessons: ApiLesson[];
}

export interface ApiCourse {
	id: string;
	title: string;
	slug: string;
	description?: string;
	level: Course["level"];
	durationMinutes: number;
	tags: string[];
	thumbnailUrl?: string;
	isPublished: boolean;
	whatYouWillLearn?: string[];
	modules?: ApiModule[];
	lessons?: ApiLesson[];
	instructor?: {
		id: string;
		name?: string;
		full_name?: string;
		avatarUrl?: string;
		bio?: string;
	};
	metadata?: Record<string, unknown>;
}

interface ApiLesson {
	id: string;
	title: string;
	order?: number;
	durationMinutes?: number;
	isPreview?: boolean;
	courseId: string;
	moduleId?: string | null;
	createdAt?: string;
	updatedAt?: string;
	videoUrl?: string | null;
	content?: string | null;
}

interface ApiQuizOption {
	id: string;
	label: string;
	isCorrect: boolean;
	explanation?: string;
}

interface ApiQuizQuestion {
	id: string;
	prompt: string;
	points: number;
	order: number;
	options: ApiQuizOption[];
}

interface ApiQuiz {
	id: string;
	title: string;
	description?: string;
	timeLimitSeconds?: number;
	isPublished: boolean;
	order?: number;
	courseId: string;
	lessonId?: string | null;
	questions?: ApiQuizQuestion[];
	createdAt?: string;
	updatedAt?: string;
}

export interface QuizQuestionPayload {
	prompt: string;
	order?: number;
	points?: number;
	options: Array<{
		label: string;
		explanation?: string;
		isCorrect?: boolean;
	}>;
}

const MOCK_METRICS = {
	rating: 4.8,
	ratingCount: 1850,
	students: 52000,
};

const currency = "USD";

function transformModule(apiModule: ApiModule): Course["modules"][0] {
	return {
		id: apiModule.id,
		title: apiModule.title,
		description: apiModule.description ?? "",
		lessons: apiModule.lessons ? apiModule.lessons.map(transformLesson) : [],
	};
}

export function transformCourse(apiCourse: ApiCourse): Course {
	const metadata = apiCourse.metadata ?? {};
	return {
		id: apiCourse.id,
		title: apiCourse.title,
		slug: apiCourse.slug,
		description:
			apiCourse.description ??
			"Premium curriculum crafted for ambitious course creators.",
		level: apiCourse.level,
		categories: Array.isArray(apiCourse.tags) ? apiCourse.tags : [],
		isPublished: apiCourse.isPublished ?? false,
		durationMinutes: apiCourse.durationMinutes ?? 0,
		tags: Array.isArray(apiCourse.tags) ? apiCourse.tags : [],
		rating: Number(metadata.rating) || MOCK_METRICS.rating,
		ratingCount: Number(metadata.ratingCount) || MOCK_METRICS.ratingCount,
		students: Number(metadata.students) || MOCK_METRICS.students,
		price: Number(metadata.price) || 19.99,
		currency,
		language: (metadata.language as string) ?? "English",
		thumbnailUrl: apiCourse.thumbnailUrl ?? null,
		thumbnailColor:
			typeof apiCourse.thumbnailUrl === "string" &&
			apiCourse.thumbnailUrl.length
				? apiCourse.thumbnailUrl
				: "from-purple-500 via-fuchsia-500 to-orange-400",
		updatedAt:
			typeof metadata.updatedAt === "string"
				? metadata.updatedAt
				: new Date().toISOString(),
		instructor: {
			id: apiCourse.instructor?.id ?? "instructor",
			name:
				apiCourse.instructor?.name ??
				apiCourse.instructor?.full_name ??
				"Instructor",
			title:
				(metadata.instructorTitle as string) ??
				apiCourse.instructor?.bio ??
				"Course Instructor",
			avatarUrl:
				apiCourse.instructor?.avatarUrl ?? "/images/instructors/amelia.svg",
			bio:
				apiCourse.instructor?.bio ??
				"Helping thousands of builders ship video learning experiences.",
			students:
				metadata.instructorStudents !== undefined
					? Number(metadata.instructorStudents)
					: 0,
			reviews:
				metadata.instructorReviews !== undefined
					? Number(metadata.instructorReviews)
					: 0,
		},
		highlights: (metadata.highlights as string[]) ?? [
			"Hands-on curriculum",
			"Downloadable resources",
			"Career-ready projects",
		],
		whatYouWillLearn: apiCourse.whatYouWillLearn ??
			(metadata.whatYouWillLearn as string[]) ?? [
				"Ship a video learning MVP",
				"Model courses, lessons, and enrollments",
				"Design dashboards learners love",
			],
		requirements: (metadata.requirements as string[]) ?? [
			"Basic JavaScript knowledge",
			"Curiosity to learn",
		],
		modules: apiCourse.modules ? apiCourse.modules.map(transformModule) : [],
		lessons: apiCourse.lessons ? apiCourse.lessons.map(transformLesson) : [],
	};
}

function transformLesson(apiLesson: ApiLesson): Lesson {
	return {
		id: apiLesson.id,
		title: apiLesson.title,
		durationMinutes: apiLesson.durationMinutes ?? 0,
		isPreview: apiLesson.isPreview ?? false,
		order: apiLesson.order ?? 0,
		courseId: apiLesson.courseId,
		moduleId: apiLesson.moduleId ?? null,
		createdAt: apiLesson.createdAt ?? new Date().toISOString(),
		updatedAt:
			apiLesson.updatedAt ?? apiLesson.createdAt ?? new Date().toISOString(),
		videoUrl: apiLesson.videoUrl ?? null,
		content: apiLesson.content ?? null,
	};
}

function transformQuiz(apiQuiz: ApiQuiz): Quiz {
	return {
		id: apiQuiz.id,
		title: apiQuiz.title,
		description: apiQuiz.description,
		timeLimitSeconds: apiQuiz.timeLimitSeconds,
		isPublished: apiQuiz.isPublished ?? false,
		order: apiQuiz.order ?? 0,
		courseId: apiQuiz.courseId,
		lessonId: apiQuiz.lessonId ?? null,
		questions: apiQuiz.questions?.map((q) => ({
			id: q.id,
			prompt: q.prompt,
			points: q.points,
			order: q.order,
			options:
				q.options?.map((o) => ({
					id: o.id,
					label: o.label,
					isCorrect: o.isCorrect,
					explanation: o.explanation,
				})) ?? [],
		})),
		createdAt: apiQuiz.createdAt ?? new Date().toISOString(),
		updatedAt:
			apiQuiz.updatedAt ?? apiQuiz.createdAt ?? new Date().toISOString(),
	};
}

export interface CoursePayload {
	title: string;
	slug: string;
	description?: string;
	level: Course["level"];
	durationMinutes: number;
	isPublished: boolean;
	tags?: string[];
	thumbnailUrl?: string;
	instructorId: string;
}

export type CourseUpdatePayload = Partial<
	Omit<CoursePayload, "instructorId">
> & {
	instructorId?: string;
};

export interface LessonPayload {
	title: string;
	courseId: string;
	durationMinutes?: number;
	order?: number;
	isPreview?: boolean;
	moduleId?: string;
	videoUrl?: string;
	content?: string;
}

export interface QuizPayload {
	title: string;
	courseId: string;
	description?: string;
	lessonId?: string;
	order?: number;
	timeLimitSeconds?: number;
	isPublished?: boolean;
	questions?: QuizQuestionPayload[];
}

export type LessonUpdatePayload = Partial<LessonPayload>;
export type QuizUpdatePayload = Partial<QuizPayload>;

async function tryFetchLiveCourses(): Promise<Course[] | null> {
	try {
		const apiCourses = await fetchFromApi<ApiCourse[]>(
			"/courses",
			{ cache: "no-store" },
			{ fallbackToMock: false }
		);
		if (!apiCourses || !apiCourses.length) {
			return null;
		}
		return apiCourses.map(transformCourse);
	} catch (error) {
		console.warn("Live courses request failed", error);
		return null;
	}
}

async function tryFetchCourseBySlug(slug: string): Promise<Course | null> {
	if (!slug) {
		return null;
	}
	try {
		const apiCourse = await fetchFromApi<ApiCourse>(
			`/courses/slug/${slug}`,
			{ cache: "no-store" },
			{ fallbackToMock: false }
		);
		return apiCourse ? transformCourse(apiCourse) : null;
	} catch (error) {
		console.warn(`Failed to fetch course by slug "${slug}" from API`, error);
		return null;
	}
}

export async function createCourse(payload: CoursePayload): Promise<Course> {
	const apiCourse = await fetchFromApi<ApiCourse>(
		"/courses",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!apiCourse) {
		throw new Error("Course API returned an empty response.");
	}
	return transformCourse(apiCourse);
}

export async function uploadLessonVideo(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("video", file);
	const response = await fetchFromApi<{ videoUrl: string }>(
		"/lessons/video",
		{
			method: "POST",
			body: formData,
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!response?.videoUrl) {
		throw new Error("Video upload failed. Please try again.");
	}
	return response.videoUrl;
}

export async function updateCourse(
	id: string,
	payload: CourseUpdatePayload
): Promise<Course> {
	const apiCourse = await fetchFromApi<ApiCourse>(
		`/courses/${id}`,
		{
			method: "PATCH",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!apiCourse) {
		throw new Error("Course update returned an empty response.");
	}
	return transformCourse(apiCourse);
}

export async function deleteCourse(id: string): Promise<void> {
	await fetchFromApi<null>(
		`/courses/${id}`,
		{
			method: "DELETE",
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
}

export async function getLessonsForCourse(courseId: string): Promise<Lesson[]> {
	if (!courseId) {
		return [];
	}
	try {
		const apiLessons = await fetchFromApi<ApiLesson[]>(
			`/lessons/course/${courseId}?t=${Date.now()}`,
			{ cache: "no-store" },
			{ fallbackToMock: true }
		);
		if (!apiLessons || !apiLessons.length) {
			return [];
		}
		return apiLessons.map(transformLesson);
	} catch (error) {
		console.error("Failed to get lessons:", error);
		return [];
	}
}

export async function createLesson(payload: LessonPayload): Promise<Lesson> {
	const apiLesson = await fetchFromApi<ApiLesson>(
		"/lessons",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!apiLesson) {
		throw new Error("Lesson API returned an empty response.");
	}
	return transformLesson(apiLesson);
}

export async function deleteLesson(id: string): Promise<void> {
	await fetchFromApi<null>(
		`/lessons/${id}`,
		{
			method: "DELETE",
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
}

export async function updateLesson(
	id: string,
	payload: LessonUpdatePayload
): Promise<Lesson> {
	const apiLesson = await fetchFromApi<ApiLesson>(
		`/lessons/${id}`,
		{
			method: "PATCH",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!apiLesson) {
		throw new Error("Lesson update returned an empty response.");
	}
	return transformLesson(apiLesson);
}

export async function getLesson(id: string): Promise<Lesson | null> {
	if (!id) {
		return null;
	}
	const apiLesson = await fetchFromApi<ApiLesson>(
		`/lessons/${id}`,
		{ cache: "force-cache" },
		{ fallbackToMock: true }
	);
	return apiLesson ? transformLesson(apiLesson) : null;
}

export async function getQuizzesForCourse(courseId: string): Promise<Quiz[]> {
	if (!courseId) {
		return [];
	}
	const apiQuizzes = await fetchFromApi<ApiQuiz[]>(
		`/quizzes/course/${courseId}?t=${Date.now()}`,
		{ cache: "no-store" },
		{ fallbackToMock: true }
	);
	console.log("Fetched quizzes from API:", apiQuizzes);
	if (!apiQuizzes || !apiQuizzes.length) {
		return [];
	}
	return apiQuizzes.map(transformQuiz);
}

export async function createQuiz(payload: QuizPayload): Promise<Quiz> {
	const apiQuiz = await fetchFromApi<ApiQuiz>(
		"/quizzes",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!apiQuiz) {
		throw new Error("Quiz API returned an empty response.");
	}
	return transformQuiz(apiQuiz);
}

export async function deleteQuiz(id: string): Promise<void> {
	await fetchFromApi<null>(
		`/quizzes/${id}`,
		{
			method: "DELETE",
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
}

export async function updateQuiz(
	id: string,
	payload: QuizUpdatePayload
): Promise<Quiz> {
	const apiQuiz = await fetchFromApi<ApiQuiz>(
		`/quizzes/${id}`,
		{
			method: "PATCH",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!apiQuiz) {
		throw new Error("Quiz update returned an empty response.");
	}
	return transformQuiz(apiQuiz);
}

export async function getQuiz(id: string): Promise<Quiz | null> {
	if (!id) {
		return null;
	}
	const apiQuiz = await fetchFromApi<ApiQuiz>(
		`/quizzes/${id}`,
		{ cache: "force-cache" },
		{ fallbackToMock: true }
	);
	return apiQuiz ? transformQuiz(apiQuiz) : null;
}

export async function fetchLiveCourses(): Promise<Course[]> {
	const liveCourses = await tryFetchLiveCourses();
	if (!liveCourses || !liveCourses.length) {
		throw new Error("Unable to load courses from the API.");
	}
	return liveCourses;
}

export async function getInstructorCourses(): Promise<Course[]> {
	const apiCourses = await fetchFromApi<ApiCourse[]>(
		"/courses/instructor/me",
		{ cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
	if (!apiCourses || !apiCourses.length) {
		return [];
	}
	return apiCourses.map(transformCourse);
}

export async function getAllCourses(options?: {
	live?: boolean;
	fallbackToMock?: boolean;
}): Promise<Course[]> {
	const shouldTryLive = options?.live ?? false;
	const fallbackToMock = options?.fallbackToMock ?? true;

	if (shouldTryLive) {
		const liveCourses = await tryFetchLiveCourses();
		if (liveCourses && liveCourses.length) {
			return liveCourses;
		}
	}
	const apiCourses = await fetchFromApi<ApiCourse[]>(
		"/courses",
		shouldTryLive ? { cache: "no-store" } : undefined,
		{ fallbackToMock }
	);
	if (apiCourses && apiCourses.length) {
		return apiCourses.map(transformCourse);
	}
	return fallbackToMock ? courses : [];
}

export async function getFeaturedCourses(): Promise<Course[]> {
	const data = await getAllCourses({ live: true });
	return data.slice(0, 3);
}

export async function getCourseBySlug(
	slug: string,
	options?: { preferLive?: boolean }
): Promise<Course | null> {
	if (!slug) {
		return null;
	}

	if (options?.preferLive) {
		const liveCourse = await tryFetchCourseBySlug(slug);
		if (liveCourse) {
			return liveCourse;
		}
	}

	const apiCourse = await tryFetchCourseBySlug(slug);
	if (apiCourse) {
		return apiCourse;
	}

	return null;
}

export async function getUserEnrollments(): Promise<
	Array<Enrollment & { course: Course }>
> {
	const data = await getAllCourses({ live: true });
	const enrollments = await fetchFromApi<Enrollment[]>(
		"/enrollments/user/me",
		{ cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
	if (!enrollments) {
		return enrollments ?? [];
	}
	return enrollments.map((enrollment) => ({
		...enrollment,
		course: data.find((course) => course.id === enrollment.courseId) ?? data[0],
	}));
}

export async function enrollInCourse(payload: {
	userId: string;
	courseId: string;
	progressPercent?: number;
}): Promise<Enrollment | null> {
	return fetchFromApi<Enrollment>(
		"/enrollments",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
}

// Wishlist

export async function fetchUserWishlist(userId: string) {
	const items = await fetchFromApi<Array<WishlistItem & { course: Course }>>(
		`/wishlist/user/${userId}`,
		{ cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
	if (items) return items;
	return wishlistItems
		.filter((item) => item.userId === userId)
		.map((item) => ({
			...item,
			course: courses.find((course) => course.id === item.courseId),
		}));
}

export async function addCourseToWishlist(payload: {
	userId: string;
	courseId: string;
}) {
	const item = await fetchFromApi<WishlistItem>(
		"/wishlist",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	return item;
}

export async function removeCourseFromWishlist(payload: {
	userId: string;
	courseId: string;
}) {
	await fetchFromApi(
		`/wishlist/${payload.userId}/${payload.courseId}`,
		{ method: "DELETE", cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
}

export async function fetchEnrollmentForCourse(
	userId: string,
	courseId: string
): Promise<Enrollment | null> {
	const enrollmentsForUser = await fetchFromApi<Enrollment[]>(
		`/enrollments/user/${userId}`,
		{ cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
	if (enrollmentsForUser) {
		return (
			enrollmentsForUser.find(
				(enrollment) => enrollment.courseId === courseId
			) ?? null
		);
	}
	return null;
}

export async function updateEnrollment(
	enrollmentId: string,
	payload: Partial<{
		progressPercent: number;
		completedLessonIds: string[];
	}>
): Promise<Enrollment> {
	const updated = await fetchFromApi<Enrollment>(
		`/enrollments/${enrollmentId}`,
		{
			method: "PATCH",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!updated) {
		throw new Error("Enrollment update returned an empty response.");
	}
	return updated;
}

export async function getTestimonials(): Promise<Testimonial[]> {
	return testimonials;
}

export async function getCategories(): Promise<string[]> {
	return mockCategories;
}

export async function getLearningPaths() {
	return learningPaths;
}

export async function getReviewsForCourse(courseId: string): Promise<Review[]> {
	const reviews = await fetchFromApi<Review[]>(
		`/reviews/course/${courseId}`,
		{ cache: "no-store" },
		{ fallbackToMock: false }
	);
	return reviews ?? [];
}

export async function createReview(
	courseId: string,
	rating: number,
	comment: string
): Promise<Review> {
	const review = await fetchFromApi<Review>(
		"/reviews",
		{
			method: "POST",
			body: JSON.stringify({ courseId, rating, comment }),
			cache: "no-store",
		},
		{ fallbackToMock: false, auth: true }
	);
	if (!review) {
		throw new Error("Failed to create review");
	}
	return review;
}

export async function checkUserReview(
	courseId: string
): Promise<Review | null> {
	return fetchFromApi<Review>(
		`/reviews/me/${courseId}`,
		{ cache: "no-store" },
		{ fallbackToMock: false, auth: true }
	);
}
