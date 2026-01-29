"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Send } from "lucide-react";

interface CommentFormProps {
  lessonId: string;
  parentId?: string;
  onSubmit: (data: { content: string; parentId?: string }) => Promise<void>;
  placeholder?: string;
  onCancel?: () => void;
}

export function CommentForm({
  lessonId,
  parentId,
  onSubmit,
  placeholder = "Write a comment...",
  onCancel,
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { isValid } } = useForm<{ content: string }>();

  const onSubmitHandler = async (data: { content: string }) => {
    if (!data.content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ content: data.content, parentId });
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-2">
      <div className="flex gap-4">
         <textarea
          {...register("content", { required: true })}
          placeholder={placeholder}
          className="flex-1 min-h-[80px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-zinc-500 hover:text-zinc-900 px-3 py-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Post
        </button>
      </div>
    </form>
  );
}
