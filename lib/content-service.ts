import {
  courses,
  enrollments,
  learningPaths,
  testimonials,
  categories as mockCategories,
} from "@/data/mock-data";
import type { Course, Enrollment, Testimonial } from "@/types/course";
import { fetchFromApi } from "./api";

interface ApiCourse {
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

const MOCK_METRICS = {
  rating: 4.8,
  ratingCount: 1850,
  students: 52000,
};

const currency = "USD";

function transformCourse(apiCourse: ApiCourse): Course {
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
    durationMinutes: apiCourse.durationMinutes ?? 0,
    tags: Array.isArray(apiCourse.tags) ? apiCourse.tags : [],
    rating: Number(metadata.rating) || MOCK_METRICS.rating,
    ratingCount: Number(metadata.ratingCount) || MOCK_METRICS.ratingCount,
    students: Number(metadata.students) || MOCK_METRICS.students,
    price: Number(metadata.price) || 19.99,
    currency,
    language: (metadata.language as string) ?? "English",
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
