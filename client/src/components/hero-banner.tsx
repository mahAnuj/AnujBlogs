import { useQuery } from "@tanstack/react-query";
import { FileText, Users, Clock } from "lucide-react";
import type { PostWithDetails } from "@shared/schema";

export function HeroBanner() {
  const { data: posts = [] } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts"],
  });

  const totalPosts = posts.length;
  const totalReaders = "12.5K"; // This would come from analytics in a real app

  return (
    <section className="bg-gradient-to-br from-primary to-accent text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Master the Future of{" "}
              <span className="text-cyan-200">Artificial Intelligence</span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Explore breakthrough AI developments, machine learning innovations, and strategic industry insights. Expert analysis from the frontlines of AI evolution.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="text-cyan-200" size={20} />
                <span>{totalPosts} Posts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="text-cyan-200" size={20} />
                <span>{totalReaders} Readers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="text-cyan-200" size={20} />
                <span>Updated Daily</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-cyan-200/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-cyan-200" size={48} />
              </div>
              <p className="text-blue-100">Featured content and latest insights</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
