import { type User, type InsertUser, type Category, type InsertCategory, type Tag, type InsertTag, type Post, type InsertPost, type UpdatePost, type Comment, type InsertComment, type PostWithDetails, type CommentWithReplies } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Tags
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;

  // Posts
  getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]>;
  getPost(id: string): Promise<PostWithDetails | undefined>;
  getPostBySlug(slug: string): Promise<PostWithDetails | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: UpdatePost): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  incrementPostViews(id: string): Promise<void>;
  incrementPostLikes(id: string): Promise<void>;

  // Comments
  getCommentsByPost(postId: string): Promise<CommentWithReplies[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  incrementCommentLikes(id: string): Promise<void>;
  approveComment(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private tags: Map<string, Tag>;
  private posts: Map<string, Post>;
  private comments: Map<string, Comment>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.tags = new Map();
    this.posts = new Map();
    this.comments = new Map();

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: "user-1",
      username: "anujmahajan",
      email: "anuj@anujmahajan.dev",
      name: "Anuj Mahajan",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create categories
    const categories: Category[] = [
      {
        id: "cat-1",
        name: "AI/LLM",
        slug: "ai-llm",
        description: "Artificial Intelligence and Large Language Models",
        color: "#8B5CF6",
        createdAt: new Date(),
      },
      {
        id: "cat-2",
        name: "Backend",
        slug: "backend",
        description: "Server-side development and architecture",
        color: "#10B981",
        createdAt: new Date(),
      },
      {
        id: "cat-3",
        name: "Frontend",
        slug: "frontend",
        description: "Client-side development and frameworks",
        color: "#3B82F6",
        createdAt: new Date(),
      },
      {
        id: "cat-4",
        name: "Hosting",
        slug: "hosting",
        description: "Deployment and hosting solutions",
        color: "#F59E0B",
        createdAt: new Date(),
      },
    ];

    categories.forEach(cat => this.categories.set(cat.id, cat));

    // Create tags
    const tags: Tag[] = [
      { id: "tag-1", name: "React", slug: "react", createdAt: new Date() },
      { id: "tag-2", name: "Node.js", slug: "nodejs", createdAt: new Date() },
      { id: "tag-3", name: "TypeScript", slug: "typescript", createdAt: new Date() },
      { id: "tag-4", name: "Docker", slug: "docker", createdAt: new Date() },
      { id: "tag-5", name: "AWS", slug: "aws", createdAt: new Date() },
      { id: "tag-6", name: "Next.js", slug: "nextjs", createdAt: new Date() },
    ];

    tags.forEach(tag => this.tags.set(tag.id, tag));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id, 
      createdAt: new Date(),
      description: insertCategory.description || null
    };
    this.categories.set(id, category);
    return category;
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: string): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(tag => tag.slug === slug);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = randomUUID();
    const tag: Tag = { ...insertTag, id, createdAt: new Date() };
    this.tags.set(id, tag);
    return tag;
  }

  // Posts
  async getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]> {
    let posts = Array.from(this.posts.values());

    // Apply filters
    if (filters?.status) {
      posts = posts.filter(post => post.status === filters.status);
    }

    if (filters?.category) {
      posts = posts.filter(post => {
        const category = this.categories.get(post.categoryId);
        return category?.slug === filters.category;
      });
    }

    if (filters?.tag) {
      posts = posts.filter(post => post.tags && post.tags.includes(filters.tag!));
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by publishedAt or createdAt (most recent first)
    posts.sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    // Transform to PostWithDetails
    return posts.map(post => {
      const author = this.users.get(post.authorId)!;
      const category = this.categories.get(post.categoryId)!;
      const commentsCount = Array.from(this.comments.values())
        .filter(comment => comment.postId === post.id && comment.isApproved).length;

      return { ...post, author, category, commentsCount };
    });
  }

  async getPost(id: string): Promise<PostWithDetails | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const author = this.users.get(post.authorId)!;
    const category = this.categories.get(post.categoryId)!;
    const commentsCount = Array.from(this.comments.values())
      .filter(comment => comment.postId === post.id && comment.isApproved).length;

    return { ...post, author, category, commentsCount };
  }

  async getPostBySlug(slug: string): Promise<PostWithDetails | undefined> {
    const post = Array.from(this.posts.values()).find(p => p.slug === slug);
    if (!post) return undefined;

    const author = this.users.get(post.authorId)!;
    const category = this.categories.get(post.categoryId)!;
    const commentsCount = Array.from(this.comments.values())
      .filter(comment => comment.postId === post.id && comment.isApproved).length;

    return { ...post, author, category, commentsCount };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
      status: insertPost.status || "draft",
      tags: insertPost.tags || [],
      featuredImage: insertPost.featuredImage || null,
      metaTitle: insertPost.metaTitle || null,
      metaDescription: insertPost.metaDescription || null,
      publishedAt: insertPost.publishedAt || null
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: string, updatePost: UpdatePost): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const updatedPost: Post = {
      ...post,
      ...updatePost,
      tags: updatePost.tags || post.tags,
      updatedAt: new Date(),
    };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async incrementPostViews(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.views += 1;
      this.posts.set(id, post);
    }
  }

  async incrementPostLikes(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.likes += 1;
      this.posts.set(id, post);
    }
  }

  // Comments
  async getCommentsByPost(postId: string): Promise<CommentWithReplies[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId && comment.isApproved)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Build comment tree
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create comment objects
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }

  async getComment(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      likes: 0,
      isApproved: true, // Auto-approve for demo
      createdAt: new Date(),
      authorAvatar: insertComment.authorAvatar || null,
      parentId: insertComment.parentId || null
    };
    this.comments.set(id, comment);
    return comment;
  }

  async incrementCommentLikes(id: string): Promise<void> {
    const comment = this.comments.get(id);
    if (comment) {
      comment.likes += 1;
      this.comments.set(id, comment);
    }
  }

  async approveComment(id: string): Promise<void> {
    const comment = this.comments.get(id);
    if (comment) {
      comment.isApproved = true;
      this.comments.set(id, comment);
    }
  }
}

export const storage = new MemStorage();
