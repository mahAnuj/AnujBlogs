import { newsAgent } from "./newsAgent";
import { contentAgent } from "./contentAgent";
import { storage } from "../storage";
import type { NewsArticle } from "./newsAgent";
import type { BlogPostGeneration } from "./contentAgent";

export interface GenerationJob {
  id: string;
  status: 'pending' | 'fetching' | 'analyzing' | 'generating' | 'reviewing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
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
  articles?: NewsArticle[];
  generation?: BlogPostGeneration;
}

export class AIOrchestrator {
  private jobs = new Map<string, GenerationJob>();

  /**
   * Start a new AI content generation job
   */
  async startGeneration(config: GenerationJob['config']): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      config,
    };

    this.jobs.set(jobId, job);

    // Start the generation process asynchronously
    this.runGeneration(jobId).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.completedAt = new Date();
        this.jobs.set(jobId, failedJob);
      }
    });

    return jobId;
  }

  /**
   * Get status of a generation job
   */
  getJobStatus(jobId: string): GenerationJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs (for admin dashboard)
   */
  getAllJobs(): GenerationJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.startedAt.getTime() - a.startedAt.getTime()
    );
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status !== 'completed' && job.status !== 'failed') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = new Date();
      this.jobs.set(jobId, job);
      return true;
    }
    return false;
  }

  /**
   * Run the complete AI generation pipeline
   */
  private async runGeneration(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    try {
      // Step 1: Fetch news articles
      this.updateJobStatus(jobId, 'fetching', 10);
      console.log(`[${jobId}] Fetching news articles...`);
      
      const rawArticles = await newsAgent.fetchLatestNews(job.config.hoursBack);
      console.log(`[${jobId}] Found ${rawArticles.length} articles`);

      // Step 2: Analyze and filter articles
      this.updateJobStatus(jobId, 'analyzing', 30);
      console.log(`[${jobId}] Analyzing articles for relevance...`);
      
      const analyzedArticles = [];
      for (let i = 0; i < rawArticles.length; i++) {
        const article = await newsAgent.analyzeArticle(rawArticles[i]);
        if (article.relevanceScore >= job.config.minRelevanceScore) {
          analyzedArticles.push(article);
        }
        
        // Update progress
        const progress = 30 + (i / rawArticles.length) * 20;
        this.updateJobStatus(jobId, 'analyzing', progress);
      }

      // Take top articles
      const selectedArticles = analyzedArticles
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, job.config.maxArticles);

      console.log(`[${jobId}] Selected ${selectedArticles.length} high-relevance articles`);

      if (selectedArticles.length === 0) {
        throw new Error('No relevant articles found with current criteria');
      }

      // Step 3: Generate blog post
      this.updateJobStatus(jobId, 'generating', 60);
      console.log(`[${jobId}] Generating blog post...`);
      
      const generation = await contentAgent.generateBlogPost(
        selectedArticles, 
        job.config.focusTopic
      );

      // Step 4: Create draft post in database
      this.updateJobStatus(jobId, 'reviewing', 90);
      console.log(`[${jobId}] Creating draft post...`);
      
      const postData = contentAgent.convertToPostData(generation);
      // Ensure required fields are present
      const validPostData = {
        title: postData.title || "AI Generated Post",
        slug: postData.slug || "ai-generated-post",
        excerpt: postData.excerpt || "AI generated content",
        content: postData.content || "Generated content",
        authorId: postData.authorId || "ai-agent",
        categoryId: postData.categoryId || "cat-1",
        readTime: postData.readTime || 5,
        ...postData
      };
      const createdPost = await storage.createPost(validPostData);

      // Step 5: Complete job
      this.updateJobStatus(jobId, 'completed', 100);
      console.log(`[${jobId}] Generation completed successfully!`);

      const updatedJob = this.jobs.get(jobId)!;
      updatedJob.articles = selectedArticles;
      updatedJob.generation = generation;
      updatedJob.results = {
        articlesFound: rawArticles.length,
        articlesAnalyzed: analyzedArticles.length,
        blogPostGenerated: true,
        postId: createdPost.id,
      };
      updatedJob.completedAt = new Date();
      this.jobs.set(jobId, updatedJob);

    } catch (error) {
      console.error(`[${jobId}] Generation failed:`, error);
      throw error;
    }
  }

  /**
   * Update job status and progress
   */
  private updateJobStatus(jobId: string, status: GenerationJob['status'], progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.progress = progress;
      this.jobs.set(jobId, job);
    }
  }

  /**
   * Get generation statistics
   */
  getStats(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageArticlesPerJob: number;
    averageGenerationTime: number;
  } {
    const allJobs = this.getAllJobs();
    const completedJobs = allJobs.filter(j => j.status === 'completed');
    const failedJobs = allJobs.filter(j => j.status === 'failed');

    const averageArticlesPerJob = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + (job.results?.articlesFound || 0), 0) / completedJobs.length
      : 0;

    const averageGenerationTime = completedJobs.length > 0
      ? completedJobs
          .filter(job => job.completedAt)
          .reduce((sum, job) => {
            return sum + (job.completedAt!.getTime() - job.startedAt.getTime());
          }, 0) / completedJobs.length / 1000 // Convert to seconds
      : 0;

    return {
      totalJobs: allJobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageArticlesPerJob,
      averageGenerationTime,
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();