"use client";

import { useRouter } from "next/navigation";
import {
	useEffect,
	useMemo,
	useState,
	type ChangeEvent,
	type FormEvent,
} from "react";

import {
	createLesson,
	updateLesson,
	uploadLessonVideo,
	type LessonPayload,
} from "@/lib/content-service";
import type { Lesson } from "@/types/course";
import { getStoredUser } from "@/lib/session";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";

// const RichTextEditor = dynamic(() => import("react-quill"), { ssr: false });

interface LessonFormProps {
	courseId: string;
	courseSlug: string;
	mode: "create" | "edit";
	initialLesson?: Lesson;
}

export function LessonForm({
	courseId,
	courseSlug,
	mode,
	initialLesson,
}: LessonFormProps) {
	const router = useRouter();
	const inferVideoSource = (url?: string | null) =>
		url && !url.startsWith("http") ? "upload" : "external";
	const [form, setForm] = useState({
		title: initialLesson?.title ?? "",
		durationMinutes: String(initialLesson?.durationMinutes ?? 5),
		order: String(initialLesson?.order ?? 0),
		isPreview: Boolean(initialLesson?.isPreview),
	});

	const [videoSource, setVideoSource] = useState<"upload" | "external">(
		inferVideoSource(initialLesson?.videoUrl)
	);
	const [videoUrl, setVideoUrl] = useState(initialLesson?.videoUrl ?? "");
	const initialContent = useMemo(
		() => initialLesson?.content ?? "",
		[initialLesson?.content]
	);
	const [content, setContent] = useState(initialContent);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadMessage, setUploadMessage] = useState<string | null>(null);

	const editor = useEditor(
		{
			extensions: [
				StarterKit,
				Underline,
				Image,
				Heading.configure({ levels: [2, 3, 4] }),
				TextAlign.configure({
					types: ["heading", "paragraph"],
				}),
				Placeholder.configure({
					placeholder:
						"Outline the key talking points, add resources, or summarize the video.",
				}),
				LinkExtension.configure({
					autolink: false,
					linkOnPaste: true,
					openOnClick: false,
					HTMLAttributes: {
						class: "text-violet-600 underline hover:text-violet-800",
						rel: "noreferrer noopener",
					},
					protocols: ["http", "https"],
				}),
			],
			content: initialContent,
			immediatelyRender: false,
			onUpdate: ({ editor }) => {
				setContent(editor.getHTML());
			},
		},
		[initialContent]
	);

	useEffect(() => {
		if (editor && initialContent && editor.getHTML() !== initialContent) {
			editor.commands.setContent(initialContent);
		}
	}, [editor, initialContent]);

	const disableMutations = !getStoredUser();
	const uploadsBase = useMemo(() => {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
		if (!apiUrl) return "";
		return apiUrl.replace(/\/api\/?$/, "");
	}, []);

	const resolvedVideoUrl = videoUrl
		? videoUrl.startsWith("http")
			? videoUrl
			: `${uploadsBase}${videoUrl}`
		: "";

	function updateField(
		field: keyof typeof form
	): (event: ChangeEvent<HTMLInputElement>) => void {
		return (event) => {
			const value =
				event.target.type === "checkbox"
					? (event.target as HTMLInputElement).checked
					: event.target.value;
			setForm((prev) => ({ ...prev, [field]: value }));
		};
	}

	function handleVideoSourceChange(event: ChangeEvent<HTMLInputElement>) {
		setVideoSource(event.target.value as "upload" | "external");
		if (event.target.value === "external") {
			setUploadMessage(null);
		}
	}

	async function handleVideoUpload(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		setIsUploading(true);
		setUploadMessage("Uploading video…");
		setError(null);
		try {
			const uploadedUrl = await uploadLessonVideo(file);
			setVideoUrl(uploadedUrl);
			setVideoSource("upload");
			setUploadMessage("Upload complete. Remember to save the lesson.");
		} catch (err) {
			setUploadMessage(null);
			setError(
				err instanceof Error
					? err.message
					: "Upload failed. Please try again or pick a smaller file."
			);
		} finally {
			setIsUploading(false);
			event.target.value = "";
		}
	}

	function renderVideoPreview() {
		if (!videoUrl) {
			return null;
		}
		const isYouTube =
			videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
		if (isYouTube) {
			const embedUrl = videoUrl
				.replace("watch?v=", "embed/")
				.replace("youtu.be/", "youtube.com/embed/");
			return (
				<div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
					<iframe
						title="Lesson video preview"
						src={embedUrl}
						className="h-64 w-full"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				</div>
			);
		}
		return (
			<div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-black">
				<video
					key={videoUrl}
					src={resolvedVideoUrl}
					controls
					className="h-64 w-full"
					preload="metadata"
				/>
			</div>
		);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus(null);
		setError(null);

		if (!form.title.trim()) {
			setError("Lesson title is required.");
			return;
		}

		const payload: LessonPayload = {
			title: form.title.trim(),
			courseId,
			durationMinutes: Number(form.durationMinutes) || 5,
			order: Number(form.order) || 0,
			isPreview: form.isPreview,
			videoUrl: videoUrl || undefined,
			content: content?.trim() ? content : undefined,
		};

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createLesson(payload);
				setStatus("Lesson created. Redirecting…");
			} else if (initialLesson) {
				await updateLesson(initialLesson.id, payload);
				setStatus("Lesson updated. Redirecting…");
			}
			setTimeout(() => router.push(`/dashboard/courses/${courseSlug}`), 800);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Unable to save lesson right now."
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	useEffect(() => {
		console.log("is submitting:", isSubmitting);
	}, [isSubmitting]);

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
					placeholder="Design systems for discovery"
					className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
				/>
			</label>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Duration (minutes)
					</span>
					<input
						type="number"
						min={1}
						value={form.durationMinutes}
						onChange={updateField("durationMinutes")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Display order
					</span>
					<input
						type="number"
						min={0}
						value={form.order}
						onChange={updateField("order")}
						className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
					/>
				</label>
			</div>
			<label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
				<input
					type="checkbox"
					checked={form.isPreview}
					onChange={updateField("isPreview")}
					className="h-4 w-4 rounded border-zinc-300 text-violet-600"
				/>
				Mark as preview lesson
			</label>
			<section className="space-y-3 rounded-2xl border border-zinc-200 p-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						Lesson video
					</p>
					<p className="text-xs text-zinc-500">
						Link a YouTube/video URL or upload a file (MP4, WebM, up to 500 MB).
					</p>
				</div>
				<div className="flex flex-wrap gap-4 text-sm font-medium text-zinc-700">
					<label className="flex items-center gap-2">
						<input
							type="radio"
							name="videoSource"
							value="external"
							checked={videoSource === "external"}
							onChange={handleVideoSourceChange}
						/>
						Use URL (YouTube, Vimeo, etc.)
					</label>
					<label className="flex items-center gap-2">
						<input
							type="radio"
							name="videoSource"
							value="upload"
							checked={videoSource === "upload"}
							onChange={handleVideoSourceChange}
						/>
						Upload video file
					</label>
				</div>
				{videoSource === "external" ? (
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
							Video URL
						</span>
						<input
							type="url"
							placeholder="https://www.youtube.com/watch?v=..."
							value={videoUrl}
							onChange={(event) => setVideoUrl(event.target.value)}
							className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
						/>
					</label>
				) : (
					<div className="space-y-2">
						<input
							type="file"
							accept="video/*"
							onChange={handleVideoUpload}
							disabled={isUploading || disableMutations}
							className="w-full rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-sm"
						/>
						{uploadMessage && (
							<p className="text-xs text-zinc-600">{uploadMessage}</p>
						)}
					</div>
				)}
				{renderVideoPreview()}
			</section>
			<section className="space-y-2 rounded-2xl border border-zinc-200 p-4">
				<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					Lesson content
				</p>
				{editor ? (
					<div className="space-y-3">
						<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
							<button
								type="button"
								onClick={() => editor.chain().focus().toggleBold().run()}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("bold")
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								B
							</button>
							<button
								type="button"
								onClick={() => editor.chain().focus().toggleItalic().run()}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("italic")
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								I
							</button>
							<button
								type="button"
								onClick={() => editor.chain().focus().toggleUnderline().run()}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("underline")
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								U
							</button>
							<div className="h-6 w-px bg-zinc-200" />
							{(["left", "center", "right"] as const).map((align) => (
								<button
									type="button"
									key={align}
									onClick={() =>
										editor.chain().focus().setTextAlign(align).run()
									}
									className={`rounded-full border px-3 py-1 capitalize ${
										editor.isActive({ textAlign: align })
											? "border-zinc-900 bg-zinc-900 text-white"
											: "border-zinc-200 text-zinc-700"
									}`}
								>
									{align}
								</button>
							))}
							<div className="h-6 w-px bg-zinc-200" />
							<button
								type="button"
								onClick={() => editor.chain().focus().toggleBulletList().run()}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("bulletList")
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								List
							</button>
							<button
								type="button"
								onClick={() => editor.chain().focus().toggleOrderedList().run()}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("orderedList")
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								1.
							</button>
							<div className="h-6 w-px bg-zinc-200" />
							<button
								type="button"
								onClick={() =>
									editor.chain().focus().setHeading({ level: 2 }).run()
								}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("heading", { level: 2 })
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								H2
							</button>
							<button
								type="button"
								onClick={() =>
									editor.chain().focus().setHeading({ level: 3 }).run()
								}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("heading", { level: 3 })
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								H3
							</button>
							<button
								type="button"
								onClick={() =>
									editor.chain().focus().setHeading({ level: 4 }).run()
								}
								className={`rounded-full border px-3 py-1 ${
									editor.isActive("heading", { level: 4 })
										? "border-zinc-900 bg-zinc-900 text-white"
										: "border-zinc-200 text-zinc-700"
								}`}
							>
								H4
							</button>
							<div className="h-6 w-px bg-zinc-200" />
							<button
								type="button"
								onClick={() => {
									const url = window.prompt("Enter image URL");
									if (!url) return;
									editor.chain().focus().setImage({ src: url }).run();
								}}
								className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700"
							>
								Image
							</button>
							<button
								type="button"
								onClick={() => {
									const url = window.prompt("Enter link URL");
									if (!url) return;
									editor
										.chain()
										.focus()
										.extendMarkRange("link")
										.setLink({ href: url })
										.run();
								}}
								className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700"
							>
								Link
							</button>
							<button
								type="button"
								onClick={() => editor.chain().focus().unsetLink().run()}
								className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700"
							>
								Unlink
							</button>
						</div>
						<EditorContent
							editor={editor}
							className="prose min-h-[200px] rounded-2xl border border-zinc-200 p-4"
						/>
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
						Loading editor…
					</div>
				)}
			</section>
			<button
				type="submit"
				disabled={disableMutations || isSubmitting || isUploading}
				className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting
					? mode === "create"
						? "Creating lesson…"
						: "Saving changes…"
					: mode === "create"
					? "Create lesson"
					: "Save lesson"}
			</button>
		</form>
	);
}
