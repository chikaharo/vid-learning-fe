# Stripe Payment Integration Plan (Archived)

## Goal
Enable users to purchase courses using Visa cards via Stripe. Users can see course prices, pay, access content immediately, and view payment history.

## User Review Required
> [!IMPORTANT]
> - I will be adding a `price` column to the `Course` table. Existing courses will default to 0 (free).
> - I will use a **manual verification** endpoint (`/payments/verify`) called by the frontend after Stripe confirmation, instead of Webhooks, to simplify local development integration.
> - **Stripe Keys**: I will rely on `STRIPE_SECRET_KEY` (Backend) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Frontend) environment variables.

## Proposed Changes

### Backend

#### [MODIFY] [course.entity.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/courses/entities/course.entity.ts)
- Add `price` column (type `decimal` or `int` for cents).

#### [NEW] [payment.entity.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/payments/entities/payment.entity.ts)
- Store `stripePaymentIntentId`, `amount`, `status`, `userId`, `courseId`.

#### [NEW] [payments.module.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/payments/payments.module.ts)
- Setup Stripe client.

#### [NEW] [payments.service.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/payments/payments.service.ts)
- `createPaymentIntent(user, courseId)`
- `verifyPayment(paymentIntentId)` -> Updates Enrollment status to ACTIVE.
- `getUserPayments(userId)`

#### [NEW] [payments.controller.ts](file:///Users/admin/Desktop/datn/webhoc/backend/src/modules/payments/payments.controller.ts)
- `POST /payments/create-intent`
- `POST /payments/verify`
- `GET /payments/history`

### Frontend

#### [MODIFY] [course-detail-client.tsx](file:///Users/admin/Desktop/datn/webhoc/frontend/components/course/course-detail-client.tsx)
- Check if course has price > 0 and user not enrolled.
- Show "Enroll now" (free) vs "Buy now" ($$).
- Trigger Payment Modal.

#### [NEW] [payment-modal.tsx](file:///Users/admin/Desktop/datn/webhoc/frontend/components/payment/payment-modal.tsx)
- Wrap `Elements` provider.
- Show `PaymentElement`.
- Handle submit.

#### [NEW] [payment-history-page.tsx](file:///Users/admin/Desktop/datn/webhoc/frontend/app/profile/payments/page.tsx)
- List user transactions.

## Verification Plan

### Automated Tests
- None planned for this iteration (speed focus).

### Manual Verification
1. Set a course price to $10.
2. Login as student.
3. Open course page -> verify "Buy for $10" button appears.
4. Click Buy -> Payment Modal opens.
5. Use Stripe Test Card (4242...) -> Pay.
6. Verify loading state.
7. Verify success message and immediate redirect to course content.
8. Check "My Payments" page for the record.
