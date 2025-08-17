import type { Express } from "express";
import { createServer, type Server } from "http";
import https from "https";
import fs from "fs";
import { storage } from "./storage.js";
import { insertPostSchema, insertCommentSchema, updatePostSchema } from "../shared/schema.js";
import { z } from "zod";
import { AIOrchestrator } from "./ai-agents/orchestrator.js";
import { KaibanBlogOrchestrator } from "./ai-agents/kaibanOrchestrator.js";
import { NewsAgent } from "./ai-agents/newsAgent.js";
import { ContentAgent } from "./ai-agents/contentAgent.js";
import { ReviewAgent } from "./ai-agents/reviewAgent.js";
import { EnhanceAgent } from "./ai-agents/enhanceAgent.js";
import { LatestKnowledgeAgent } from "./ai-agents/latestKnowledgeAgent.js";

// Initialize AI agents
const newsAgent = new NewsAgent();
const contentAgent = new ContentAgent(storage);
const reviewAgent = new ReviewAgent();
const enhanceAgent = new EnhanceAgent();
const knowledgeAgent = new LatestKnowledgeAgent();

// Initialize orchestrators (legacy and new KaibanJS)
const aiOrchestrator = new AIOrchestrator(newsAgent, contentAgent, reviewAgent, enhanceAgent, knowledgeAgent, storage);
const kaibanOrchestrator = new KaibanBlogOrchestrator(newsAgent, contentAgent, reviewAgent, enhanceAgent, knowledgeAgent, storage);

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - no database required
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Tags
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const { category, tag, search, status = "published" } = req.query;
      const posts = await storage.getPosts({
        category: category as string,
        tag: tag as string,
        search: search as string,
        status: status as string,
      });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        endpoint: "/api/posts"
      });
    }
  });

  // Draft posts endpoint (for manual review)
  app.get("/api/posts/drafts", async (req, res) => {
    try {
      const drafts = await storage.getPosts({ status: "draft" });
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching draft posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get post by ID (for editing)
  app.get("/api/posts/id/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Increment view count
      await storage.incrementPostViews(post.id);
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updatePostSchema.parse(req.body);
      const post = await storage.updatePost(id, validatedData);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePost(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementPostLikes(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Comments
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId,
      });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/comments/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementCommentLikes(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Search
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const posts = await storage.getPosts({ search: q, status: "published" });
      res.json(posts);
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // AI Agent Routes
  
  // Start AI content generation
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { hoursBack = 24, minRelevanceScore = 0.7, maxArticles = 5, focusTopic } = req.body;
      
      const jobId = await aiOrchestrator.startGeneration({
        hoursBack,
        minRelevanceScore,
        maxArticles,
        focusTopic
      });
      
      res.json({ jobId, status: "started" });
    } catch (error) {
      console.error("Error starting AI generation:", error);
      res.status(500).json({ error: "Failed to start generation" });
    }
  });

  // Get generation job status
  app.get("/api/ai/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = aiOrchestrator.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      res.status(500).json({ error: "Failed to fetch job status" });
    }
  });

  // Get all jobs (admin dashboard)
  app.get("/api/ai/jobs", async (req, res) => {
    try {
      const jobs = aiOrchestrator.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Cancel a generation job
  app.delete("/api/ai/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const cancelled = aiOrchestrator.cancelJob(jobId);
      
      if (!cancelled) {
        return res.status(404).json({ error: "Job not found or cannot be cancelled" });
      }
      
      res.json({ status: "cancelled" });
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ error: "Failed to cancel job" });
    }
  });

  // Get AI generation statistics
  app.get("/api/ai/stats", async (req, res) => {
    try {
      const stats = aiOrchestrator.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching AI stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Preview news articles (for manual review)
  app.get("/api/ai/news", async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const articles = await newsAgent.fetchLatestNews(Number(hours));
      res.json(articles);
    } catch (error) {
      console.error("Error fetching news preview:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Generate custom blog post on specific topic
  app.post("/api/ai/generate-custom", async (req, res) => {
    try {
      const { topic, userPrompt } = req.body;
      
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        return res.status(400).json({ error: "Topic is required" });
      }
      
      const jobId = await aiOrchestrator.startCustomGeneration({
        topic: topic.trim(),
        userPrompt: userPrompt?.trim() || null,
        type: 'custom'
      });
      
      res.json({ 
        jobId, 
        status: "started", 
        topic: topic.trim(),
        userPrompt: userPrompt?.trim() || null
      });
    } catch (error) {
      console.error("Error starting custom blog generation:", error);
      res.status(500).json({ error: "Failed to start custom blog generation" });
    }
  });

  // KaibanJS Enhanced AI Routes
  
  // Start KaibanJS content generation with enhanced workflow visualization
  app.post("/api/kaiban/generate", async (req, res) => {
    try {
      const { hoursBack = 24, minRelevanceScore = 0.7, maxArticles = 5, focusTopic } = req.body;
      
      const jobId = await kaibanOrchestrator.startKaibanGeneration({
        hoursBack,
        minRelevanceScore,
        maxArticles,
        focusTopic
      });
      
      res.json({ 
        jobId, 
        status: "started",
        orchestrator: "kaiban",
        workflow: "news-to-blog-generation"
      });
    } catch (error) {
      console.error("Error starting KaibanJS generation:", error);
      res.status(500).json({ error: "Failed to start KaibanJS generation" });
    }
  });

  // Start KaibanJS custom blog generation
  app.post("/api/kaiban/generate-custom", async (req, res) => {
    try {
      const { topic, userPrompt } = req.body;
      
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        return res.status(400).json({ error: "Topic is required" });
      }
      
      const jobId = await kaibanOrchestrator.startKaibanCustomGeneration({
        topic: topic.trim(),
        userPrompt: userPrompt?.trim() || null,
        type: 'custom'
      });
      
      res.json({ 
        jobId, 
        status: "started", 
        topic: topic.trim(),
        userPrompt: userPrompt?.trim() || null,
        orchestrator: "kaiban",
        workflow: "custom-blog-generation"
      });
    } catch (error) {
      console.error("Error starting KaibanJS custom generation:", error);
      res.status(500).json({ error: "Failed to start KaibanJS custom generation" });
    }
  });

  // Get KaibanJS job status with workflow details
  app.get("/api/kaiban/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = kaibanOrchestrator.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "KaibanJS job not found" });
      }
      
      // Get additional workflow state from KaibanJS team
      const teamState = kaibanOrchestrator.getTeamState(jobId);
      
      res.json({
        ...job,
        teamState,
        orchestrator: "kaiban"
      });
    } catch (error) {
      console.error("Error fetching KaibanJS job status:", error);
      res.status(500).json({ error: "Failed to fetch KaibanJS job status" });
    }
  });

  // Get all KaibanJS jobs
  app.get("/api/kaiban/jobs", async (req, res) => {
    try {
      const jobs = kaibanOrchestrator.getAllJobs();
      res.json(jobs.map(job => ({
        ...job,
        orchestrator: "kaiban"
      })));
    } catch (error) {
      console.error("Error fetching KaibanJS jobs:", error);
      res.status(500).json({ error: "Failed to fetch KaibanJS jobs" });
    }
  });

  // Cancel a KaibanJS generation job
  app.delete("/api/kaiban/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const cancelled = kaibanOrchestrator.cancelJob(jobId);
      
      if (!cancelled) {
        return res.status(404).json({ error: "KaibanJS job not found or cannot be cancelled" });
      }
      
      res.json({ status: "cancelled", orchestrator: "kaiban" });
    } catch (error) {
      console.error("Error cancelling KaibanJS job:", error);
      res.status(500).json({ error: "Failed to cancel KaibanJS job" });
    }
  });

  // Get KaibanJS statistics
  app.get("/api/kaiban/stats", async (req, res) => {
    try {
      const stats = kaibanOrchestrator.getStats();
      res.json({
        ...stats,
        orchestrator: "kaiban"
      });
    } catch (error) {
      console.error("Error fetching KaibanJS stats:", error);
      res.status(500).json({ error: "Failed to fetch KaibanJS statistics" });
    }
  });

  // Get KaibanJS team state for a specific job (for real-time monitoring)
  app.get("/api/kaiban/teams/:jobId/state", async (req, res) => {
    try {
      const { jobId } = req.params;
      const teamState = kaibanOrchestrator.getTeamState(jobId);
      
      if (!teamState) {
        return res.status(404).json({ error: "Team not found or job completed" });
      }
      
      res.json(teamState);
    } catch (error) {
      console.error("Error fetching team state:", error);
      res.status(500).json({ error: "Failed to fetch team state" });
    }
  });

  // SSL Configuration - only for production and when certificates exist
  const isProduction = process.env.NODE_ENV === 'production';
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;
  const enableSSL = isProduction && sslKeyPath && sslCertPath;

  let httpServer: Server;

  if (enableSSL) {
    // Check if SSL certificate files actually exist
    try {
      if (!fs.existsSync(sslKeyPath!) || !fs.existsSync(sslCertPath!)) {
        throw new Error(`SSL certificate files not found: ${sslKeyPath}, ${sslCertPath}`);
      }
      
      const options = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      };
      httpServer = https.createServer(options, app);
      console.log('✅ HTTPS server configured with SSL certificates');
      console.log(`🔒 SSL Key: ${sslKeyPath}`);
      console.log(`🔒 SSL Cert: ${sslCertPath}`);
    } catch (error) {
      console.error('❌ Failed to load SSL certificates, falling back to HTTP:', error.message);
      httpServer = createServer(app);
      console.log('🔓 HTTP server configured (SSL fallback)');
    }
  } else {
    // Development or no SSL configured: Create regular HTTP server
    httpServer = createServer(app);
    if (isProduction) {
      console.log('🔓 HTTP server configured (no SSL certificates provided)');
    } else {
      console.log('🔓 HTTP server configured (development mode)');
    }
  }

  return httpServer;
}
