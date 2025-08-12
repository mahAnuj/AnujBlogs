import { randomUUID } from 'crypto';
import type { NewsAgent, NewsArticle } from './newsAgent';
import type { ContentAgent, GeneratedContent } from './contentAgent';
import type { ReviewAgent, ReviewResult } from './reviewAgent';
import type { EnhanceAgent, EnhancementResult } from './enhanceAgent';
import { LatestKnowledgeAgent } from './latestKnowledgeAgent';
import type { IStorage } from '../storage';

export interface GenerationConfig {
  hoursBack: number;
  minRelevanceScore: number;
  maxArticles: number;
  focusTopic?: string;
}

export interface CustomGenerationConfig {
  topic: string;
  userPrompt?: string | null;
  type: 'custom';
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'fetching' | 'analyzing' | 'generating' | 'reviewing' | 'enhancing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  config: GenerationConfig;
  results?: {
    articlesFound: number;
    articlesAnalyzed: number;
    blogPostGenerated: boolean;
    postId?: string;
    postIds?: string[];
    reviewResults?: Array<{postId: string; approved: boolean; qualityScore: number}>;
  };
}

export interface AIStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageArticlesPerJob: number;
  averageGenerationTime: number;
}

class AIOrchestrator {
  private jobs: Map<string, GenerationJob> = new Map();
  private newsAgent: NewsAgent;
  private contentAgent: ContentAgent;
  private reviewAgent: ReviewAgent;
  private enhanceAgent: EnhanceAgent;
  private knowledgeAgent: LatestKnowledgeAgent;
  private storage: IStorage;

  constructor(newsAgent: NewsAgent, contentAgent: ContentAgent, reviewAgent: ReviewAgent, enhanceAgent: EnhanceAgent, knowledgeAgent: LatestKnowledgeAgent, storage: IStorage) {
    this.newsAgent = newsAgent;
    this.contentAgent = contentAgent;
    this.reviewAgent = reviewAgent;
    this.enhanceAgent = enhanceAgent;
    this.knowledgeAgent = knowledgeAgent;
    this.storage = storage;
  }

  async startGeneration(config: GenerationConfig): Promise<string> {
    const jobId = randomUUID();
    
    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      config
    };

    this.jobs.set(jobId, job);
    
    // Start the generation process asynchronously
    this.processGeneration(jobId).catch(error => {
      console.error(`Generation job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        progress: 0
      });
    });

    return jobId;
  }

  async startCustomGeneration(config: CustomGenerationConfig): Promise<string> {
    const jobId = randomUUID();
    
    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      config: {
        hoursBack: 0, // Not used for custom generation
        minRelevanceScore: 0, // Not used for custom generation
        maxArticles: 1, // Generate one post
        focusTopic: config.topic
      }
    };

    this.jobs.set(jobId, job);
    
    // Start the custom generation process asynchronously
    this.processCustomGeneration(jobId, config.topic, config.userPrompt).catch(error => {
      console.error(`Custom generation job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        progress: 0
      });
    });

    return jobId;
  }

  private async processCustomGeneration(jobId: string, topic: string, userPrompt?: string | null): Promise<void> {
    console.log(`🔍 Starting custom generation job ${jobId} for topic: ${topic}`);

    try {
      // Step 1: Gather latest knowledge using LatestKnowledgeAgent
      this.updateJob(jobId, { status: 'fetching', progress: 15 });
      console.log(`🧠 Gathering latest knowledge for: ${topic}`);
      const knowledgeContext = await this.knowledgeAgent.gatherLatestKnowledge(topic);
      
      // Step 2: Generate blog post with current knowledge context
      this.updateJob(jobId, { status: 'generating', progress: 40 });
      const generatedContent = await this.contentAgent.generateCustomBlogPost(topic, userPrompt || undefined, knowledgeContext);

      // Step 2: Create code samples if suggested
      this.updateJob(jobId, { status: 'generating', progress: 60 });
      if (generatedContent.codeSamples && generatedContent.codeSamples.length > 0) {
        // Code samples are already embedded in the content by the LLM
        console.log(`Generated ${generatedContent.codeSamples.length} code samples for the article`);
      }

      // Step 3: Review content with AI review agent
      this.updateJob(jobId, { status: 'reviewing', progress: 60 });
      const reviewResult = await this.reviewAgent.reviewContent(generatedContent);
      
      // Step 4: Enhance content if review found issues
      let finalContent = generatedContent;
      if (!reviewResult.approved || reviewResult.qualityScore < 85) {
        this.updateJob(jobId, { status: 'enhancing', progress: 80 });
        const enhancement = await this.enhanceAgent.enhanceContent(generatedContent, reviewResult);
        finalContent = enhancement.enhancedContent;
        console.log(`Content enhanced. Improvements: ${enhancement.improvementsMade.join(', ')}`);
      }
      
      // Step 5: Save the blog post
      const postId = await this.saveBlogPost(finalContent, reviewResult);

      // Step 6: Complete
      this.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        results: {
          articlesFound: 0, // No articles for custom generation
          articlesAnalyzed: 0,
          blogPostGenerated: true,
          postId: postId
        }
      });

      console.log(`Custom generation job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`Custom generation job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }

  private async processGeneration(jobId: string): Promise<void> {
    console.log(`Starting generation job ${jobId}`);

    try {
      // Step 1: Gather latest knowledge using LatestKnowledgeAgent
      this.updateJob(jobId, { status: 'fetching', progress: 5 });
      const job = this.getJob(jobId)!;
      let knowledgeContext;
      
      if (job.config.focusTopic) {
        console.log(`🧠 Gathering latest knowledge for focus topic: ${job.config.focusTopic}`);
        knowledgeContext = await this.knowledgeAgent.gatherLatestKnowledge(job.config.focusTopic);
      }

      // Step 2: Fetch news
      this.updateJob(jobId, { status: 'fetching', progress: 15 });
      const articles = await this.newsAgent.fetchLatestNews(job.config.hoursBack);
      
      // Step 3: Analyze relevance
      this.updateJob(jobId, { status: 'analyzing', progress: 35 });
      const relevantArticles = await this.newsAgent.analyzeRelevance(articles, job.config.focusTopic);
      
      // Filter by relevance score and limit count
      const filteredArticles = relevantArticles
        .filter(article => article.relevanceScore >= job.config.minRelevanceScore)
        .slice(0, job.config.maxArticles);

      if (filteredArticles.length === 0) {
        throw new Error('No articles met the relevance criteria');
      }

      // Step 4: Generate multiple blog posts (one per article) with knowledge context
      this.updateJob(jobId, { status: 'generating', progress: 65 });
      const generatedPosts = await this.contentAgent.generateMultipleBlogPosts(filteredArticles, job.config.focusTopic, knowledgeContext);

      // Step 4: Process each post with review agent
      this.updateJob(jobId, { status: 'reviewing', progress: 80 });
      const savedPostIds: string[] = [];
      
      for (const generatedContent of generatedPosts) {
        try {
          // Code samples are already embedded in the content by the LLM
          if (generatedContent.codeSamples && generatedContent.codeSamples.length > 0) {
            console.log(`Content includes ${generatedContent.codeSamples.length} code samples`);
          }

          // Review content with AI review agent
          const reviewResult = await this.reviewAgent.reviewContent(generatedContent);
          
          // Enhance content if review found issues
          let finalContent = generatedContent;
          if (!reviewResult.approved || reviewResult.qualityScore < 85) {
            const enhancement = await this.enhanceAgent.enhanceContent(generatedContent, reviewResult);
            finalContent = enhancement.enhancedContent;
            console.log(`Content enhanced for article. Improvements: ${enhancement.improvementsMade.join(', ')}`);
          }
          
          // Save as draft (for manual review) or publish if approved
          const postId = await this.saveBlogPost(finalContent, reviewResult);
          if (postId) {
            savedPostIds.push(postId);
          }
        } catch (error) {
          console.error('Error processing post:', error);
          // Continue with other posts
        }
      }

      // Step 5: Complete
      this.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        results: {
          articlesFound: articles.length,
          articlesAnalyzed: filteredArticles.length,
          blogPostGenerated: savedPostIds.length > 0,
          postId: savedPostIds[0], // First post ID for backward compatibility
          postIds: savedPostIds // All post IDs
        }
      });

      console.log(`Generation job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`Generation job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }

  // Removed insertDiagrams method - using code samples instead of mermaid diagrams

  private async saveBlogPost(content: GeneratedContent, reviewResult?: ReviewResult): Promise<string> {
    try {
      // Create a unique slug
      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + `-${Date.now()}`;

      // Calculate read time (approximate words per minute = 200)
      const wordCount = content.content.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      // Determine status based on review results
      const status = reviewResult?.approved ? 'published' : 'draft';
      
      // Create post data
      const postData = {
        title: content.title,
        slug,
        content: content.content,
        excerpt: content.summary,
        status,
        featuredImageUrl: null,
        authorId: 'ai-system',
        categoryId: 'cat-1', // Use existing AI/LLM category
        readTime,
        tags: content.tags,
        metadata: {
          sources: content.sources,
          generatedAt: new Date().toISOString(),
          aiGenerated: true,
          reviewResult: reviewResult ? {
            approved: reviewResult.approved,
            qualityScore: reviewResult.qualityScore,
            issues: reviewResult.issues.length,
            criticalIssues: reviewResult.issues.filter(i => i.severity === 'critical').length
          } : undefined
        }
      };

      // Save the post
      const post = await this.storage.createPost(postData);

      // Add tags
      if (content.tags && content.tags.length > 0) {
        for (const tagName of content.tags) {
          try {
            // Create or get existing tag
            const existingTags = await this.storage.getTags();
            let tag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
            
            if (!tag) {
              const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
              tag = await this.storage.createTag({
                name: tagName,
                slug: tagSlug
              });
            }

            // Note: Tag association would be handled by storage layer if supported
          } catch (tagError) {
            console.error(`Error adding tag ${tagName}:`, tagError);
          }
        }
      }

      console.log(`Blog post saved with ID: ${post.id}`);
      return post.id;

    } catch (error) {
      console.error('Error saving blog post:', error);
      throw new Error(`Failed to save blog post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateJob(jobId: string, updates: Partial<GenerationJob>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      this.jobs.set(jobId, job);
    }
  }

  getJob(jobId: string): GenerationJob | null {
    return this.jobs.get(jobId) || null;
  }

  getJobStatus(jobId: string): GenerationJob | null {
    return this.getJob(jobId);
  }

  getAllJobs(): GenerationJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && !['completed', 'failed'].includes(job.status)) {
      this.updateJob(jobId, {
        status: 'failed',
        error: 'Cancelled by user',
        progress: 0
      });
      return true;
    }
    return false;
  }

  getStats(): AIStats {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const failedJobs = jobs.filter(job => job.status === 'failed');
    
    const totalArticles = completedJobs.reduce((sum, job) => 
      sum + (job.results?.articlesAnalyzed || 0), 0
    );
    
    const totalGenerationTime = completedJobs.reduce((sum, job) => {
      if (job.startedAt && job.completedAt) {
        const startTime = new Date(job.startedAt).getTime();
        const endTime = new Date(job.completedAt).getTime();
        return sum + (endTime - startTime) / 1000; // in seconds
      }
      return sum;
    }, 0);

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageArticlesPerJob: completedJobs.length > 0 ? totalArticles / completedJobs.length : 0,
      averageGenerationTime: completedJobs.length > 0 ? totalGenerationTime / completedJobs.length : 0
    };
  }
}

// Export the class for instantiation in routes
export default AIOrchestrator;
export { AIOrchestrator };