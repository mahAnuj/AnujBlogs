import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, User, Reply } from "lucide-react";
import { z } from "zod";
import type { CommentWithReplies } from "@shared/schema";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  authorName: z.string().min(1, "Name is required"),
  authorEmail: z.string().email("Valid email is required"),
});

interface CommentSectionProps {
  postId: string;
}

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

function CommentForm({ postId, parentId, onSuccess, placeholder = "Share your thoughts on this topic..." }: CommentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    content: "",
    authorName: "",
    authorEmail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const commentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/posts/${postId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      setFormData({ content: "", authorName: "", authorEmail: "" });
      setErrors({});
      toast({
        title: "Comment posted!",
        description: "Your comment has been posted successfully.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = commentSchema.parse(formData);
      commentMutation.mutate({
        ...validatedData,
        parentId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Card className="bg-gray-50 dark:bg-slate-700">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Textarea
                  placeholder={placeholder}
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full resize-none"
                />
                {errors.content && (
                  <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authorName">Name</Label>
                  <Input
                    id="authorName"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Your name"
                  />
                  {errors.authorName && (
                    <p className="text-sm text-red-500 mt-1">{errors.authorName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="authorEmail">Email</Label>
                  <Input
                    id="authorEmail"
                    type="email"
                    value={formData.authorEmail}
                    onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                    placeholder="your@email.com"
                  />
                  {errors.authorEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.authorEmail}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={commentMutation.isPending}
                  className="px-6"
                >
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CommentItem({ comment, postId, level = 0 }: { comment: CommentWithReplies; postId: string; level?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReplyForm, setShowReplyForm] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/comments/${comment.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      toast({
        title: "Comment liked!",
        description: "Thanks for your engagement.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  return (
    <div className={`${level > 0 ? "ml-6 pl-4 border-l-2 border-gray-200 dark:border-slate-600" : ""}`}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          {comment.authorAvatar ? (
            <img
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-bold">
              {getInitials(comment.authorName)}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-medium text-secondary dark:text-white">
              {comment.authorName}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {timeAgo}
            </span>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
            {comment.content}
          </p>
          
          <div className="flex items-center space-x-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors flex items-center space-x-1"
            >
              <Heart size={16} />
              <span>{comment.likes}</span>
            </Button>
            
            {level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors flex items-center space-x-1"
              >
                <Reply size={16} />
                <span>Reply</span>
              </Button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                placeholder={`Reply to ${comment.authorName}...`}
                onSuccess={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply: any) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: comments = [], isLoading } = useQuery<CommentWithReplies[]>({
    queryKey: ["/api/posts", postId, "comments"],
  });

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="comments" className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3 mb-8">
          <MessageCircle className="text-primary" size={24} />
          <h3 className="text-2xl font-bold text-secondary dark:text-white">
            Join the Discussion
          </h3>
          {comments.length > 0 && (
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          )}
        </div>

        {/* Comment Form */}
        <div className="mb-8">
          <CommentForm postId={postId} />
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No comments yet
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to share your thoughts on this post!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
