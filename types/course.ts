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
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
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
  highlights: string[];
  whatYouWillLearn: string[];
  requirements: string[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  progressPercent: number;
  lastAccessed: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  learnerName: string;
  role: string;
  courseId: string;
}
