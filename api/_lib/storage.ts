import { users, posts, categories, tags, comments, type User, type Post, type Category, type Tag, type Comment, type InsertUser, type InsertPost, type InsertCategory, type InsertTag, type InsertComment, type PostWithDetails, type CommentWithReplies, type UpdatePost } from "../../shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, like, sql, count } from "drizzle-orm";
import { seedDatabase } from "./seed";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(insertCategory: InsertCategory): Promise<Category>;

  // Tags
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  createTag(insertTag: InsertTag): Promise<Tag>;

  // Posts
  getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]>;
  getPost(id: string): Promise<PostWithDetails | undefined>;
  getPostBySlug(slug: string): Promise<PostWithDetails | undefined>;
  createPost(insertPost: InsertPost): Promise<Post>;
  updatePost(id: string, updatePost: UpdatePost): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  incrementPostViews(id: string): Promise<void>;
  incrementPostLikes(id: string): Promise<void>;

  // Comments
  getCommentsByPost(postId: string): Promise<CommentWithReplies[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(insertComment: InsertComment): Promise<Comment>;
}

export class DatabaseStorage implements IStorage {
  private isInitialized = false;

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await seedDatabase();
      this.isInitialized = true;
    }
  }
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    await this.ensureInitialized();
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    await this.ensureInitialized();
    return await db.select().from(tags).orderBy(asc(tags.name));
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
    return tag || undefined;
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values(insertTag)
      .returning();
    return tag;
  }

  // Posts
  async getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]> {
    await this.ensureInitialized();
    let query = db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        featuredImage: posts.featuredImage,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        tags: posts.tags,
        status: posts.status,
        readTime: posts.readTime,
        views: posts.views,
        likes: posts.likes,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          avatar: users.avatar,
          bio: users.bio,
          createdAt: users.createdAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          createdAt: categories.createdAt,
        },
        commentsCount: sql<number>`(
          SELECT COUNT(*)::integer 
          FROM ${comments} 
          WHERE ${comments.postId} = ${posts.id} 
          AND ${comments.isApproved} = true
        )`.as('commentsCount')
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id));

    // Apply filters
    if (filters?.status) {
      query = query.where(eq(posts.status, filters.status));
    }

    if (filters?.category) {
      query = query.where(eq(categories.slug, filters.category));
    }

    if (filters?.tag && filters.tag.trim()) {
      query = query.where(sql`${posts.tags} ? ${filters.tag}`);
    }

    if (filters?.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query = query.where(
        or(
          like(sql`lower(${posts.title})`, searchTerm),
          like(sql`lower(${posts.excerpt})`, searchTerm),
          like(sql`lower(${posts.content})`, searchTerm)
        )
      );
    }

    // Order by published date or created date (most recent first)
    query = query.orderBy(desc(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`));

    const results = await query;
    return results as PostWithDetails[];
  }

  async getPost(id: string): Promise<PostWithDetails | undefined> {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        featuredImage: posts.featuredImage,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        tags: posts.tags,
        status: posts.status,
        readTime: posts.readTime,
        views: posts.views,
        likes: posts.likes,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          avatar: users.avatar,
          bio: users.bio,
          createdAt: users.createdAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          createdAt: categories.createdAt,
        },
        commentsCount: sql<number>`(
          SELECT COUNT(*)::integer 
          FROM ${comments} 
          WHERE ${comments.postId} = ${posts.id} 
          AND ${comments.isApproved} = true
        )`.as('commentsCount')
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.id, id));

    return result[0] as PostWithDetails || undefined;
  }

  async getPostBySlug(slug: string): Promise<PostWithDetails | undefined> {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        featuredImage: posts.featuredImage,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        tags: posts.tags,
        status: posts.status,
        readTime: posts.readTime,
        views: posts.views,
        likes: posts.likes,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          avatar: users.avatar,
          bio: users.bio,
          createdAt: users.createdAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          createdAt: categories.createdAt,
        },
        commentsCount: sql<number>`(
          SELECT COUNT(*)::integer 
          FROM ${comments} 
          WHERE ${comments.postId} = ${posts.id} 
          AND ${comments.isApproved} = true
        )`.as('commentsCount')
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.slug, slug));

    return result[0] as PostWithDetails || undefined;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updatePost(id: string, updatePost: UpdatePost): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...updatePost, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning({ id: posts.id });
    return result.length > 0;
  }

  async incrementPostViews(id: string): Promise<void> {
    await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));
  }

  async incrementPostLikes(id: string): Promise<void> {
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, id));
  }

  // Comments
  async getCommentsByPost(postId: string): Promise<CommentWithReplies[]> {
    const allComments = await db
      .select()
      .from(comments)
      .where(and(eq(comments.postId, postId), eq(comments.isApproved, true)))
      .orderBy(asc(comments.createdAt));

    // Build comment tree
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create comment objects
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    allComments.forEach(comment => {
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
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }
}

export const storage = new DatabaseStorage();