"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import {
	createQuiz,
	getLessonsForCourse,
	updateQuiz,
} from "@/lib/content-service";
import type { QuizPayload, QuizQuestionPayload } from "@/lib/content-service";
import type { Lesson, Quiz } from "@/types/course";
import { getStoredUser } from "@/lib/session";

type QuestionForm = {
	prompt: string;
	points: string;
	options: Array<{
		label: string;
		explanation: string;
		isCorrect: boolean;
	}>;
};

interface QuizFormProps {
	courseId: string;
	courseSlug: string;
	mode: "create" | "edit";
	initialQuiz?: Quiz;
	initialLessons?: Lesson[];
	initialOrder?: number;
}

export function QuizForm({
	courseId,
	courseSlug,
	mode,
	initialQuiz,
	initialLessons = [],
	initialOrder,
}: QuizFormProps) {
	const router = useRouter();
	const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
	const [isLoadingLessons, setIsLoadingLessons] = useState(false);
	const [questions, setQuestions] = useState<QuestionForm[]>(
		initialQuiz?.questions?.length
			? initialQuiz.questions.map((q) => ({
					prompt: q.prompt,
					points: String(q.points),
					options: q.options.map((o) => ({
						label: o.label,
						explanation: o.explanation ?? "",
						isCorrect: o.isCorrect,
					})),
			  }))
			: [
					{
						prompt: "",
						points: "1",
						options: [
							{ label: "", explanation: "", isCorrect: true },
							{ label: "", explanation: "", isCorrect: false },
							{ label: "", explanation: "", isCorrect: false },
							{ label: "", explanation: "", isCorrect: false },
						],
					},
			  ]
	);
	const [form, setForm] = useState({
		title: initialQuiz?.title ?? "",
		description: initialQuiz?.description ?? "",
		timeLimitSeconds: initialQuiz?.timeLimitSeconds
			? String(initialQuiz.timeLimitSeconds)
			: "",
		isPublished: Boolean(initialQuiz?.isPublished),
		lessonId: initialQuiz?.lessonId ?? "",
		type: initialQuiz?.type ?? "PRACTICE",
		maxRetries: initialQuiz?.maxRetries ? String(initialQuiz.maxRetries) : "",
	});
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [disableMutations, setDisableMutations] = useState<boolean | null>(
		false
	);

	useEffect(() => {
		setDisableMutations(!getStoredUser());
	}, []);

	useEffect(() => {
		if (initialLessons.length) return;
		setIsLoadingLessons(true);
		getLessonsForCourse(courseId)
			.then((data) => setLessons(data))
			.catch((err) =>
				setError(
					err instanceof Error
						? err.message
						: "Unable to load lessons for the dropdown."
				)
			)
			.finally(() => setIsLoadingLessons(false));
	}, [courseId, initialLessons.length]);

	useEffect(() => {
		if (!form.lessonId) return;
		if (!lessons.find((lesson) => lesson.id === form.lessonId)) {
			setForm((prev) => ({ ...prev, lessonId: "" }));
		}
	}, [lessons, form.lessonId]);

	function updateQuestionField(
		index: number,
		field: keyof QuestionForm
	): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
		return (event) => {
			const value = event.target.value;
			setQuestions((prev) =>
				prev.map((question, idx) =>
					idx === index ? { ...question, [field]: value } : question
				)
			);
		};
	}

	function updateOptionField(
		qIndex: number,
		oIndex: number,
		field: "label" | "explanation"
	): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
		return (event) => {
			const value = event.target.value;
			setQuestions((prev) =>
				prev.map((question, idx) => {
					if (idx !== qIndex) return question;
					return {
						...question,
						options: question.options.map((opt, optIdx) =>
							optIdx === oIndex ? { ...opt, [field]: value } : opt
						),
					};
				})
			);
		};
	}

	function setCorrectOption(qIndex: number, oIndex: number) {
		setQuestions((prev) =>
			prev.map((question, idx) => {
				if (idx !== qIndex) return question;
				return {
					...question,
					options: question.options.map((opt, optIdx) => ({
						...opt,
						isCorrect: optIdx === oIndex,
					})),
				};
			})
		);
	}

	function addOption(qIndex: number) {
		setQuestions((prev) =>
			prev.map((question, idx) => {
				if (idx !== qIndex) return question;
				return {
					...question,
					options: [
						...question.options,
						{ label: "", explanation: "", isCorrect: false },
					],
				};
			})
		);
	}

	function addQuestion() {
		setQuestions((prev) => [
			...prev,
			{
				prompt: "",
				points: "1",
				options: [
					{ label: "", explanation: "", isCorrect: true },
					{ label: "", explanation: "", isCorrect: false },
					{ label: "", explanation: "", isCorrect: false },
					{ label: "", explanation: "", isCorrect: false },
				],
			},
		]);
	}

	function removeQuestion(index: number) {
		setQuestions((prev) => prev.filter((_, idx) => idx !== index));
	}

	function updateField(
		field: keyof typeof form
	): (
		event: ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => void {
		return (event) => {
			const value =
				event.target.type === "checkbox"
					? (event.target as HTMLInputElement).checked
					: event.target.value;
			setForm((prev) => ({ ...prev, [field]: value }));
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus(null);
		setError(null);

		if (!form.title.trim()) {
			setError("Quiz title is required.");
			return;
		}

		if (questions.length === 0) {
			setError("Add at least one question to create a quiz.");
			return;
		}

		const questionPayloads: QuizQuestionPayload[] = [];
		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			if (!q.prompt.trim()) {
				setError(`Question ${i + 1} needs a prompt.`);
				return;
			}
			if (q.options.length < 2) {
				setError(`Question ${i + 1} needs at least two options.`);
				return;
			}
			const correctCount = q.options.filter((opt) => opt.isCorrect).length;
			if (correctCount !== 1) {
				setError(`Question ${i + 1} must have exactly one correct answer.`);
				return;
			}
			questionPayloads.push({
				prompt: q.prompt.trim(),
				order: i,
				points: Number(q.points) || 1,
				options: q.options.map((opt) => ({
					label: opt.label.trim(),
					explanation: opt.explanation.trim() || undefined,
					isCorrect: opt.isCorrect,
				})),
			});
		}

		const payload: QuizPayload = {
			title: form.title.trim(),
			courseId,
			description: form.description.trim() || undefined,
			timeLimitSeconds: form.timeLimitSeconds
				? Number(form.timeLimitSeconds)
				: undefined,
			isPublished: form.isPublished,
			lessonId: form.lessonId || undefined,
			questions: questionPayloads,
			order: mode === "create" ? initialOrder : undefined,
			type: form.type as "PRACTICE" | "TEST",
			maxRetries:
				form.type === "TEST" && form.maxRetries
					? Number(form.maxRetries)
					: undefined,
		};

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createQuiz(payload);
				setStatus("Quiz created. Redirecting…");
			} else if (initialQuiz) {
				await updateQuiz(initialQuiz.id, payload);
				setStatus("Quiz updated. Redirecting…");
			}
			setTimeout(() => router.push(`/dashboard/courses/${courseSlug}`), 800);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to save quiz right now."
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			{error && (
				<p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</p>
			)}
			{status && (
				<p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					{status}
				</p>
			)}
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Title
				</span>
				<input
					type="text"
					value={form.title}
					onChange={updateField("title")}
					placeholder="Module checkpoint quiz"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<label className="block">
				<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Description
				</span>
				<textarea
					rows={4}
					value={form.description}
					onChange={updateField("description")}
					placeholder="Share context or instructions for this quiz."
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Time limit (seconds)
					</span>
					<input
						type="number"
						min={60}
						step={30}
						value={form.timeLimitSeconds}
						onChange={updateField("timeLimitSeconds")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Linked lesson (optional)
					</span>
					<select
						value={form.lessonId}
						onChange={updateField("lessonId")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					>
						<option value="">
							{isLoadingLessons ? "Loading…" : "Apply to entire course"}
						</option>
						{lessons.map((lesson) => (
							<option key={lesson.id} value={lesson.id}>
								#{lesson.order ?? 0} · {lesson.title}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Quiz Mode
					</span>
					<select
						value={form.type}
						onChange={updateField("type" as any)}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					>
						<option value="PRACTICE">Practice (Unlimited)</option>
						<option value="TEST">Test (Assessment)</option>
					</select>
				</label>
				{form.type === "TEST" && (
					<label className="block animate-in fade-in zoom-in-95 duration-200">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Max Retries
						</span>
						<input
							type="number"
							min={1}
							placeholder="e.g. 3"
							value={form.maxRetries}
							onChange={updateField("maxRetries" as any)}
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
						/>
					</label>
				)}
			</div>
			<label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
				<input
					type="checkbox"
					checked={form.isPublished}
					onChange={updateField("isPublished")}
					className="h-4 w-4 rounded border-zinc-300 text-violet-600"
				/>
				Publish quiz immediately
			</label>

			<div className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Questions
						</p>
						<h3 className="text-lg font-semibold text-zinc-900">
							Single-choice only
						</h3>
					</div>
					<button
						type="button"
						onClick={addQuestion}
						className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-900"
					>
						Add question
					</button>
				</div>

				{questions.map((question, qIndex) => (
					<div
						key={qIndex}
						className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
					>
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold text-zinc-900">
								Question {qIndex + 1}
							</p>
							{questions.length > 1 && (
								<button
									type="button"
									onClick={() => removeQuestion(qIndex)}
									className="text-xs font-semibold text-red-600 transition hover:text-red-700"
								>
									Remove
								</button>
							)}
						</div>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Prompt
							</span>
							<textarea
								rows={2}
								value={question.prompt}
								onChange={updateQuestionField(qIndex, "prompt")}
								className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
								placeholder="What is the correct output of the following code?"
							/>
						</label>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Points
							</span>
							<input
								type="number"
								min={1}
								value={question.points}
								onChange={updateQuestionField(qIndex, "points")}
								className="mt-1 w-32 rounded-2xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-900"
							/>
						</label>

						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
								Options
							</p>
							{question.options.map((option, oIndex) => (
								<div
									key={oIndex}
									className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2"
								>
									<input
										type="radio"
										name={`q-${qIndex}-correct`}
										checked={option.isCorrect}
										onChange={() => setCorrectOption(qIndex, oIndex)}
										className="mt-2 h-4 w-4 text-violet-600"
									/>
									<div className="flex-1 space-y-2">
										<input
											type="text"
											value={option.label}
											onChange={updateOptionField(qIndex, oIndex, "label")}
											placeholder="Option text"
											className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
										/>
										<textarea
											rows={2}
											value={option.explanation}
											onChange={updateOptionField(
												qIndex,
												oIndex,
												"explanation"
											)}
											placeholder="Explanation (optional)"
											className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-900"
										/>
									</div>
								</div>
							))}
							<button
								type="button"
								onClick={() => addOption(qIndex)}
								className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-zinc-500"
							>
								Add option
							</button>
						</div>
					</div>
				))}
			</div>

			<button
				type="submit"
				disabled={disableMutations || isSubmitting}
				className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting
					? mode === "create"
						? "Creating quiz…"
						: "Saving changes…"
					: mode === "create"
					? "Create quiz"
					: "Save quiz"}
			</button>
		</form>
	);
}
