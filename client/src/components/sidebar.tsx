import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye } from "lucide-react";
import type { Category, Tag, PostWithDetails } from "@shared/schema";

export function Sidebar() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

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
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-secondary dark:text-white">
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => {
            const postCount = posts.filter((post) => post.categoryId === category.id).length;
            
            return (
              <Link 
                key={category.id} 
                href={`/category/${category.slug}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {postCount}
                </span>
              </Link>
            );
          })}
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

      {/* Tags Cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-secondary dark:text-white">
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 8).map((tag) => (
              <Link key={tag.id} href={`/?tag=${tag.slug}`}>
                <a className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-primary hover:text-white transition-colors">
                  {tag.name}
                </a>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
