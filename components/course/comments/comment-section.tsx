"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { 
    createComment, 
    deleteComment, 
    fetchCommentsForLesson 
} from "@/lib/comment-service";
import type { Comment } from "@/types/course";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface CommentSectionProps {
    lessonId: string;
    currentUser?: { id: string } | null;
    instructorId: string;
}

export function CommentSection({ lessonId, currentUser, instructorId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadComments = async () => {
        try {
            const data = await fetchCommentsForLesson(lessonId);
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [lessonId]);

    const handleCreateComment = async (data: { content: string; parentId?: string }) => {
        if (!currentUser) {
            toast({
                title: "Authentication required",
                description: "You must be logged in to post comments.",
                variant: "destructive",
            });
            return;
        }

        try {
            await createComment({
                lessonId,
                content: data.content,
                parentId: data.parentId
            });
            await loadComments(); // Reload to get fresh data with IDs etc.
            toast({
                title: "Comment posted",
                description: "Your comment has been added successfully.",
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to post comment. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteComment = async (id: string) => {
        try {
            await deleteComment(id);
             setComments(prev => {
                // Remove from top level
                const filtered = prev.filter(c => c.id !== id);
                // Also remove if it's a reply in nested structure
                return filtered.map(c => ({
                    ...c,
                    replies: c.replies?.filter(r => r.id !== id)
                }));
            });
            toast({
                title: "Comment deleted",
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to delete comment.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="mt-8 border-t border-zinc-100 pt-8">
            <h3 className="text-xl font-semibold text-zinc-900 mb-6">
                Discussion ({comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)})
            </h3>
            
            <div className="mb-8">
                <CommentForm 
                    lessonId={lessonId} 
                    onSubmit={handleCreateComment}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
            ) : (
                <CommentList 
                    comments={comments} 
                    currentUserId={currentUser?.id}
                    onReply={handleCreateComment}
                    onDelete={handleDeleteComment}
                    lessonId={lessonId}
                    instructorId={instructorId}
                />
            )}
        </div>
    );
}
