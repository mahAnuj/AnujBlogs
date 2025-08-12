import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  rssUrl?: string;
  apiUrl?: string;
  selector?: string; // CSS selector for web scraping
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt: Date;
  author?: string;
  summary?: string;
  relevanceScore: number;
  tags: string[];
}

// Curated AI news sources
export const AI_NEWS_SOURCES: NewsSource[] = [
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/",
    rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    selector: "article"
  },
  {
    id: "arxiv-ai",
    name: "arXiv AI Papers",
    url: "https://arxiv.org/list/cs.AI/recent",
    selector: ".meta"
  },
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    url: "https://openai.com/blog/",
    rssUrl: "https://openai.com/blog/rss.xml",
    selector: "article"
  },
  {
    id: "anthropic-blog",
    name: "Anthropic Blog",
    url: "https://www.anthropic.com/news",
    selector: "article"
  },
  {
    id: "google-ai-blog",
    name: "Google AI Blog",
    url: "https://ai.googleblog.com/",
    rssUrl: "https://ai.googleblog.com/feeds/posts/default",
    selector: ".post"
  }
];

export class NewsAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = openai;
  }

  /**
   * Fetch latest AI news from multiple sources
   */
  async fetchLatestNews(hours: number = 24): Promise<NewsArticle[]> {
    console.log(`Fetching AI news from last ${hours} hours...`);
    
    const articles: NewsArticle[] = [];
    
    for (const source of AI_NEWS_SOURCES) {
      try {
        console.log(`Fetching from ${source.name}...`);
        const sourceArticles = await this.fetchFromSource(source, hours);
        articles.push(...sourceArticles);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
        continue;
      }
    }

    // Sort by relevance and recency
    return articles
      .sort((a, b) => {
        const recencyScore = (new Date().getTime() - a.publishedAt.getTime()) / (1000 * 60 * 60); // hours ago
        const aScore = a.relevanceScore - (recencyScore * 0.1);
        const bScore = b.relevanceScore - (new Date().getTime() - b.publishedAt.getTime()) / (1000 * 60 * 60) * 0.1;
        return bScore - aScore;
      })
      .slice(0, 20); // Top 20 most relevant recent articles
  }

  /**
   * Fetch articles from a specific news source
   */
  private async fetchFromSource(source: NewsSource, hours: number): Promise<NewsArticle[]> {
    // For demo purposes, we'll simulate fetching articles
    // In a real implementation, you would use RSS parsers, web scrapers, or APIs
    
    const mockArticles = await this.generateMockArticles(source);
    
    // Filter by time window
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return mockArticles.filter(article => article.publishedAt > cutoffDate);
  }

  /**
   * Generate realistic mock articles for demonstration
   * In production, replace with actual news fetching
   */
  private async generateMockArticles(source: NewsSource): Promise<NewsArticle[]> {
    const topics = [
      "GPT-5 breakthrough in reasoning capabilities",
      "New multimodal AI model surpasses human performance",
      "AI safety regulations proposed by government",
      "Open source LLM achieves state-of-the-art results",
      "Computer vision breakthrough in autonomous driving",
      "AI-powered drug discovery accelerates clinical trials",
      "Neural network compression techniques reduce model size",
      "Transformer architecture improvements boost efficiency",
      "AI ethics framework adopted by tech companies",
      "Quantum computing meets machine learning"
    ];

    const articles: NewsArticle[] = [];
    
    for (let i = 0; i < Math.min(3, topics.length); i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      try {
        // Generate realistic content using AI
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a tech journalist writing about AI developments. Create a realistic news article with proper journalistic structure."
            },
            {
              role: "user",
              content: `Write a 400-word news article about: "${topic}". Include specific details, quotes from experts, and technical insights. Format as: TITLE|||CONTENT|||SUMMARY|||TAGS`
            }
          ],
          max_tokens: 800
        });

        const content = response.choices[0]?.message?.content || "";
        const [title, articleContent, summary, tags] = content.split("|||");

        if (title && articleContent) {
          articles.push({
            id: `${source.id}-${Date.now()}-${i}`,
            title: title.trim(),
            content: articleContent.trim(),
            url: `${source.url}/${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            source: source.name,
            publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
            author: "AI Tech Reporter",
            summary: summary?.trim() || "",
            relevanceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0 relevance
            tags: tags?.split(",").map(tag => tag.trim()) || ["AI", "Technology"]
          });
        }
      } catch (error) {
        console.error(`Error generating article for topic "${topic}":`, error);
      }
    }

    return articles;
  }

  /**
   * Analyze article relevance and extract key information
   */
  async analyzeArticle(article: NewsArticle): Promise<NewsArticle> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an AI content analyst. Analyze the given article and provide:
            1. Relevance score (0-1) for AI/tech blog readers
            2. Key tags (comma-separated)
            3. Brief summary
            4. Technical complexity level (1-5)
            
            Respond in JSON format: {"relevanceScore": number, "tags": ["tag1", "tag2"], "summary": "text", "complexity": number}`
          },
          {
            role: "user",
            content: `Title: ${article.title}\n\nContent: ${article.content.substring(0, 1000)}...`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      return {
        ...article,
        relevanceScore: analysis.relevanceScore || article.relevanceScore,
        tags: analysis.tags || article.tags,
        summary: analysis.summary || article.summary,
      };
    } catch (error) {
      console.error("Error analyzing article:", error);
      return article;
    }
  }
}

export const newsAgent = new NewsAgent();