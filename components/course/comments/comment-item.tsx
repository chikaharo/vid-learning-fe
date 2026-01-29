"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Trash2 } from "lucide-react";

import type { Comment } from "@/types/course";
import { CommentForm } from "./comment-form";

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (data: { content: string; parentId?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  lessonId: string;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  lessonId,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);

  const handleReplySubmit = async (data: { content: string; parentId?: string }) => {
    await onReply(data);
    setIsReplying(false);
  };

  const isOwner = currentUserId === comment.userId;

  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-200">
          <Image
            src={comment.user?.avatarUrl || "/images/avatars/default.png"}
            alt={comment.user?.name || "User"}
            fill
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="rounded-lg bg-zinc-50 p-4">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900">
                    {comment.user?.fullName || comment.user?.name || "Anonymous"}
                </span>
                <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
             </div>
             {isOwner && (
                 <button 
                    onClick={() => onDelete(comment.id)}
                    className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete comment"
                 >
                     <Trash2 className="h-4 w-4" />
                 </button>
             )}
          </div>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{comment.content}</p>
        </div>

        {!comment.parentId && (
             <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
                >
                    <MessageCircle className="h-3 w-3" />
                    Reply
                </button>
             </div>
        )}

        {isReplying && (
             <div className="mt-4 ml-2 pl-4 border-l-2 border-zinc-200">
                <CommentForm
                    lessonId={lessonId}
                    parentId={comment.id}
                    onSubmit={handleReplySubmit}
                    onCancel={() => setIsReplying(false)}
                    placeholder={`Reply to ${comment.user?.name || "user"}...`}
                />
             </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-zinc-100">
                {comment.replies.map((reply) => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        onReply={onReply}
                        onDelete={onDelete}
                        lessonId={lessonId}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
