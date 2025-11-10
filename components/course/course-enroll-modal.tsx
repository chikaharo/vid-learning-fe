"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

import { getStoredUser } from "@/lib/session";
import type { Course } from "@/types/course";

interface CourseEnrollModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirmEnroll: () => Promise<void>;
	onAddToWishlist: () => Promise<void>;
	course: Course;
	isBusy?: boolean;
}

export function CourseEnrollModal({
	isOpen,
	onClose,
	onConfirmEnroll,
	onAddToWishlist,
	course,
	isBusy = false,
}: CourseEnrollModalProps) {
	const [mode, setMode] = useState<"enroll" | "wishlist" | null>(null);
	const user = typeof window !== "undefined" ? getStoredUser() : null;

	async function handleEnroll() {
		setMode("enroll");
		await onConfirmEnroll();
		setMode(null);
	}

	async function handleWishlist() {
		setMode("wishlist");
		await onAddToWishlist();
		setMode(null);
	}

	const disabled = isBusy || !user;

	return (
		<Transition show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-40" onClose={onClose}>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-150"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/30" />
				</Transition.Child>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-200"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-150"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<Dialog.Panel className="w-full max-w-md transform rounded-3xl border border-zinc-200 bg-white p-6 text-left align-middle shadow-xl transition-all">
								<Dialog.Title className="text-xl font-semibold text-zinc-900">
									Ready to start {course.title}?
								</Dialog.Title>
								<p className="mt-2 text-sm text-zinc-600">
									You&apos;ll unlock {course.lessons?.length ?? "all"} lessons
									and quizzes plus lifetime dashboard tracking of your progress.
								</p>

								{!user && (
									<p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
										Log in to enroll or save to a wishlist.
									</p>
								)}

								<div className="mt-6 space-y-3">
									<button
										type="button"
										onClick={handleEnroll}
										disabled={disabled}
										className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{mode === "enroll" ? "Enrolling…" : "Confirm enrollment"}
									</button>
									<button
										type="button"
										onClick={handleWishlist}
										disabled={disabled}
										className="w-full rounded-full border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{mode === "wishlist" ? "Adding…" : "Add to wishlist"}
									</button>
								</div>

								<button
									type="button"
									className="mt-4 w-full text-sm text-zinc-500 underline decoration-dotted"
									onClick={onClose}
								>
									Maybe later
								</button>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
