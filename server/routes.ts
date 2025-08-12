import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, updatePostSchema } from "@shared/schema";
import { z } from "zod";
import { AIOrchestrator } from "./ai-agents/orchestrator";
import { NewsAgent } from "./ai-agents/newsAgent";
import { ContentAgent } from "./ai-agents/contentAgent";
import { ReviewAgent } from "./ai-agents/reviewAgent";
import { EnhanceAgent } from "./ai-agents/enhanceAgent";

// Initialize AI agents
const newsAgent = new NewsAgent();
const contentAgent = new ContentAgent();
const reviewAgent = new ReviewAgent();
const enhanceAgent = new EnhanceAgent();
const aiOrchestrator = new AIOrchestrator(newsAgent, contentAgent, reviewAgent, enhanceAgent, storage);

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Internal server error" });
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
      res.status(500).json({ error: "Internal server error" });
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
      const { topic } = req.body;
      
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        return res.status(400).json({ error: "Topic is required" });
      }
      
      const jobId = await aiOrchestrator.startCustomGeneration({
        topic: topic.trim(),
        type: 'custom'
      });
      
      res.json({ jobId, status: "started", topic: topic.trim() });
    } catch (error) {
      console.error("Error starting custom blog generation:", error);
      res.status(500).json({ error: "Failed to start custom blog generation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
