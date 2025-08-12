import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  BarChart3
} from "lucide-react";

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
  const [generationConfig, setGenerationConfig] = useState({
    hoursBack: 24,
    minRelevanceScore: 0.7,
    maxArticles: 5,
    focusTopic: ""
  });

  // Queries
  const { data: jobs = [], refetch: refetchJobs } = useQuery<GenerationJob[]>({
    queryKey: ["/api/ai/jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  const { data: stats } = useQuery<AIStats>({
    queryKey: ["/api/ai/stats"],
    refetchInterval: 10000, // Update stats every 10 seconds
  });

  const { data: newsPreview = [], refetch: refetchNews } = useQuery<NewsArticle[]>({
    queryKey: ["/api/ai/news", generationConfig.hoursBack],
    enabled: false, // Only fetch when manually triggered
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

  const handleStartGeneration = () => {
    startGenerationMutation.mutate(generationConfig);
  };

  const handleCancelJob = (jobId: string) => {
    cancelJobMutation.mutate(jobId);
  };

  const handlePreviewNews = () => {
    refetchNews();
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            AI Content Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="control">Control Panel</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="news">News Preview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

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

        {/* News Preview */}
        <TabsContent value="news" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Latest AI News Preview
                </div>
                <Button variant="outline" onClick={handlePreviewNews}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsPreview.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Click "Refresh" to preview latest AI news articles</p>
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