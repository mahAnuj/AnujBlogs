import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye } from "lucide-react";
import type { Tag, PostWithDetails } from "@shared/schema";

export function Sidebar() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  // Removed categories query as we're using static popular tags

  // Popular tags with AI guaranteed, plus famous frontend/backend tags and trending topics
  const popularTags = [
    { id: 1, name: "AI", slug: "ai" },
    { id: 2, name: "React", slug: "react" }, // Famous frontend tag
    { id: 3, name: "Node.js", slug: "nodejs" }, // Famous backend tag
    { id: 4, name: "Trending", slug: "trending" },
    { id: 5, name: "Machine Learning", slug: "machine-learning" },
    { id: 6, name: "TypeScript", slug: "typescript" },
    { id: 7, name: "Python", slug: "python" },
    { id: 8, name: "LLM", slug: "llm" },
    { id: 9, name: "DevOps", slug: "devops" },
    { id: 10, name: "JavaScript", slug: "javascript" },
    { id: 11, name: "Cloud", slug: "cloud" },
    { id: 12, name: "API", slug: "api" }
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
                post.tags?.some(postTag => typeof postTag === 'string' ? postTag === tag.name : postTag.id === tag.id)
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
