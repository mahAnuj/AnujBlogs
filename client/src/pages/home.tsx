import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { HeroBanner } from "@/components/hero-banner";
import { BlogPostCard } from "@/components/blog-post-card";
import { Sidebar } from "@/components/sidebar";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { PostWithDetails, Category } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const [sortBy, setSortBy] = useState("recent");
  const [displayCount, setDisplayCount] = useState(6);

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const category = location.startsWith("/category/") ? location.split("/category/")[1] : urlParams.get("category");
  const tag = urlParams.get("tag");
  const search = urlParams.get("search");

  const { data: posts = [], isLoading } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts", category, tag, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tag) params.append('tag', tag);
      if (search) params.append('search', search);
      params.append('status', 'published');
      
      const url = `/api/posts?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      return data;
    }
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.views - a.views;
      case "trending":
        return b.likes - a.likes;
      case "recent":
      default:
        const dateA = a.publishedAt || a.createdAt;
        const dateB = b.publishedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    }
  });

  const displayedPosts = sortedPosts.slice(0, displayCount);
  const hasMore = sortedPosts.length > displayCount;

  const loadMore = () => {
    setDisplayCount(prev => prev + 6);
  };

  // Get current category for display
  const currentCategory = category ? categories.find((cat) => cat.slug === category) : null;

  // SEO title and description
  let pageTitle = "TechStack Blog - Latest Trends in AI, Backend, Frontend & Hosting";
  let pageDescription = "Discover the latest trends in AI/LLM, backend technologies, frontend frameworks, and hosting solutions. Technical blog by Anuj Mahajan featuring in-depth tutorials and insights.";

  if (currentCategory) {
    pageTitle = `${currentCategory.name} - TechStack Blog`;
    pageDescription = `Latest ${currentCategory.name.toLowerCase()} articles and tutorials. ${currentCategory.description}`;
  } else if (search) {
    pageTitle = `Search: ${search} - TechStack Blog`;
    pageDescription = `Search results for "${search}" on TechStack Blog.`;
  } else if (tag) {
    pageTitle = `${tag} Posts - TechStack Blog`;
    pageDescription = `All posts tagged with "${tag}" on TechStack Blog.`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-secondary dark:text-slate-200 transition-colors duration-300">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        url={`${window.location.origin}${location}`}
      />
      
      <Header />
      
      {!category && !search && !tag && <HeroBanner />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-white">
                  {currentCategory ? currentCategory.name : search ? `Search: "${search}"` : tag ? `Tagged: ${tag}` : "Latest Posts"}
                </h3>
                {!isLoading && (
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {posts.length} {posts.length === 1 ? "article" : "articles"}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Sort by:
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && posts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {search ? `No posts match your search for "${search}".` : 
                   category ? `No posts in the ${currentCategory?.name} category yet.` :
                   tag ? `No posts tagged with "${tag}".` :
                   "No posts available at the moment."}
                </p>
              </div>
            )}

            {/* Posts Grid */}
            {!isLoading && posts.length > 0 && (
              <div className="grid gap-8">
                {displayedPosts.map((post, index) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    featured={index === 0 && !category && !search && !tag}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {!isLoading && hasMore && (
              <div className="text-center mt-12">
                <Button
                  onClick={loadMore}
                  className="px-8 py-3 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Load More Posts
                </Button>
              </div>
            )}
          </div>

          <Sidebar />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary dark:bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">💻</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">TechStack Blog</h3>
                  <p className="text-sm text-gray-300">by anujmahajan.dev</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Empowering developers with the latest insights in AI/LLM, backend technologies, frontend frameworks, and modern hosting solutions.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/" className="hover:text-white transition-colors">All Posts</a></li>
                {categories.slice(0, 4).map((cat) => (
                  <li key={cat.id}>
                    <a href={`/category/${cat.slug}`} className="hover:text-white transition-colors">
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="https://anujmahajan.dev" className="hover:text-white transition-colors">
                    Portfolio
                  </a>
                </li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">RSS Feed</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 TechStack Blog. All rights reserved. | Built with ❤️ by{" "}
              <a href="https://anujmahajan.dev" className="text-primary hover:text-accent transition-colors">
                Anuj Mahajan
              </a>
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm text-gray-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
