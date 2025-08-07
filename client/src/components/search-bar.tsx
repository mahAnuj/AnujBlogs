import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import type { PostWithDetails } from "@shared/schema";

export function SearchBar() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.trim()) {
      setLocation(`/?search=${encodeURIComponent(value.trim())}`);
    }
  }, 300);

  const { data: searchResults = [] } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/search", { q: searchTerm }],
    enabled: searchTerm.length > 2,
  });

  useEffect(() => {
    if (searchTerm.length > 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowResults(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={handleInputChange}
            className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-secondary dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchResults.slice(0, 5).map((post) => (
            <a
              key={post.id}
              href={`/post/${post.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-600 last:border-b-0"
              onClick={() => setShowResults(false)}
            >
              <h4 className="font-medium text-secondary dark:text-white text-sm line-clamp-1">
                {post.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span 
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${post.category.color}20`,
                    color: post.category.color 
                  }}
                >
                  {post.category.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {post.readTime} min read
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
