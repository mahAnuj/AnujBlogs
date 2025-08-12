import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useAdmin } from "@/hooks/use-admin";
import { SearchBar } from "@/components/search-bar";
import { useState } from "react";
import { Menu, X, Sun, Moon, Code, Plus, Bot, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, logout } = useAdmin();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Header navigation topics - only "All posts" and "AI"
  const headerTopics = [
    { name: "AI", slug: "ai" }
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

          {/* Spacer for layout */}
          <div className="flex-1"></div>

          {/* Search and Controls */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden sm:block">
              <SearchBar />
            </div>

            {/* Admin-only Action Buttons */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="hidden md:flex">
                  <Link href="/ai-dashboard" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Dashboard
                  </Link>
                </Button>
                <Button asChild size="sm" className="hidden md:flex">
                  <Link href="/create-markdown" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Post
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hidden md:flex text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            )}

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



              {/* Mobile Admin Actions */}
              {isAdmin && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4 space-y-2">
                  <Button asChild className="w-full justify-start">
                    <Link href="/ai-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Bot className="h-4 w-4 mr-2" />
                      AI Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/create-markdown" onClick={() => setIsMobileMenuOpen(false)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Post
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
