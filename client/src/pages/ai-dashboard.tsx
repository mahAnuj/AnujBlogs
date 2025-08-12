import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Eye, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Bot,
  Newspaper,
  BarChart3,
  Home,
  ArrowLeft,
  FileText,
  Edit,
  Trash2,
  Shield
} from "lucide-react";
import { Link } from "wouter";

interface GenerationJob {
  id: string;
  status: 'pending' | 'fetching' | 'analyzing' | 'generating' | 'reviewing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  config: {
    hoursBack: number;
    minRelevanceScore: number;
    maxArticles: number;
    focusTopic?: string;
  };
  results?: {
    articlesFound: number;
    articlesAnalyzed: number;
    blogPostGenerated: boolean;
    postId?: string;
    postIds?: string[];
    reviewResults?: Array<{postId: string; approved: boolean; qualityScore: number}>;
  };
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  relevanceScore: number;
  tags: string[];
  url: string;
}

interface AIStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageArticlesPerJob: number;
  averageGenerationTime: number;
}

export default function AIDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAdmin } = useAdmin();
  const [generationConfig, setGenerationConfig] = useState({
    hoursBack: 24,
    minRelevanceScore: 0.7,
    maxArticles: 5,
    focusTopic: ""
  });

  const [customBlogTopic, setCustomBlogTopic] = useState("");

  // Redirect non-admin users to login
  if (!isAdmin) {
    setLocation('/admin');
    return null;
  }

  // Queries
  const { data: jobs = [], refetch: refetchJobs } = useQuery<GenerationJob[]>({
    queryKey: ["/api/ai/jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  const { data: stats } = useQuery<AIStats>({
    queryKey: ["/api/ai/stats"],
    refetchInterval: 10000, // Update stats every 10 seconds
  });

  const { data: newsPreview = [], refetch: refetchNews, isLoading: isLoadingNews } = useQuery<NewsArticle[]>({
    queryKey: ["/api/ai/news"],
    queryFn: () => fetch(`/api/ai/news?hours=${generationConfig.hoursBack}`).then(res => res.json()),
    enabled: false, // Only fetch when manually triggered
  });

  // Query for draft posts that need review
  const { data: draftPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/posts/drafts"],
    refetchInterval: 5000, // Check for new drafts every 5 seconds
  });

  // Query for published posts
  const { data: publishedPosts = [], refetch: refetchPosts } = useQuery<any[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 10000, // Check for posts every 10 seconds
  });

  // Mutations
  const startGenerationMutation = useMutation({
    mutationFn: async (config: typeof generationConfig) => {
      const response = await apiRequest("POST", "/api/ai/generate", config);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Generation Started",
        description: `AI content generation job ${data.jobId} has been started.`,
      });
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed", 
        description: error.message || "Failed to start AI generation",
        variant: "destructive",
      });
    },
  });

  const generateCustomBlogMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest("POST", "/api/ai/generate-custom", { topic });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Blog Generation Started",
        description: `Started generating blog post about "${customBlogTopic}".`,
      });
      setCustomBlogTopic("");
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed", 
        description: error.message || "Failed to start blog generation",
        variant: "destructive",
      });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest("DELETE", `/api/ai/jobs/${jobId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Cancelled",
        description: "The generation job has been cancelled.",
      });
      refetchJobs();
    },
    onError: (error: any) => {
      toast({
        title: "Cancel Failed",
        description: error.message || "Failed to cancel job",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("DELETE", `/api/posts/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted.",
      });
      refetchPosts();
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleStartGeneration = () => {
    startGenerationMutation.mutate(generationConfig);
  };

  const handleCancelJob = (jobId: string) => {
    cancelJobMutation.mutate(jobId);
  };

  const handlePreviewNews = () => {
    refetchNews();
  };

  const handleGenerateCustomBlog = () => {
    if (!customBlogTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for the blog post.",
        variant: "destructive",
      });
      return;
    }
    generateCustomBlogMutation.mutate(customBlogTopic.trim());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
  };

  const runningJobs = jobs.filter(job => !['completed', 'failed'].includes(job.status));
  const latestJobs = jobs.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              AI Content Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Manage automated AI news aggregation and blog post generation
          </p>
        </div>
        <Button 
          onClick={handleStartGeneration} 
          disabled={startGenerationMutation.isPending || runningJobs.length > 0}
          size="lg"
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Generate Content
        </Button>
      </div>

      <Tabs defaultValue="control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="control">Control Panel</TabsTrigger>
          <TabsTrigger value="posts">Published Posts</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="news">News Preview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Published Posts Management */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Published Posts ({publishedPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {publishedPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No published posts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedPosts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{post.excerpt}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
                            <span>{post.readTime} min read</span>
                            <span>{post.views} views</span>
                            <span>{post.likes} likes</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/post/${post.slug}`} className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/create-markdown?edit=${post.id}`} className="flex items-center gap-1">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this post?')) {
                                deletePostMutation.mutate(post.id);
                              }
                            }}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Control Panel */}
        <TabsContent value="control" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Generation Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hoursBack">Hours Back to Fetch</Label>
                  <Input
                    id="hoursBack"
                    type="number"
                    value={generationConfig.hoursBack}
                    onChange={(e) => setGenerationConfig(prev => ({
                      ...prev, 
                      hoursBack: parseInt(e.target.value) || 24
                    }))}
                    min="1"
                    max="168"
                  />
                </div>
                <div>
                  <Label htmlFor="maxArticles">Max Articles to Process</Label>
                  <Input
                    id="maxArticles"
                    type="number"
                    value={generationConfig.maxArticles}
                    onChange={(e) => setGenerationConfig(prev => ({
                      ...prev,
                      maxArticles: parseInt(e.target.value) || 5
                    }))}
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="minRelevance">Min Relevance Score</Label>
                  <Input
                    id="minRelevance"
                    type="number"
                    step="0.1"
                    value={generationConfig.minRelevanceScore}
                    onChange={(e) => setGenerationConfig(prev => ({
                      ...prev,
                      minRelevanceScore: parseFloat(e.target.value) || 0.7
                    }))}
                    min="0"
                    max="1"
                  />
                </div>
                <div>
                  <Label htmlFor="focusTopic">Focus Topic (Optional)</Label>
                  <Input
                    id="focusTopic"
                    placeholder="e.g., Machine Learning, GPT, Computer Vision"
                    value={generationConfig.focusTopic}
                    onChange={(e) => setGenerationConfig(prev => ({
                      ...prev,
                      focusTopic: e.target.value
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Blog Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Blog on Custom Topic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="customTopic">Blog Topic</Label>
                  <Input
                    id="customTopic"
                    placeholder="e.g., The Future of AI in Healthcare, How to Build React Apps, etc."
                    value={customBlogTopic}
                    onChange={(e) => setCustomBlogTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateCustomBlog();
                      }
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleGenerateCustomBlog}
                    disabled={generateCustomBlogMutation.isPending || !customBlogTopic.trim() || runningJobs.length > 0}
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    Generate Blog
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI will research and generate a comprehensive blog post on the provided topic.
              </p>
            </CardContent>
          </Card>

          {/* Running Jobs */}
          {runningJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Active Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {runningJobs.map((job) => (
                  <div key={job.id} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium capitalize">{job.status}</span>
                        <Badge variant="outline">
                          {job.config.focusTopic || "General AI"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {job.progress}% complete - Started {new Date(job.startedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Jobs History */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestJobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No generation jobs yet. Start your first generation above!
                  </p>
                ) : (
                  latestJobs.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <div className="font-medium">
                              {job.config.focusTopic || "General AI News"}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(job.startedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      {job.results && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Articles Found:</span>
                            <span className="ml-2 font-medium">{job.results.articlesFound}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Analyzed:</span>
                            <span className="ml-2 font-medium">{job.results.articlesAnalyzed}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Post Created:</span>
                            <span className="ml-2 font-medium">
                              {job.results.blogPostGenerated ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {job.error && (
                        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {job.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Draft Posts for Review */}
        <TabsContent value="drafts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Draft Posts Awaiting Review ({draftPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {draftPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No draft posts waiting for review.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      AI-generated posts will appear here for manual review before publishing.
                    </p>
                  </div>
                ) : (
                  draftPosts.map((post: any) => (
                    <div key={post.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg line-clamp-2">{post.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span>Created: {new Date(post.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>Read time: {post.readTime} min</span>
                            {post.metadata?.aiGenerated && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">
                                  AI Generated
                                </Badge>
                              </>
                            )}
                            {post.metadata?.reviewResult && (
                              <>
                                <span>•</span>
                                <Badge 
                                  variant={post.metadata.reviewResult.approved ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  Quality: {post.metadata.reviewResult.qualityScore}/100
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link href={`/post/${post.slug}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </Link>
                          <Link href={`/create-post?edit=${post.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                await apiRequest("PUT", `/api/posts/${post.id}`, { status: "published" });
                                queryClient.invalidateQueries({ queryKey: ["/api/posts/drafts"] });
                                toast({
                                  title: "Post Published",
                                  description: `"${post.title}" has been published.`,
                                });
                              } catch (error) {
                                toast({
                                  title: "Publish Failed",
                                  description: "Failed to publish the post.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this draft?")) {
                                try {
                                  await apiRequest("DELETE", `/api/posts/${post.id}`);
                                  queryClient.invalidateQueries({ queryKey: ["/api/posts/drafts"] });
                                  toast({
                                    title: "Draft Deleted",
                                    description: "The draft post has been deleted.",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Delete Failed",
                                    description: "Failed to delete the draft.",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Show review issues if any */}
                      {post.metadata?.reviewResult?.issues > 0 && (
                        <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">Review Issues Found:</span>
                            <span>{post.metadata.reviewResult.issues} total</span>
                            {post.metadata.reviewResult.criticalIssues > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {post.metadata.reviewResult.criticalIssues} critical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Please review and edit before publishing.
                          </p>
                        </div>
                      )}

                      {/* Show sources if available */}
                      {post.metadata?.sources && post.metadata.sources.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Sources:</span>
                          <div className="mt-1 space-y-1">
                            {post.metadata.sources.slice(0, 2).map((source: any, index: number) => (
                              <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {source.title} - {source.publication}
                                </a>
                              </div>
                            ))}
                            {post.metadata.sources.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{post.metadata.sources.length - 2} more sources
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Preview */}
        <TabsContent value="news" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Latest AI News Preview
                </div>
                <Button 
                  variant="outline" 
                  onClick={handlePreviewNews}
                  disabled={isLoadingNews}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNews ? 'animate-spin' : ''}`} />
                  {isLoadingNews ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingNews ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Fetching latest AI news articles...</p>
                  </div>
                ) : newsPreview.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Click "Refresh" to preview latest AI news articles</p>
                    <p className="text-sm text-gray-400 mt-1">
                      These articles will be analyzed and used for blog post generation
                    </p>
                  </div>
                ) : (
                  newsPreview.map((article) => (
                    <div key={article.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-lg line-clamp-2">{article.title}</h4>
                        <Badge variant="outline" className="ml-2">
                          {Math.round(article.relevanceScore * 100)}% relevant
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Original
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalJobs}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalJobs > 0 
                      ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Articles</CardTitle>
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(stats.averageArticlesPerJob)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(stats.averageGenerationTime)}s
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}