import { randomUUID } from 'crypto';
import type { NewsAgent, NewsArticle } from './newsAgent';
import type { ContentAgent, GeneratedContent } from './contentAgent';
import type { IStorage } from '../storage';

export interface GenerationConfig {
  hoursBack: number;
  minRelevanceScore: number;
  maxArticles: number;
  focusTopic?: string;
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'fetching' | 'analyzing' | 'generating' | 'reviewing' | 'completed' | 'failed';
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
  private storage: IStorage;

  constructor(newsAgent: NewsAgent, contentAgent: ContentAgent, storage: IStorage) {
    this.newsAgent = newsAgent;
    this.contentAgent = contentAgent;
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

  private async processGeneration(jobId: string): Promise<void> {
    console.log(`Starting generation job ${jobId}`);

    try {
      // Step 1: Fetch news
      this.updateJob(jobId, { status: 'fetching', progress: 10 });
      const articles = await this.newsAgent.fetchLatestNews(this.getJob(jobId)!.config.hoursBack);
      
      // Step 2: Analyze relevance
      this.updateJob(jobId, { status: 'analyzing', progress: 30 });
      const job = this.getJob(jobId)!;
      const relevantArticles = await this.newsAgent.analyzeRelevance(articles, job.config.focusTopic);
      
      // Filter by relevance score and limit count
      const filteredArticles = relevantArticles
        .filter(article => article.relevanceScore >= job.config.minRelevanceScore)
        .slice(0, job.config.maxArticles);

      if (filteredArticles.length === 0) {
        throw new Error('No articles met the relevance criteria');
      }

      // Step 3: Generate content
      this.updateJob(jobId, { status: 'generating', progress: 60 });
      const generatedContent = await this.contentAgent.generateBlogPost(filteredArticles, job.config.focusTopic);

      // Step 4: Create diagrams if suggested
      this.updateJob(jobId, { status: 'generating', progress: 80 });
      if (generatedContent.diagrams && generatedContent.diagrams.length > 0) {
        const diagrams = await this.contentAgent.createDiagrams(generatedContent.diagrams);
        if (diagrams.length > 0) {
          // Insert diagrams into the content
          generatedContent.content = this.insertDiagrams(generatedContent.content, diagrams);
        }
      }

      // Step 5: Save to storage
      this.updateJob(jobId, { status: 'reviewing', progress: 90 });
      const postId = await this.saveBlogPost(generatedContent);

      // Step 6: Complete
      this.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        results: {
          articlesFound: articles.length,
          articlesAnalyzed: filteredArticles.length,
          blogPostGenerated: true,
          postId
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

  private insertDiagrams(content: string, diagrams: string[]): string {
    let updatedContent = content;
    
    // Insert diagrams at strategic points in the content
    diagrams.forEach((diagram, index) => {
      const diagramMd = `

\`\`\`mermaid
${diagram}
\`\`\`

`;
      
      // Insert after the first few paragraphs or before conclusion
      if (index === 0) {
        // Insert after the first heading or paragraph
        const insertPoint = updatedContent.indexOf('\n\n');
        if (insertPoint > 0) {
          updatedContent = updatedContent.slice(0, insertPoint) + diagramMd + updatedContent.slice(insertPoint);
        }
      } else {
        // Insert before conclusion or at end
        const conclusionIndex = updatedContent.toLowerCase().indexOf('## conclusion');
        if (conclusionIndex > 0) {
          updatedContent = updatedContent.slice(0, conclusionIndex) + diagramMd + updatedContent.slice(conclusionIndex);
        } else {
          updatedContent += diagramMd;
        }
      }
    });

    return updatedContent;
  }

  private async saveBlogPost(content: GeneratedContent): Promise<string> {
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

      // Create post data
      const postData = {
        title: content.title,
        slug,
        content: content.content,
        excerpt: content.summary,
        status: 'published' as const,
        featuredImageUrl: null,
        authorId: 'ai-system',
        categoryId: 'cat-1', // Use existing AI/LLM category
        readTime,
        metadata: {
          sources: content.sources,
          generatedAt: new Date().toISOString(),
          aiGenerated: true
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
export { AIOrchestrator };