import OpenAI from "openai";
import type { NewsArticle } from "./newsAgent";
import type { InsertPost } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BlogPostGeneration {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  readTime: number;
  metaTitle: string;
  metaDescription: string;
  sources: SourceReference[];
  diagrams: DiagramSpec[];
}

export interface SourceReference {
  title: string;
  url: string;
  author?: string;
  publishedAt: Date;
  quotedText?: string;
}

export interface DiagramSpec {
  type: 'mermaid' | 'ascii' | 'svg';
  title: string;
  description: string;
  content: string;
  position: 'top' | 'middle' | 'bottom' | 'inline';
}

export class ContentAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = openai;
  }

  /**
   * Generate a comprehensive blog post from news articles
   */
  async generateBlogPost(articles: NewsArticle[], topic?: string): Promise<BlogPostGeneration> {
    console.log(`Generating blog post from ${articles.length} articles...`);

    try {
      // First, analyze the articles and create an outline
      const outline = await this.createOutline(articles, topic);
      
      // Generate the main content with proper attribution
      const content = await this.generateContent(articles, outline);
      
      // Create diagrams to enhance understanding
      const diagrams = await this.generateDiagrams(articles, outline);
      
      // Generate metadata
      const metadata = await this.generateMetadata(articles, content);

      // Estimate reading time
      const readTime = this.estimateReadingTime(content);

      return {
        title: metadata.title,
        content: this.insertDiagrams(content, diagrams),
        excerpt: metadata.excerpt,
        tags: metadata.tags,
        category: metadata.category,
        readTime,
        metaTitle: metadata.metaTitle,
        metaDescription: metadata.metaDescription,
        sources: articles.map(article => ({
          title: article.title,
          url: article.url,
          author: article.author,
          publishedAt: article.publishedAt,
        })),
        diagrams
      };

    } catch (error) {
      console.error("Error generating blog post:", error);
      throw new Error("Failed to generate blog post");
    }
  }

  /**
   * Create a structured outline from multiple articles
   */
  private async createOutline(articles: NewsArticle[], topic?: string): Promise<string> {
    const articleSummaries = articles.map(article => 
      `**${article.title}** (${article.source})\n${article.summary || article.content.substring(0, 200)}...`
    ).join('\n\n');

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert technical blogger. Create a detailed outline for a comprehensive blog post that synthesizes multiple AI news articles. 
          
          Requirements:
          - Create a cohesive narrative from multiple sources
          - Include proper attribution throughout
          - Structure for maximum reader comprehension
          - Identify where diagrams would help explain concepts
          - Make it more insightful than reading individual sources
          
          Format as a detailed outline with main sections and subsections.`
        },
        {
          role: "user",
          content: `Topic focus: ${topic || "Latest AI Developments"}\n\nArticle sources:\n${articleSummaries}`
        }
      ],
      max_tokens: 1000
    });

    return response.choices[0]?.message?.content || "";
  }

  /**
   * Generate the main blog post content
   */
  private async generateContent(articles: NewsArticle[], outline: string): Promise<string> {
    const articleDetails = articles.map((article, index) => 
      `[Source ${index + 1}] **${article.title}**\nAuthor: ${article.author || 'Unknown'}\nSource: ${article.source}\nURL: ${article.url}\nContent: ${article.content}\n---`
    ).join('\n\n');

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a technical blogger writing for developers and AI enthusiasts. Create an engaging, comprehensive blog post using the provided outline and sources.

          CRITICAL REQUIREMENTS:
          - **Proper Attribution**: Every claim, quote, or insight MUST reference the original source
          - Use format: "According to [Source Name](URL)" or "As reported by [Author] at [Source Name](URL)"
          - **Add Value**: Don't just summarize - provide insights, analysis, and connections
          - **Technical Depth**: Include code examples, technical explanations, and practical applications
          - **Reader-First**: Make complex topics accessible with clear explanations
          - **Diagram Placeholders**: Use {{DIAGRAM:description}} where visual aids would help
          
          Write in Markdown format with proper headings, code blocks, and formatting.`
        },
        {
          role: "user",
          content: `Outline:\n${outline}\n\nSource Articles:\n${articleDetails}`
        }
      ],
      max_tokens: 3000
    });

    return response.choices[0]?.message?.content || "";
  }

  /**
   * Generate relevant diagrams for the blog post
   */
  private async generateDiagrams(articles: NewsArticle[], outline: string): Promise<DiagramSpec[]> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a technical illustrator. Create diagram specifications that would help readers understand the AI concepts discussed in the articles.

          Generate Mermaid diagrams for:
          - System architectures
          - Process flows
          - Comparative analyses
          - Timeline visualizations
          - Concept relationships

          Respond with JSON array of diagrams: [{"type": "mermaid", "title": "Diagram Title", "description": "What this shows", "content": "mermaid code", "position": "top|middle|bottom"}]`
        },
        {
          role: "user",
          content: `Articles focus: ${articles.map(a => a.title).join(', ')}\n\nOutline: ${outline}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      return result.diagrams || [];
    } catch (error) {
      console.error("Error generating diagrams:", error);
      return [];
    }
  }

  /**
   * Generate metadata for the blog post
   */
  private async generateMetadata(articles: NewsArticle[], content: string): Promise<{
    title: string;
    excerpt: string;
    tags: string[];
    category: string;
    metaTitle: string;
    metaDescription: string;
  }> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Generate blog post metadata in JSON format:
          {
            "title": "Engaging blog post title",
            "excerpt": "2-sentence compelling summary",
            "tags": ["relevant", "tags", "array"],
            "category": "AI/LLM|Backend|Frontend|Hosting",
            "metaTitle": "SEO-optimized title (60 chars max)",
            "metaDescription": "SEO description (160 chars max)"
          }`
        },
        {
          role: "user",
          content: `Content: ${content.substring(0, 1000)}...\n\nSource articles: ${articles.map(a => a.title).join(', ')}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error generating metadata:", error);
      return {
        title: "Latest AI Developments",
        excerpt: "Exploring recent advances in artificial intelligence and their implications.",
        tags: ["AI", "Machine Learning"],
        category: "AI/LLM",
        metaTitle: "Latest AI Developments | Anuj's Blog",
        metaDescription: "Exploring recent advances in artificial intelligence and their implications for developers."
      };
    }
  }

  /**
   * Insert diagrams into the content at appropriate positions
   */
  private insertDiagrams(content: string, diagrams: DiagramSpec[]): string {
    let enhancedContent = content;

    diagrams.forEach((diagram, index) => {
      const diagramMarkdown = `

## ${diagram.title}

${diagram.description}

\`\`\`mermaid
${diagram.content}
\`\`\`

`;

      // Insert diagram based on position preference
      if (diagram.position === 'top') {
        const firstHeaderIndex = enhancedContent.indexOf('\n## ');
        if (firstHeaderIndex > -1) {
          enhancedContent = enhancedContent.slice(0, firstHeaderIndex) + diagramMarkdown + enhancedContent.slice(firstHeaderIndex);
        }
      } else if (diagram.position === 'middle') {
        const middleIndex = Math.floor(enhancedContent.length / 2);
        const nearestHeader = enhancedContent.indexOf('\n## ', middleIndex);
        if (nearestHeader > -1) {
          enhancedContent = enhancedContent.slice(0, nearestHeader) + diagramMarkdown + enhancedContent.slice(nearestHeader);
        }
      } else {
        // Bottom or inline
        enhancedContent += diagramMarkdown;
      }
    });

    return enhancedContent;
  }

  /**
   * Estimate reading time in minutes
   */
  private estimateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Convert generated blog post to database format
   */
  convertToPostData(generation: BlogPostGeneration): Partial<InsertPost> {
    return {
      title: generation.title,
      slug: generation.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
      excerpt: generation.excerpt,
      content: generation.content,
      tags: generation.tags,
      status: "draft", // Always start as draft for review
      readTime: generation.readTime,
      metaTitle: generation.metaTitle,
      metaDescription: generation.metaDescription,
      authorId: "ai-agent", // Special author ID for AI-generated content
      categoryId: this.getCategoryId(generation.category),
    };
  }

  private getCategoryId(categoryName: string): string {
    const categoryMap: Record<string, string> = {
      "AI/LLM": "cat-1",
      "Backend": "cat-2",
      "Frontend": "cat-3",
      "Hosting": "cat-4"
    };
    return categoryMap[categoryName] || "cat-1";
  }
}

export const contentAgent = new ContentAgent();