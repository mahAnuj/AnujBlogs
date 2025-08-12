import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";
import { Eye, Plus, FileText, Bot, Shield } from "lucide-react";
import type { Tag, PostWithDetails } from "@shared/schema";

export function Sidebar() {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [email, setEmail] = useState("");

  // Removed categories query as we're using static popular tags

  // AI-focused popular tags only
  const popularTags = [
    { id: 1, name: "AI", slug: "ai" },
    { id: 2, name: "Machine Learning", slug: "machine-learning" },
    { id: 3, name: "LLM", slug: "llm" },
    { id: 4, name: "GPT", slug: "gpt" },
    { id: 5, name: "OpenAI", slug: "openai" },
    { id: 6, name: "Anthropic", slug: "anthropic" },
    { id: 7, name: "Google AI", slug: "google-ai" },
    { id: 8, name: "Computer Vision", slug: "computer-vision" },
    { id: 9, name: "Natural Language Processing", slug: "nlp" },
    { id: 10, name: "Deep Learning", slug: "deep-learning" },
    { id: 11, name: "Neural Networks", slug: "neural-networks" },
    { id: 12, name: "Automation", slug: "automation" }
  ];

  // Removed tags query as we're using static popular tags only

  const { data: posts = [] } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts"],
  });

  // Get popular posts (sorted by views)
  const popularPosts = posts
    .filter((post) => post.status === "published")
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // In a real app, this would make an API call
    toast({
      title: "Subscribed!",
      description: "Thanks for subscribing to our newsletter.",
    });
    setEmail("");
  };

  return (
    <aside className="space-y-8">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-secondary dark:text-white">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAdmin ? (
            <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/ai-dashboard" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Access
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild className="w-full">
              <Link href="/create-markdown" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Markdown Post
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/create-post" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Create Post
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Popular Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-secondary dark:text-white">
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const postCount = posts.filter((post) => 
                post.tags?.some(postTag => typeof postTag === 'string' ? postTag === tag.name : false)
              ).length;
              
              return (
                <Link 
                  key={tag.id} 
                  href={`/?tag=${tag.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-primary hover:text-white transition-colors"
                >
                  #{tag.name}
                  <span className="text-xs opacity-70">({postCount})</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Popular Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-secondary dark:text-white">
            Popular This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {popularPosts.map((post) => (
            <article key={post.id} className="group cursor-pointer">
              <Link 
                href={`/post/${post.slug}`}
                className="block"
              >
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors mb-1 line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                  <span className="flex items-center space-x-1">
                    <Eye size={12} />
                    <span>{post.views} views</span>
                  </span>
                  <span>•</span>
                  <span>{post.readTime} min read</span>
                </div>
              </Link>
            </article>
          ))}
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card className="bg-gradient-to-br from-primary to-accent text-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
          <p className="text-blue-100 text-sm mb-4">
            Get the latest tech insights delivered to your inbox weekly.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 border-white/30 focus:ring-white/50 focus:border-transparent"
              required
            />
            <Button
              type="submit"
              className="w-full bg-white text-primary hover:bg-blue-50 transition-colors"
            >
              Subscribe
            </Button>
          </form>
          
          <p className="text-xs text-blue-200 mt-3">
            No spam, unsubscribe anytime.
          </p>
        </CardContent>
      </Card>


    </aside>
  );
}
