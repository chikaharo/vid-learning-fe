import type {
  Course,
  CourseLevel,
  Enrollment,
  Instructor,
  Testimonial,
  WishlistItem,
} from "@/types/course";

const instructors: Instructor[] = [
  {
    id: "inst-1",
    name: "Amelia Nguyen",
    title: "Principal Software Engineer, Streamly",
    avatarUrl: "/images/instructors/amelia.png",
    bio: "10+ years building video platforms, focusing on streaming optimization and engaging learner experiences.",
    students: 48000,
    reviews: 4200,
  },
  {
    id: "inst-2",
    name: "Mateo Rodriguez",
    title: "Lead AI Instructor, Coders Guild",
    avatarUrl: "/images/instructors/mateo.png",
    bio: "Former Udemy instructor of the year with a passion for applied AI in education.",
    students: 82000,
    reviews: 6100,
  },
  {
    id: "inst-3",
    name: "Sofia Park",
    title: "Senior Product Designer, Aurora",
    avatarUrl: "/images/instructors/sofia.png",
    bio: "Specializes in human-centered design and turning complex tools into delightful learner journeys.",
    students: 36000,
    reviews: 3400,
  },
];

const sharedHighlights = [
  "Hands-on projects based on real production scenarios",
  "Downloadable resources + lifetime updates",
  "Certificate of completion backed by hiring partners",
];

const sharedWhatYouWillLearn = [
  "Build a production-ready video learning experience from scratch",
  "Design engaging course outlines that mirror high-performing marketplaces",
  "Ship performant UI flows for browsing, enrolling, and completing lessons",
];

const sharedRequirements = [
  "A modern browser and editor",
  "Basic familiarity with JavaScript/TypeScript",
  "Curiosity to build learner-first experiences",
];

const createCourse = ({
  id,
  title,
  slug,
  level,
  categories,
  durationMinutes,
  instructorId,
  thumbnailColor,
}: {
  id: string;
  title: string;
  slug: string;
  level: CourseLevel;
  categories: string[];
  durationMinutes: number;
  instructorId: string;
  thumbnailColor: string;
}): Course => {
  const instructor = instructors.find((it) => it.id === instructorId)!;
  return {
    id,
    title,
    slug,
    description:
      "Everything you need to plan, produce, and ship a premium video learning platform inspired by Udemy.",
    level,
    isPublished: true,
    categories,
    durationMinutes,
    rating: 4.8,
    ratingCount: 1850,
    students: 52000,
    price: 19.99,
    currency: "USD",
    language: "English",
    tags: ["video", "learning", "frontend", "design"],
    thumbnailUrl: null,
    thumbnailColor,
    updatedAt: "2025-01-04T00:00:00.000Z",
    instructor,
    highlights: sharedHighlights,
    whatYouWillLearn: sharedWhatYouWillLearn,
    requirements: sharedRequirements,
    modules: [
      {
        id: `${id}-m1`,
        title: "Foundations",
        description: "Craft the product vision and learner journey.",
        lessons: [
          {
            id: `${id}-l1`,
            title: "Mapping marketplace expectations",
            durationMinutes: 18,
            isPreview: true,
            videoStatus: "READY",
          },
          {
            id: `${id}-l2`,
            title: "Design systems for course discovery",
            durationMinutes: 24,
            videoStatus: "READY",
          },
        ],
      },
      {
        id: `${id}-m2`,
        title: "Implementation",
        description: "Translate UX into resilient components.",
        lessons: [
          {
            id: `${id}-l3`,
            title: "Building catalog sections",
            durationMinutes: 32,
            videoStatus: "READY",
          },
          {
            id: `${id}-l4`,
            title: "Integrating with NestJS backend",
            durationMinutes: 27,
            videoStatus: "PROCESSING",
          },
        ],
      },
    ],
  };
};

export const categories = [
  "Web Development",
  "Design",
  "Productivity",
  "Cloud & DevOps",
  "AI & ML",
  "Data Visualization",
];

export const courses: Course[] = [
  createCourse({
    id: "course-1",
    title: "Build a Video Learning Platform with Next.js & NestJS",
    slug: "video-learning-platform-nextjs-nestjs",
    level: "INTERMEDIATE",
    categories: ["Web Development", "Productivity"],
    durationMinutes: 640,
    instructorId: "inst-1",
    thumbnailColor: "from-purple-500 via-fuchsia-500 to-orange-400",
  }),
  createCourse({
    id: "course-2",
    title: "Designing Cohort-Based Video Courses",
    slug: "designing-cohort-video-courses",
    level: "BEGINNER",
    categories: ["Design"],
    durationMinutes: 420,
    instructorId: "inst-3",
    thumbnailColor: "from-sky-500 via-blue-500 to-indigo-500",
  }),
  createCourse({
    id: "course-3",
    title: "AI Personalization for Learning Marketplaces",
    slug: "ai-personalization-learning",
    level: "ADVANCED",
    categories: ["AI & ML"],
    durationMinutes: 560,
    instructorId: "inst-2",
    thumbnailColor: "from-emerald-500 via-green-500 to-lime-400",
  }),
];

export const testimonials: Testimonial[] = [
  {
    id: "test-1",
    quote:
      "We shipped our course marketplace MVP in six weeks using the exact flow from this project.",
    learnerName: "Priya Desai",
    role: "PM, LaunchPad",
    courseId: "course-1",
  },
  {
    id: "test-2",
    quote:
      "The curriculum structure mirrors what high-performing Udemy courses do. It saved our design team months.",
    learnerName: "Nico Alvarez",
    role: "Design Lead, StudioX",
    courseId: "course-2",
  },
];

export const enrollments: Enrollment[] = [
  {
    id: "enroll-1",
    courseId: "course-1",
    progressPercent: 62,
    lastAccessed: "2025-01-05T08:15:00.000Z",
  },
  {
    id: "enroll-2",
    courseId: "course-3",
    progressPercent: 34,
    lastAccessed: "2024-12-29T18:40:00.000Z",
  },
];

export const wishlistItems: WishlistItem[] = [];

export const learningPaths = [
  {
    id: "path-1",
    title: "Ship a production-ready video learning startup",
    steps: [
      "Lay the UX + product foundations",
      "Build catalog & discovery experiences",
      "Instrument enrollments, progress, and quizzes",
      "Polish dashboards + certificate flows",
    ],
  },
];

export { instructors };
