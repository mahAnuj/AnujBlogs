import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { CommentSection } from "@/components/comment-section";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Clock, User, Calendar, Eye, ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useRef } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import type { PostWithDetails } from "@shared/schema";



export default function Post() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading, error } = useQuery<PostWithDetails>({
    queryKey: [`/api/posts/${slug}`],
    enabled: !!slug,
  });

  const { data: relatedPosts = [] } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts", "category", post?.category.slug],
    queryFn: () => fetch(`/api/posts?category=${post?.category.slug}`).then(res => res.json()),
    enabled: !!post?.category.slug,
  });

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${post?.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${slug}`] });
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

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post?.slug}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Blog link copied",
        description: "The link has been copied to your clipboard.",
      });
    } catch (err) {
      // Fallback: show the URL to user
      toast({
        title: "Blog link",
        description: `Copy this link: ${url}`,
        duration: 10000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Post Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <a>
                <Button>
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Home
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const publishDate = post.publishedAt || post.createdAt;
  const timeAgo = formatDistanceToNow(new Date(publishDate), { addSuffix: true });
  const formattedDate = format(new Date(publishDate), "MMMM dd, yyyy");

  // Filter related posts (same category, exclude current post)
  const filteredRelatedPosts = relatedPosts
    .filter((p) => p.id !== post.id && p.status === "published")
    .slice(0, 3);

  // Remove the first h1 heading from content to avoid duplication with the title
  const processedContent = post.content.replace(/^#\s+.*\n/, '').trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-secondary dark:text-slate-200 transition-colors duration-300">
      <SEOHead
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        type="article"
        publishedTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}
        modifiedTime={new Date(post.updatedAt).toISOString()}
        author={post.author.name}
        tags={post.tags || undefined}
        url={`${window.location.origin}/post/${post.slug}`}
      />
      
      <Header />
      
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
              <ArrowLeft className="mr-2" size={16} />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <Badge
              variant="secondary"
              style={{ backgroundColor: post.category.color, color: "white" }}
            >
              {post.category.name}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {timeAgo}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {post.excerpt}
          </p>
          
          {/* Author and Meta Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="text-white" size={20} />
                )}
              </div>
              <div>
                <p className="font-semibold text-secondary dark:text-white">
                  {post.author.name}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{post.readTime} min read</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Eye size={14} />
                    <span>{post.views} views</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className="flex items-center space-x-2"
              >
                <Heart size={16} className={likeMutation.isPending ? "animate-pulse" : ""} />
                <span>{post.likes}</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 size={16} />
                <span>Share</span>
              </Button>
            </div>
          </div>
          
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mt-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 lg:h-96 object-cover rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }: any) {
                const inline = props.inline;
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : '';
                
                // Mermaid diagrams removed - using practical code samples instead
                
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={tomorrow as any}
                    language={language}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-900 dark:text-white">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-900 dark:text-white">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">{children}</ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600 dark:text-gray-400">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Link key={tag} href={`/?tag=${tag}`}>
                  <Badge variant="outline" className="hover:bg-primary hover:text-white transition-colors cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Posts */}
        {filteredRelatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold mb-6">Related Posts</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {filteredRelatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/post/${relatedPost.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-secondary dark:text-white mb-2 hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} />
                        <span>{relatedPost.readTime} min read</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Separator className="my-12" />
      
      <CommentSection postId={post.id} />
    </div>
  );
}
