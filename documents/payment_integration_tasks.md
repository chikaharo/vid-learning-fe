# Task: Add Stripe Payment Integration (Archived Checklists)

## Backend
- [ ] Add `price` column to `Course` entity <!-- id: 1 -->
- [ ] Create `Payment` entity <!-- id: 2 -->
- [ ] Install `stripe` package <!-- id: 3 -->
- [ ] Create `PaymentsModule` with Service and Controller <!-- id: 4 -->
- [ ] Implement `createPaymentIntent` to start purchase flow <!-- id: 5 -->
- [ ] Implement `verifyPayment` (or webhook) to complete enrollment <!-- id: 6 -->
- [ ] Add `price` field logic to Courses CRUD (if needed) <!-- id: 7 -->
- [ ] Create endpoint for User Payment History <!-- id: 8 -->

## Frontend
- [ ] Install `@stripe/stripe-js` and `@stripe/react-stripe-js` <!-- id: 9 -->
- [ ] Add env vars for Stripe Publishable Key <!-- id: 10 -->
- [ ] Update `CourseDetail` to display price and check enrollment <!-- id: 11 -->
- [ ] Implement `PaymentModal` with `PaymentElement` <!-- id: 12 -->
- [ ] Handle successful payment and redirect/state update <!-- id: 13 -->
- [ ] Create `MyCourses` / `Billing` page to show history <!-- id: 14 -->
