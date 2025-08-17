import { Agent, Task, Team } from 'kaibanjs';
import { randomUUID } from 'crypto';
import type { NewsAgent, NewsArticle } from './newsAgent.js';
import type { ContentAgent, GeneratedContent } from './contentAgent.js';
import type { ReviewAgent, ReviewResult } from './reviewAgent.js';
import type { EnhanceAgent, EnhancementResult } from './enhanceAgent.js';
import { LatestKnowledgeAgent, type KnowledgeContext } from './latestKnowledgeAgent.js';
import type { IStorage } from '../storage.js';

export interface KaibanGenerationConfig {
  hoursBack: number;
  minRelevanceScore: number;
  maxArticles: number;
  focusTopic?: string;
}

export interface KaibanCustomConfig {
  topic: string;
  userPrompt?: string | null;
  type: 'custom';
}

export interface KaibanGenerationJob {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  config: KaibanGenerationConfig | KaibanCustomConfig;
  workflowStatus?: {
    currentTask?: string;
    activeTasks: string[];
    completedTasks: string[];
    failedTasks: string[];
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

export class KaibanBlogOrchestrator {
  private jobs: Map<string, KaibanGenerationJob> = new Map();
  private activeTeams: Map<string, Team> = new Map();
  private newsAgent: NewsAgent;
  private contentAgent: ContentAgent;
  private reviewAgent: ReviewAgent;
  private enhanceAgent: EnhanceAgent;
  private knowledgeAgent: LatestKnowledgeAgent;
  private storage: IStorage;

  // KaibanJS Agents - initialized in constructor
  private kaibanNewsAgent!: Agent;
  private kaibanContentAgent!: Agent;
  private kaibanReviewAgent!: Agent;
  private kaibanEnhanceAgent!: Agent;
  private kaibanKnowledgeAgent!: Agent;

  constructor(
    newsAgent: NewsAgent,
    contentAgent: ContentAgent,
    reviewAgent: ReviewAgent,
    enhanceAgent: EnhanceAgent,
    knowledgeAgent: LatestKnowledgeAgent,
    storage: IStorage
  ) {
    this.newsAgent = newsAgent;
    this.contentAgent = contentAgent;
    this.reviewAgent = reviewAgent;
    this.enhanceAgent = enhanceAgent;
    this.knowledgeAgent = knowledgeAgent;
    this.storage = storage;

    // Initialize KaibanJS Agents
    this.initializeKaibanAgents();
  }

  private initializeKaibanAgents() {
    // News Research Agent
    this.kaibanNewsAgent = new Agent({
      name: 'NewsResearcher',
      role: 'AI News Research Specialist',
      goal: 'Fetch and analyze the latest AI news articles to identify trending topics and relevant content for blog generation',
      background: 'Expert in AI industry trends, news aggregation, and content relevance analysis',
      tools: [], // We'll use our existing newsAgent implementation
    });

    // Knowledge Research Agent
    this.kaibanKnowledgeAgent = new Agent({
      name: 'KnowledgeResearcher',
      role: 'Latest Knowledge Research Specialist',
      goal: 'Gather current knowledge and context about specific topics to enhance blog content accuracy',
      background: 'Specialist in real-time knowledge acquisition and context synthesis',
      tools: [],
    });

    // Content Generation Agent
    this.kaibanContentAgent = new Agent({
      name: 'ContentGenerator',
      role: 'AI Content Creation Specialist',
      goal: 'Generate high-quality, engaging blog posts based on news articles and knowledge context',
      background: 'Expert technical writer specializing in AI/ML content with deep understanding of developer audiences',
      tools: [],
    });

    // Content Review Agent
    this.kaibanReviewAgent = new Agent({
      name: 'ContentReviewer',
      role: 'Quality Assurance Specialist',
      goal: 'Review generated content for quality, accuracy, and adherence to editorial standards',
      background: 'Editorial expert with focus on technical accuracy and content quality assessment',
      tools: [],
    });

    // Content Enhancement Agent
    this.kaibanEnhanceAgent = new Agent({
      name: 'ContentEnhancer',
      role: 'Content Optimization Specialist',
      goal: 'Enhance and refine content based on review feedback to ensure publication readiness',
      background: 'Content optimization expert skilled in addressing quality issues and improving readability',
      tools: [],
    });
  }

  async startKaibanGeneration(config: KaibanGenerationConfig): Promise<string> {
    const jobId = randomUUID();
    
    const job: KaibanGenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      config,
      workflowStatus: {
        activeTasks: [],
        completedTasks: [],
        failedTasks: []
      }
    };

    this.jobs.set(jobId, job);
    
    // Start the KaibanJS workflow
    this.processKaibanGeneration(jobId).catch(error => {
      console.error(`Kaiban generation job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        progress: 0
      });
    });

    return jobId;
  }

  async startKaibanCustomGeneration(config: KaibanCustomConfig): Promise<string> {
    const jobId = randomUUID();
    
    const job: KaibanGenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString(),
      config,
      workflowStatus: {
        activeTasks: [],
        completedTasks: [],
        failedTasks: []
      }
    };

    this.jobs.set(jobId, job);
    
    // Start the KaibanJS custom workflow
    this.processKaibanCustomGeneration(jobId, config.topic, config.userPrompt).catch(error => {
      console.error(`Kaiban custom generation job ${jobId} failed:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        progress: 0
      });
    });

    return jobId;
  }

  private async processKaibanGeneration(jobId: string): Promise<void> {
    console.log(`🤖 Starting Kaiban generation workflow for job ${jobId}`);

    try {
      const job = this.getJob(jobId)!;
      const config = job.config as KaibanGenerationConfig;

      // Create KaibanJS tasks for the workflow
      const tasks = this.createGenerationTasks(jobId, config);
      
      // Create the team
      const team = new Team({
        name: `BlogGeneration-${jobId}`,
        agents: [
          this.kaibanNewsAgent,
          this.kaibanKnowledgeAgent,
          this.kaibanContentAgent,
          this.kaibanReviewAgent,
          this.kaibanEnhanceAgent
        ],
        tasks: tasks,
        inputs: {
          hoursBack: config.hoursBack,
          minRelevanceScore: config.minRelevanceScore,
          maxArticles: config.maxArticles,
          focusTopic: config.focusTopic || 'General AI'
        },
        env: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
        }
      });

      // Store the team for monitoring
      this.activeTeams.set(jobId, team);

      // Start the workflow
      this.updateJob(jobId, { status: 'active', progress: 5 });
      
      // Execute the workflow with real-time monitoring
      await this.executeWorkflowWithMonitoring(jobId, team);

    } catch (error) {
      console.error(`Kaiban workflow failed for job ${jobId}:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }

  private async processKaibanCustomGeneration(jobId: string, topic: string, userPrompt?: string | null): Promise<void> {
    console.log(`🤖 Starting Kaiban custom generation workflow for job ${jobId}`);

    try {
      // Create KaibanJS tasks for custom generation
      const tasks = this.createCustomGenerationTasks(jobId, topic, userPrompt);
      
      // Create the team
      const team = new Team({
        name: `CustomGeneration-${jobId}`,
        agents: [
          this.kaibanKnowledgeAgent,
          this.kaibanContentAgent,
          this.kaibanReviewAgent,
          this.kaibanEnhanceAgent
        ],
        tasks: tasks,
        inputs: {
          topic: topic,
          userPrompt: userPrompt || undefined
        },
        env: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
        }
      });

      // Store the team for monitoring
      this.activeTeams.set(jobId, team);

      // Start the workflow
      this.updateJob(jobId, { status: 'active', progress: 5 });
      
      // Execute the workflow with real-time monitoring
      await this.executeWorkflowWithMonitoring(jobId, team);

    } catch (error) {
      console.error(`Kaiban custom workflow failed for job ${jobId}:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }

  private createGenerationTasks(jobId: string, config: KaibanGenerationConfig): Task[] {
    return [
      new Task({
        title: 'Research Latest Knowledge',
        description: `Gather latest knowledge and context about ${config.focusTopic || 'AI developments'}`,
        expectedOutput: 'Knowledge context with current information, key findings, and industry trends',
        agent: this.kaibanKnowledgeAgent
      }),

      new Task({
        title: 'Fetch and Analyze News',
        description: `Fetch AI news from the last ${config.hoursBack} hours and analyze relevance`,
        expectedOutput: 'List of relevant, analyzed news articles ready for content generation',
        agent: this.kaibanNewsAgent
      }),

      new Task({
        title: 'Generate Blog Content',
        description: 'Generate high-quality blog posts from analyzed news articles',
        expectedOutput: 'Generated blog posts with content, metadata, and source attribution',
        agent: this.kaibanContentAgent
      }),

      new Task({
        title: 'Review Content Quality',
        description: 'Review generated content for quality, accuracy, and editorial standards',
        expectedOutput: 'Quality assessment results and approval status for each post',
        agent: this.kaibanReviewAgent
      }),

      new Task({
        title: 'Enhance and Publish',
        description: 'Enhance content based on review feedback and save to database',
        expectedOutput: 'Finalized, enhanced blog posts saved to the system',
        agent: this.kaibanEnhanceAgent
      })
    ];
  }

  private createCustomGenerationTasks(jobId: string, topic: string, userPrompt?: string | null): Task[] {
    return [
      new Task({
        title: 'Research Topic Knowledge',
        description: `Gather comprehensive knowledge about: ${topic}`,
        expectedOutput: 'Current knowledge context with latest developments and industry insights',
        agent: this.kaibanKnowledgeAgent
      }),

      new Task({
        title: 'Generate Custom Content',
        description: `Create a comprehensive blog post about: ${topic}`,
        expectedOutput: 'High-quality, custom blog post with proper structure and SEO optimization',
        agent: this.kaibanContentAgent
      }),

      new Task({
        title: 'Review Custom Content',
        description: 'Review the custom content for quality and accuracy',
        expectedOutput: 'Quality assessment and approval status',
        agent: this.kaibanReviewAgent
      }),

      new Task({
        title: 'Finalize and Save',
        description: 'Enhance content if needed and save to database',
        expectedOutput: 'Finalized blog post saved to the system',
        agent: this.kaibanEnhanceAgent
      })
    ];
  }

  private async executeWorkflowWithMonitoring(jobId: string, team: Team): Promise<void> {
    try {
      // Start the team workflow
      await team.start();
      
      // Monitor the workflow status
      this.monitorWorkflowProgress(jobId, team);
      
      console.log(`✅ Workflow completed for job ${jobId}`);
      
    } catch (error) {
      console.error(`❌ Workflow failed for job ${jobId}:`, error);
      throw error;
    } finally {
      // Cleanup
      this.activeTeams.delete(jobId);
    }
  }

  private monitorWorkflowProgress(jobId: string, team: Team): void {
    // Simplified monitoring - just update progress periodically
    const monitoringInterval = setInterval(() => {
      try {
        const job = this.getJob(jobId);
        if (!job || job.status === 'completed' || job.status === 'failed') {
          clearInterval(monitoringInterval);
          return;
        }

        // Simple progress update without accessing internal team state
        this.updateJob(jobId, {
          workflowStatus: {
            currentTask: 'Processing workflow...',
            activeTasks: ['Workflow in progress'],
            completedTasks: [],
            failedTasks: []
          }
        });

      } catch (error) {
        console.error('Error monitoring workflow:', error);
        clearInterval(monitoringInterval);
      }
    }, 2000); // Check every 2 seconds

    // Clear monitoring after 30 minutes
    setTimeout(() => clearInterval(monitoringInterval), 30 * 60 * 1000);
  }

  private updateTaskProgress(jobId: string, taskTitle: string, status: 'active' | 'completed' | 'failed'): void {
    const job = this.getJob(jobId);
    if (!job) return;

    const workflowStatus = job.workflowStatus || {
      activeTasks: [],
      completedTasks: [],
      failedTasks: []
    };

    // Update task status
    if (status === 'active') {
      if (!workflowStatus.activeTasks.includes(taskTitle)) {
        workflowStatus.activeTasks.push(taskTitle);
        workflowStatus.currentTask = taskTitle;
      }
    } else if (status === 'completed') {
      workflowStatus.activeTasks = workflowStatus.activeTasks.filter(t => t !== taskTitle);
      if (!workflowStatus.completedTasks.includes(taskTitle)) {
        workflowStatus.completedTasks.push(taskTitle);
      }
    } else if (status === 'failed') {
      workflowStatus.activeTasks = workflowStatus.activeTasks.filter(t => t !== taskTitle);
      if (!workflowStatus.failedTasks.includes(taskTitle)) {
        workflowStatus.failedTasks.push(taskTitle);
      }
    }

    this.updateJob(jobId, { workflowStatus });
  }

  private async saveBlogPost(content: GeneratedContent, reviewResult?: ReviewResult): Promise<string> {
    try {
      // Create a unique slug
      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + `-${Date.now()}`;

      // Calculate read time
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
        featuredImageUrl: content.featuredImage || null,
        authorId: 'ai-system',
        categoryId: 'cat-1',
        readTime,
        tags: content.tags,
        metadata: {
          sources: content.sources,
          generatedAt: new Date().toISOString(),
          aiGenerated: true,
          kaibanGenerated: true, // Mark as KaibanJS generated
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
            const existingTags = await this.storage.getTags();
            let tag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
            
            if (!tag) {
              const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
              tag = await this.storage.createTag({
                name: tagName,
                slug: tagSlug
              });
            }
          } catch (tagError) {
            console.error(`Error adding tag ${tagName}:`, tagError);
          }
        }
      }

      console.log(`✅ Blog post saved with ID: ${post.id} (KaibanJS Generated)`);
      return post.id;

    } catch (error) {
      console.error('Error saving blog post:', error);
      throw new Error(`Failed to save blog post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateJob(jobId: string, updates: Partial<KaibanGenerationJob>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      this.jobs.set(jobId, job);
    }
  }

  // Public methods for dashboard access
  getJob(jobId: string): KaibanGenerationJob | null {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): KaibanGenerationJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  getActiveTeam(jobId: string): Team | null {
    return this.activeTeams.get(jobId) || null;
  }

  getTeamState(jobId: string): any {
    const team = this.activeTeams.get(jobId);
    if (!team) return null;
    
    try {
      // Return simplified state since teamState API might not be available
      return {
        status: 'active',
        currentTask: 'Processing...',
        activeTasks: ['Workflow in progress'],
        completedTasks: [],
        failedTasks: []
      };
    } catch (error) {
      console.error('Error getting team state:', error);
      return null;
    }
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && !['completed', 'failed'].includes(job.status)) {
      // Stop the team if active
      const team = this.activeTeams.get(jobId);
      if (team) {
        try {
          team.stop?.();
        } catch (error) {
          console.error('Error stopping team:', error);
        }
        this.activeTeams.delete(jobId);
      }

      this.updateJob(jobId, {
        status: 'cancelled',
        error: 'Cancelled by user',
        progress: 0
      });
      return true;
    }
    return false;
  }

  getStats() {
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
        return sum + (endTime - startTime) / 1000;
      }
      return sum;
    }, 0);

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageArticlesPerJob: completedJobs.length > 0 ? totalArticles / completedJobs.length : 0,
      averageGenerationTime: completedJobs.length > 0 ? totalGenerationTime / completedJobs.length : 0,
      activeJobs: jobs.filter(job => job.status === 'active').length,
      kaibanGenerated: true
    };
  }
}

export default KaibanBlogOrchestrator;
