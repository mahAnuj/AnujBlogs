import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { SearchBar } from "@/components/search-bar";
// Removed useQuery import as we're using static topics now
import { useState } from "react";
import { Menu, X, Sun, Moon, Code, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
// Removed Tag import as we're using static topics now

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Popular AI/LLM topics for navigation
  const popularTopics = [
    { name: "AI", slug: "ai" },
    { name: "LLM", slug: "llm" },
    { name: "Machine Learning", slug: "machine-learning" },
    { name: "Backend", slug: "backend" }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const isActiveTag = (tagSlug: string) => {
    return location.includes(`tag=${tagSlug}`);
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Code className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary dark:text-white">Anuj's Blog</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={cn(
              "font-medium transition-colors",
              isActive("/") 
                ? "text-primary border-b-2 border-primary pb-1" 
                : "text-gray-600 dark:text-gray-300 hover:text-primary"
            )}>
              All Posts
            </Link>
            
            {popularTopics.map((topic) => (
              <Link 
                key={topic.slug} 
                href={`/?tag=${topic.slug}`}
                className={cn(
                  "font-medium transition-colors px-3 py-1 rounded-full text-sm",
                  isActiveTag(topic.slug)
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white"
                )}
              >
                {topic.name}
              </Link>
            ))}
          </nav>

          {/* Search and Controls */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden sm:block">
              <SearchBar />
            </div>

            {/* New Post Button */}
            <Button asChild size="sm" className="hidden md:flex">
              <Link href="/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Link>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Search */}
              <div className="sm:hidden">
                <SearchBar />
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/"
                  className={cn(
                    "block px-3 py-2 rounded-md font-medium transition-colors",
                    isActive("/") 
                      ? "text-primary bg-primary bg-opacity-10" 
                      : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  All Posts
                </Link>
                
                {popularTopics.map((topic) => (
                  <Link 
                    key={topic.slug} 
                    href={`/?tag=${topic.slug}`}
                    className={cn(
                      "block px-3 py-2 rounded-md font-medium transition-colors",
                      isActiveTag(topic.slug)
                        ? "text-primary bg-primary bg-opacity-10"
                        : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-700"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {topic.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
