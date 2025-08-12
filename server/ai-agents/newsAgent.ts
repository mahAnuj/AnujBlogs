export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  content: string;
  relevanceScore: number;
  tags: string[];
}

export class NewsAgent {
  private sources = [
    { name: 'TechCrunch', baseUrl: 'https://techcrunch.com', rssUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'arXiv', baseUrl: 'https://arxiv.org', searchUrl: 'https://export.arxiv.org/api/query' },
    { name: 'OpenAI Blog', baseUrl: 'https://openai.com/blog', rssUrl: 'https://openai.com/blog/rss.xml' },
    { name: 'Anthropic Blog', baseUrl: 'https://www.anthropic.com/news', rssUrl: 'https://www.anthropic.com/news/rss.xml' },
    { name: 'Google AI Blog', baseUrl: 'https://ai.googleblog.com', rssUrl: 'https://ai.googleblog.com/feeds/posts/default' }
  ];

  async fetchLatestNews(hoursBack: number = 24): Promise<NewsArticle[]> {
    try {
      console.log(`Fetching AI news from the last ${hoursBack} hours...`);
      
      // For development, return sample news articles
      const sampleArticles: NewsArticle[] = [
        {
          id: "news-1",
          title: "Breakthrough in Large Language Model Efficiency: New Architecture Reduces Training Costs by 70%",
          source: "TechCrunch",
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          url: "https://techcrunch.com/ai-breakthrough-efficiency",
          content: "Researchers have unveiled a revolutionary architecture for training large language models that significantly reduces computational requirements while maintaining performance...",
          relevanceScore: 0.95,
          tags: ["LLM", "Machine Learning", "Efficiency", "Training"]
        },
        {
          id: "news-2", 
          title: "OpenAI Announces GPT-5: Multimodal Capabilities and Improved Reasoning",
          source: "OpenAI Blog",
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          url: "https://openai.com/blog/gpt-5-announcement",
          content: "OpenAI today announced GPT-5, featuring enhanced multimodal understanding, improved reasoning capabilities, and better alignment with human values...",
          relevanceScore: 0.98,
          tags: ["GPT", "OpenAI", "Multimodal", "Reasoning"]
        },
        {
          id: "news-3",
          title: "Meta's New Vision-Language Model Surpasses Human Performance on Visual Question Answering",
          source: "arXiv",
          publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          url: "https://arxiv.org/abs/2024.vision.language",
          content: "A new vision-language model from Meta AI has achieved unprecedented performance on visual question answering benchmarks, surpassing human-level accuracy...",
          relevanceScore: 0.89,
          tags: ["Vision-Language", "Meta", "Benchmarks", "Computer Vision"]
        },
        {
          id: "news-4",
          title: "Anthropic's Constitutional AI: New Methods for AI Safety and Alignment",
          source: "Anthropic Blog", 
          publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
          url: "https://anthropic.com/constitutional-ai-methods",
          content: "Anthropic introduces novel constitutional AI techniques that improve AI safety through self-correction and principle-based training methodologies...",
          relevanceScore: 0.92,
          tags: ["AI Safety", "Constitutional AI", "Anthropic", "Alignment"]
        },
        {
          id: "news-5",
          title: "Google's Gemini Ultra Shows Promise in Scientific Research Applications",
          source: "Google AI Blog",
          publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago  
          url: "https://ai.googleblog.com/gemini-scientific-research",
          content: "Google's latest Gemini Ultra model demonstrates exceptional performance in scientific research tasks, from protein folding to climate modeling...",
          relevanceScore: 0.87,
          tags: ["Gemini", "Google", "Scientific Research", "Applications"]
        }
      ];

      // Filter articles within time range
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const filteredArticles = sampleArticles.filter(article => 
        new Date(article.publishedAt) > cutoffTime
      );

      console.log(`Found ${filteredArticles.length} relevant AI news articles`);
      return filteredArticles;

    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeRelevance(articles: NewsArticle[], focusTopic?: string): Promise<NewsArticle[]> {
    try {
      console.log(`Analyzing relevance${focusTopic ? ` for topic: ${focusTopic}` : ''}...`);
      
      // If a focus topic is provided, boost relevance scores for matching articles
      if (focusTopic) {
        const focusKeywords = focusTopic.toLowerCase().split(/[\s,]+/);
        
        return articles.map(article => {
          let relevanceBoost = 0;
          const searchText = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
          
          for (const keyword of focusKeywords) {
            if (searchText.includes(keyword)) {
              relevanceBoost += 0.1;
            }
          }
          
          return {
            ...article,
            relevanceScore: Math.min(article.relevanceScore + relevanceBoost, 1.0)
          };
        });
      }

      return articles;
    } catch (error) {
      console.error('Error analyzing relevance:', error);
      throw new Error(`Failed to analyze relevance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const newsAgent = new NewsAgent();