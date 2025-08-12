import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, Clock, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage?: string | null;
    readTime: number;
    views: number;
    likes: number;
    commentsCount: number;
    publishedAt?: string | null;
    createdAt: string;
    author: {
      name: string;
      avatar?: string;
    };
    category: {
      name: string;
      color: string;
    };
  };
  featured?: boolean;
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${post.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post liked!",
        description: "Thanks for your engagement.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    likeMutation.mutate();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/post/${post.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard.",
      });
    }
  };

  const publishDate = post.publishedAt || post.createdAt;
  const timeAgo = formatDistanceToNow(new Date(publishDate), { addSuffix: true });

  if (featured) {
    return (
      <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="md:flex">
          {post.featuredImage && (
            <div className="md:w-1/3">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-48 md:h-full object-cover"
              />
            </div>
          )}
          <div className={`${post.featuredImage ? "md:w-2/3" : "w-full"} p-6`}>
            <div className="flex items-center space-x-3 mb-3">
              <span
                className="px-3 py-1 text-sm font-medium rounded-full text-white"
                style={{ backgroundColor: post.category?.color || '#3b82f6' }}
              >
                {post.category?.name || 'AI Generated'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="mr-1" size={14} />
                {post.readTime} min read
              </span>
            </div>
            
            <Link 
              href={`/post/${post.slug}`}
              className="block"
            >
              <h2 className="text-xl font-bold text-secondary dark:text-white mb-3 hover:text-primary transition-colors">
                {post.title}
              </h2>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-white" size={16} />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {post.author.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className="flex items-center space-x-1 hover:text-red-500"
                >
                  <Heart size={16} />
                  <span>{post.likes}</span>
                </Button>
                
                <Link 
                  href={`/post/${post.slug}#comments`}
                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>{post.commentsCount}</span>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-1 hover:text-primary"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 dark:border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-3">
          <span
            className="px-3 py-1 text-sm font-medium rounded-full text-white"
            style={{ backgroundColor: post.category?.color || '#3b82f6' }}
          >
            {post.category?.name || 'AI Generated'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {timeAgo}
          </span>
          <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="mr-1" size={14} />
            {post.readTime} min read
          </span>
        </div>
        
        <Link 
          href={`/post/${post.slug}`}
          className="block"
        >
          <h2 className="text-xl font-bold text-secondary dark:text-white mb-3 hover:text-primary transition-colors">
            {post.title}
          </h2>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="text-white" size={16} />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {post.author.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className="flex items-center space-x-1 hover:text-red-500"
            >
              <Heart size={16} />
              <span>{post.likes}</span>
            </Button>
            
            <Link 
              href={`/post/${post.slug}#comments`}
              className="flex items-center space-x-1 hover:text-primary transition-colors"
            >
              <MessageCircle size={16} />
              <span>{post.commentsCount}</span>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-1 hover:text-primary"
            >
              <Share2 size={16} />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
