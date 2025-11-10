import {
  courses,
  enrollments,
  learningPaths,
  testimonials,
  categories as mockCategories,
} from "@/data/mock-data";
import type {
	Course,
	Enrollment,
	Lesson,
	Quiz,
	Testimonial,
} from "@/types/course";
import { fetchFromApi } from "./api";

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
}

interface ApiQuiz {
  id: string;
  title: string;
  description?: string;
  timeLimitSeconds?: number;
  isPublished: boolean;
  courseId: string;
  lessonId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const MOCK_METRICS = {
  rating: 4.8,
  ratingCount: 1850,
  students: 52000,
};

const currency = "USD";

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
      typeof apiCourse.thumbnailUrl === "string" && apiCourse.thumbnailUrl.length
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
        apiCourse.instructor?.avatarUrl ??
        "/images/instructors/amelia.svg",
      bio:
        apiCourse.instructor?.bio ??
        "Helping thousands of builders ship video learning experiences.",
      students: Number(metadata.instructorStudents) || 48000,
      reviews: Number(metadata.instructorReviews) || 4200,
    },
    highlights: (metadata.highlights as string[]) ?? [
      "Hands-on curriculum",
      "Downloadable resources",
      "Career-ready projects",
    ],
    whatYouWillLearn: (metadata.whatYouWillLearn as string[]) ?? [
      "Ship a video learning MVP",
      "Model courses, lessons, and enrollments",
      "Design dashboards learners love",
    ],
    requirements: (metadata.requirements as string[]) ?? [
      "Basic JavaScript knowledge",
      "Curiosity to learn",
    ],
    modules: [],
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
    createdAt:
      apiLesson.createdAt ??
      new Date().toISOString(),
    updatedAt:
      apiLesson.updatedAt ??
      apiLesson.createdAt ??
      new Date().toISOString(),
  };
}

function transformQuiz(apiQuiz: ApiQuiz): Quiz {
  return {
    id: apiQuiz.id,
    title: apiQuiz.title,
    description: apiQuiz.description,
    timeLimitSeconds: apiQuiz.timeLimitSeconds,
    isPublished: apiQuiz.isPublished ?? false,
    courseId: apiQuiz.courseId,
    lessonId: apiQuiz.lessonId ?? null,
    createdAt:
      apiQuiz.createdAt ??
      new Date().toISOString(),
    updatedAt:
      apiQuiz.updatedAt ??
      apiQuiz.createdAt ??
      new Date().toISOString(),
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

export type CourseUpdatePayload = Partial<Omit<CoursePayload, "instructorId">> & {
  instructorId?: string;
};

export interface LessonPayload {
  title: string;
  courseId: string;
  durationMinutes?: number;
  order?: number;
  isPreview?: boolean;
  moduleId?: string;
}

export interface QuizPayload {
  title: string;
  courseId: string;
  description?: string;
  lessonId?: string;
  timeLimitSeconds?: number;
  isPublished?: boolean;
}

export type LessonUpdatePayload = Partial<LessonPayload>;
export type QuizUpdatePayload = Partial<QuizPayload>;

export async function createCourse(payload: CoursePayload): Promise<Course> {
  const apiCourse = await fetchFromApi<ApiCourse>(
    "/courses",
    {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
    { fallbackToMock: false, auth: true },
  );
  if (!apiCourse) {
    throw new Error("Course API returned an empty response.");
  }
  return transformCourse(apiCourse);
}

export async function updateCourse(
  id: string,
  payload: CourseUpdatePayload,
): Promise<Course> {
  const apiCourse = await fetchFromApi<ApiCourse>(
    `/courses/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
    { fallbackToMock: false, auth: true },
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
    { fallbackToMock: false, auth: true },
  );
}

export async function getLessonsForCourse(courseId: string): Promise<Lesson[]> {
  if (!courseId) {
    return [];
  }
  const apiLessons = await fetchFromApi<ApiLesson[]>(
    `/lessons/course/${courseId}`,
    { cache: "no-store" },
    { fallbackToMock: false },
  );
  if (!apiLessons || !apiLessons.length) {
    return [];
  }
  return apiLessons.map(transformLesson);
}

export async function createLesson(payload: LessonPayload): Promise<Lesson> {
  const apiLesson = await fetchFromApi<ApiLesson>(
    "/lessons",
    {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
    { fallbackToMock: false, auth: true },
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
    { fallbackToMock: false, auth: true },
  );
}

export async function updateLesson(
  id: string,
  payload: LessonUpdatePayload,
): Promise<Lesson> {
  const apiLesson = await fetchFromApi<ApiLesson>(
    `/lessons/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
    { fallbackToMock: false, auth: true },
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
    { cache: "no-store" },
    { fallbackToMock: false },
  );
  return apiLesson ? transformLesson(apiLesson) : null;
}

export async function getQuizzesForCourse(courseId: string): Promise<Quiz[]> {
  if (!courseId) {
    return [];
  }
  const apiQuizzes = await fetchFromApi<ApiQuiz[]>(
    `/quizzes/course/${courseId}`,
    { cache: "no-store" },
    { fallbackToMock: false },
  );
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
    { fallbackToMock: false, auth: true },
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
    { fallbackToMock: false, auth: true },
  );
}

export async function updateQuiz(
  id: string,
  payload: QuizUpdatePayload,
): Promise<Quiz> {
  const apiQuiz = await fetchFromApi<ApiQuiz>(
    `/quizzes/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      cache: "no-store",
    },
    { fallbackToMock: false, auth: true },
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
    { cache: "no-store" },
    { fallbackToMock: false },
  );
  return apiQuiz ? transformQuiz(apiQuiz) : null;
}

export async function fetchLiveCourses(): Promise<Course[]> {
  const apiCourses = await fetchFromApi<ApiCourse[]>(
    "/courses",
    { cache: "no-store" },
    { fallbackToMock: false },
  );
  if (!apiCourses || !apiCourses.length) {
    throw new Error("Unable to load courses from the API.");
  }
  return apiCourses.map(transformCourse);
}

export async function getAllCourses(): Promise<Course[]> {
  const apiCourses = await fetchFromApi<ApiCourse[]>("/courses");
  if (apiCourses && apiCourses.length) {
    return apiCourses.map(transformCourse);
  }
  return courses;
}

export async function getFeaturedCourses(): Promise<Course[]> {
  const data = await getAllCourses();
  return data.slice(0, 3);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const data = await getAllCourses();
  const course = data.find((item) => item.slug === slug);
  return course ?? null;
}

export async function getUserEnrollments(): Promise<
  Array<Enrollment & { course: Course }>
> {
  const data = await getAllCourses();
  return enrollments.map((enrollment) => ({
    ...enrollment,
    course:
      data.find((course) => course.id === enrollment.courseId) ?? data[0],
  }));
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
