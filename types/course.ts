export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface Instructor {
	id: string;
	name: string;
	title: string;
	avatarUrl: string;
	bio: string;
	students: number;
	reviews: number;
}

export interface Lesson {
	id: string;
	title: string;
	durationMinutes: number;
	isPreview?: boolean;
	videoStatus?: "PENDING" | "PROCESSING" | "READY" | "FAILED";
	order?: number;
	courseId?: string;
	moduleId?: string | null;
	quizzes?: Quiz[];
	createdAt?: string;
	updatedAt?: string;
	videoUrl?: string | null;
	content?: string | null;
}

export interface CourseModule {
	id: string;
	title: string;
	description: string;
	lessons: Lesson[];
}

export interface QuizOption {
	id: string;
	label: string;
	isCorrect: boolean;
	explanation?: string;
}

export interface QuizQuestion {
	id: string;
	prompt: string;
	points: number;
	options: QuizOption[];
	order: number;
}

export interface Quiz {
	id: string;
	title: string;
	description?: string;
	courseId: string;
	lessonId?: string | null;
	order?: number;
	timeLimitSeconds?: number;
	isPublished: boolean;
	questions?: QuizQuestion[];
	createdAt?: string;
	updatedAt?: string;
	type?: "PRACTICE" | "TEST";
	maxRetries?: number;
}

export interface Course {
	id: string;
	slug: string;
	title: string;
	description: string;
	level: CourseLevel;
	isPublished: boolean;
	durationMinutes: number;
	rating: number;
	ratingCount: number;
	students: number;
	price: number;
	currency: string;
	language: string;
	tags: string[];
	categories: string[];
	thumbnailUrl?: string | null;
	thumbnailColor: string;
	updatedAt: string;
	instructor: Instructor;
	modules: CourseModule[];
	lessons: Lesson[];
	highlights: string[];
	whatYouWillLearn: string[];
	requirements: string[];
}

export interface Enrollment {
	id: string;
	courseId: string;
	progressPercent: number;
	lastAccessed: string;
	completedLessonIds?: string[];
}

export interface Testimonial {
	id: string;
	quote: string;
	learnerName: string;
	role: string;
	courseId: string;
}

export interface WishlistItem {
	id: string;
	userId: string;
	courseId: string;
	course?: Course;
	createdAt?: string;
}

export interface Review {
	id: string;
	rating: number;
	comment: string;
	userId: string;
	courseId: string;
	createdAt: string;
	user?: {
		id: string;
		fullName?: string;
		name?: string;
		email: string;
	};
}
