# Student Management for Instructor Dashboard

## Goal Description
Enable instructors to view and manage students enrolled in their courses. This involves adding a new "Students" tab to the course detail page in the instructor dashboard and implementing the necessary backend endpoints to fetch enrollment data.

## Proposed Changes

### Backend

#### [MODIFY] [enrollments.service.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/enrollments/enrollments.service.ts)
- Add `findForCourse(courseId: string)` method to retrieve all enrollments for a specific course, including user details.

#### [MODIFY] [enrollments.controller.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/enrollments/enrollments.controller.ts)
- Add `@Get('course/:courseId')` endpoint to expose `findForCourse`. Apply `JwtAuthGuard` and ensure the user is authorized (potentially checking if they are the instructor, though for now we'll stick to basic auth presence as the initial request implied generic management).

### Frontend

#### [MODIFY] [content-service.ts](file:///Users/admin/Desktop/datn/webhoc/frontend/lib/content-service.ts)
- Add `getEnrollmentsForCourse(courseId: string)` function to fetch enrollments from the new backend endpoint.

#### [MODIFY] [course-detail-client.tsx](file:///Users/admin/Desktop/datn/webhoc/frontend/components/course/course-detail-client.tsx)
- Add a tab system to switch between "Course Content" (existing) and "Students" (new).
- Implement the "Students" view to list enrolled users (name, email, progress).
- Fetch enrollment data when the Students tab is active.

## Verification Plan

### Automated Tests
- Run backend tests (if any) to ensure no regression.
- `pnpm test` in backend.

### Manual Verification
1.  **Backend**:
    - Use Swagger UI or `curl` to test `GET /enrollments/course/:courseId` (after enrolling a user).
2.  **Frontend**:
    - Go to `/dashboard/courses/[slug]`.
    - Verify the new "Students" tab appears.
    - Click "Students" tab.
    - Verify the list of enrolled students is displayed correctly.
    - Verify switching back to "Course Content" works.
