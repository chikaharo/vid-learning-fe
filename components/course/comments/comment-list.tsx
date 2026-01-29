"use client";

import type { Comment } from "@/types/course";
import { CommentItem } from "./comment-item";

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string;
  onReply: (data: { content: string; parentId?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  lessonId: string;
  instructorId: string;
}

export function CommentList({
  comments,
  currentUserId,
  onReply,
  onDelete,
  lessonId,
  instructorId
}: CommentListProps) {
  if (comments.length === 0) {
    return (
        <div className="text-center py-8 text-zinc-500 text-sm">
            Be the first to comment on this lesson!
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          lessonId={lessonId}
          instructorId={instructorId}
        />
      ))}
    </div>
  );
}
