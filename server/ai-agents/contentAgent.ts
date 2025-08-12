import OpenAI from 'openai';
import type { NewsArticle } from './newsAgent';

export interface GeneratedContent {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  sources: Array<{
    title: string;
    url: string;
    author?: string;
    publication: string;
  }>;
  diagrams?: string[];
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  readTime?: number;
}

export class ContentAgent {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateBlogPost(article: NewsArticle, focusTopic?: string): Promise<GeneratedContent> {
    try {
      console.log(`Generating detailed blog post for: ${article.title}`);

      // Create source attribution
      const source = {
        title: article.title,
        url: article.url,
        publication: article.source,
        author: this.extractAuthor(article.content)
      };

      // Generate enhanced content for single article
      const prompt = this.buildSingleArticlePrompt(article, focusTopic);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert AI/ML technical writer and industry analyst for a professional blog. Create insightful, concise, high-quality blog posts that deliver maximum value with minimal content.

CONTENT PHILOSOPHY:
- QUALITY OVER QUANTITY: Be concise but comprehensive 
- SMART ANALYSIS: Draw intelligent inferences about industry implications
- STRATEGIC INSIGHTS: Connect developments to broader trends and competitive landscape
- ACTIONABLE INTELLIGENCE: Focus on practical implications for readers

ANALYSIS FRAMEWORK - Address these dimensions:
1. **Industry Impact**: How does this change the competitive landscape?
2. **Development Implications**: What does this mean for developers/researchers?
3. **Cost & Economics**: Financial implications, efficiency gains, market disruption
4. **Performance & Usability**: Technical improvements and user experience impact
5. **Strategic Connections**: How does this relate to other recent advances?
6. **Future Trajectory**: What does this signal for the industry's direction?

SEO OPTIMIZATION REQUIREMENTS:
- metaTitle: 50-60 characters, keyword-rich, compelling
- metaDescription: 150-160 characters, includes main keywords and value proposition
- title: Engaging, specific, includes primary keywords
- tags: Mix of broad (AI, Machine Learning) and specific (company names, technologies)

FORMAT: Respond with JSON containing:
- title: Engaging, SEO-optimized title (60-80 characters)
- content: Concise markdown blog post (800-1200 words) with smart analysis
- summary: 2-3 sentences highlighting key insights and implications
- tags: 5-8 strategic tags mixing broad and specific terms
- metaTitle: SEO-optimized title (50-60 chars)
- metaDescription: SEO description (150-160 chars)
- featuredImage: Suggest a relevant AI/tech image URL from Unsplash
- diagrams: Only if truly valuable (architecture, process flows, comparisons)

CONTENT STRUCTURE:
1. Lead with the core insight/implication
2. Technical context (brief but sufficient)
3. Industry analysis (competitive impact, market implications)  
4. Strategic connections to other developments
5. Future implications and takeaways
6. Proper source attribution at the end

WRITING STYLE:
- Start with impact/implications, not background
- Use specific data points and comparisons
- Connect dots between different developments
- Be authoritative but accessible
- Eliminate fluff and filler content`
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const generated = JSON.parse(completion.choices[0].message.content || '{}');

      // Fix double-wrapped Mermaid code blocks that break markdown parsing
      let content = generated.content || '';
      content = content.replace(/```mermaid\s*```mermaid/g, '```mermaid');
      content = content.replace(/```\s*```/g, '```');

      // Add proper tags based on content analysis
      const enhancedTags = this.enhanceTags(generated.tags || [], generated.content, article);
      
      // Calculate estimated read time
      const readTime = this.calculateReadTime(content);
      
      return {
        title: generated.title || article.title,
        content: content,
        summary: generated.summary || 'A detailed analysis of recent AI developments.',
        tags: enhancedTags,
        sources: [source],
        diagrams: generated.diagrams || [],
        featuredImage: generated.featuredImage || this.generateFeaturedImageUrl(generated.tags),
        metaTitle: generated.metaTitle || generated.title,
        metaDescription: generated.metaDescription || generated.summary,
        readTime: readTime
      };

    } catch (error) {
      console.error('Error generating blog post:', error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // New method for generating multiple posts
  async generateMultipleBlogPosts(articles: NewsArticle[], focusTopic?: string): Promise<GeneratedContent[]> {
    console.log(`Generating ${articles.length} individual blog posts...`);
    
    const posts: GeneratedContent[] = [];
    
    // Generate posts for each article individually
    for (const article of articles) {
      try {
        const post = await this.generateBlogPost(article, focusTopic);
        posts.push(post);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate post for article: ${article.title}`, error);
        // Continue with other articles
      }
    }
    
    return posts;
  }

  private buildSingleArticlePrompt(article: NewsArticle, focusTopic?: string): string {
    return `Analyze this AI news article and create a high-quality, insightful blog post:

**Article Details:**
Source: ${article.source}
Title: ${article.title}
URL: ${article.url}
Published: ${article.publishedAt}
Content: ${article.content}
Tags: ${article.tags.join(', ')}

${focusTopic ? `Special Focus: ${focusTopic}` : ''}

**Analysis Requirements:**
Transform this news into strategic intelligence by addressing:

🎯 **Core Impact**: Start with the main implication - why should readers care?
📊 **Industry Disruption**: How does this shift competitive dynamics?
💰 **Economic Implications**: Cost savings, efficiency gains, new revenue models?  
⚡ **Performance Breakthrough**: Technical improvements and usability advances?
🔗 **Strategic Connections**: How does this connect to other recent developments?
📈 **Future Trajectory**: What does this signal for industry direction?

**Content Guidelines:**
- 800-1200 words maximum - every word must add value
- Lead with implications, not background information
- Use specific data points and concrete examples
- Connect this development to broader industry trends
- Be authoritative yet accessible to technical professionals
- Include SEO-optimized metadata and featured image suggestions

**Structure Template:**
# [Impact-focused title highlighting the key implication]

Opening paragraph: Core insight and why it matters NOW

## Industry Transformation
How this changes the competitive landscape and market dynamics

## Technical Breakthrough  
Key innovations and performance improvements (keep concise)

## Strategic Implications
What this means for companies, developers, and the broader ecosystem

## Competitive Context
How this positions against other major players and recent developments

## Implementation Reality
Practical considerations for adoption and real-world deployment

## Future Outlook
Where this leads and what to watch for next

---
*Source: [Original Article Title](URL) - ${article.source}*

Make every sentence count. Deliver maximum insight per word.`;
  }

  private extractAuthor(content: string): string {
    // Simple author extraction - in production, this would be more sophisticated
    const authorPatterns = [
      /By ([A-Za-z\s]+)/i,
      /Author: ([A-Za-z\s]+)/i,
      /Written by ([A-Za-z\s]+)/i
    ];

    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }

    return '';
  }

  private addSourceAttribution(content: string, sources: GeneratedContent['sources']): string {
    let attributedContent = content;
    
    // Add sources section at the end
    const sourcesSection = `

## Sources and References

This article synthesizes information from the following sources:

${sources.map(source => `- **[${source.title}](${source.url})** - ${source.publication}${source.author ? ` by ${source.author}` : ''}`).join('\n')}

---

*This post was generated by AI to provide enhanced analysis and context of recent AI developments. All sources are properly attributed and linked above.*`;

    return attributedContent + sourcesSection;
  }

  private enhanceTags(originalTags: string[], content: string, article: NewsArticle): string[] {
    const tags = new Set(originalTags);
    const contentLower = content.toLowerCase();
    const titleLower = article.title.toLowerCase();
    
    // Add company-specific tags
    const companyTags = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic', 
      'google': 'Google',
      'microsoft': 'Microsoft',
      'meta': 'Meta',
      'nvidia': 'NVIDIA'
    };

    // Add model-specific tags
    const modelTags = {
      'gpt-4': 'GPT-4',
      'gpt-5': 'GPT-5', 
      'claude': 'Claude',
      'gemini': 'Gemini',
      'llama': 'LLaMA',
      'chatgpt': 'ChatGPT'
    };

    // Add technical concept tags
    const conceptTags = {
      'multimodal': 'Multimodal',
      'transformer': 'Transformers',
      'fine-tuning': 'Fine-tuning',
      'rag': 'RAG',
      'embedding': 'Embeddings',
      'training': 'Training',
      'inference': 'Inference',
      'api': 'API'
    };

    // Check content and title for relevant tags
    [...Object.entries(companyTags), ...Object.entries(modelTags), ...Object.entries(conceptTags)]
      .forEach(([keyword, tag]) => {
        if (contentLower.includes(keyword) || titleLower.includes(keyword)) {
          tags.add(tag);
        }
      });

    // Always include AI and Machine Learning as base tags
    tags.add('AI');
    tags.add('Machine Learning');

    // Add original article tags if relevant
    article.tags.forEach(tag => {
      if (tag.toLowerCase() !== 'artificial intelligence' && tag.toLowerCase() !== 'ai') {
        tags.add(tag);
      }
    });

    return Array.from(tags).slice(0, 8); // Limit to 8 tags
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private generateFeaturedImageUrl(tags: string[]): string {
    // Generate relevant Unsplash image URL based on content tags
    const aiImageKeywords = [
      'artificial-intelligence', 'machine-learning', 'neural-network', 
      'technology', 'computer-science', 'robotics', 'data-science'
    ];
    
    // Pick a relevant keyword based on tags
    let keyword = 'artificial-intelligence'; // default
    
    if (tags.some(tag => tag.toLowerCase().includes('vision') || tag.toLowerCase().includes('image'))) {
      keyword = 'computer-vision';
    } else if (tags.some(tag => tag.toLowerCase().includes('language') || tag.toLowerCase().includes('nlp'))) {
      keyword = 'natural-language-processing';
    } else if (tags.some(tag => tag.toLowerCase().includes('robot'))) {
      keyword = 'robotics';
    } else if (tags.some(tag => tag.toLowerCase().includes('data'))) {
      keyword = 'data-science';
    }
    
    return `https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80&${keyword}`;
  }

  async createDiagrams(diagramSuggestions: string[]): Promise<string[]> {
    try {
      const diagrams = [];
      
      for (const suggestion of diagramSuggestions.slice(0, 2)) { // Limit to 2 diagrams
        const prompt = `Create a Mermaid diagram for: ${suggestion}
        
        Make it technically accurate, clear, and educational. Use appropriate Mermaid syntax (flowchart, sequence, etc.).
        Return only the Mermaid code, no explanations.`;

        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a technical diagram expert. Create clear, accurate Mermaid diagrams that enhance understanding of AI/ML concepts."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });

        const diagramCode = completion.choices[0].message.content?.trim();
        if (diagramCode) {
          diagrams.push(diagramCode);
        }
      }

      return diagrams;
    } catch (error) {
      console.error('Error creating diagrams:', error);
      return []; // Return empty array if diagram generation fails
    }
  }

  async generateCustomBlogPost(topic: string): Promise<GeneratedContent> {
    try {
      console.log(`Generating custom blog post for topic: ${topic}`);

      const prompt = `You are an expert technical writer and industry analyst creating a comprehensive blog post about: "${topic}"

**Task**: Write an informative, well-researched blog post that provides value to readers interested in this topic.

**Content Requirements:**
- 1000-1500 words
- Professional, engaging tone
- Well-structured with clear headings
- Include practical insights and actionable information
- Draw from your knowledge to provide accurate, up-to-date information
- Include relevant examples where applicable

**Structure:**
1. Compelling introduction that hooks the reader
2. Main content organized with clear subheadings
3. Practical implications or applications
4. Current trends and future outlook (if applicable)
5. Conclusion that ties everything together

**SEO Requirements:**
- Create an engaging title (50-60 characters)
- Write a compelling meta description (150-160 characters)
- Suggest 4-6 relevant tags
- Include suggested featured image description

**Output Format:**
Provide the response as a JSON object with these fields:
{
  "title": "Blog post title",
  "content": "Full markdown content of the blog post",
  "summary": "Brief summary/excerpt (2-3 sentences)",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "metaTitle": "SEO optimized title",
  "metaDescription": "SEO meta description",
  "featuredImage": "Description of suggested featured image",
  "sources": [],
  "diagrams": ["Description of suggested diagram if applicable"]
}

Write about: ${topic}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system", 
            content: "You are an expert technical writer. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsedContent = JSON.parse(responseContent);
      
      // Validate the response structure
      const result: GeneratedContent = {
        title: parsedContent.title || `Blog Post: ${topic}`,
        content: parsedContent.content || '',
        summary: parsedContent.summary || '',
        tags: Array.isArray(parsedContent.tags) ? parsedContent.tags : [topic],
        sources: [], // No external sources for custom generation
        diagrams: Array.isArray(parsedContent.diagrams) ? parsedContent.diagrams : [],
        featuredImage: parsedContent.featuredImage || undefined,
        metaTitle: parsedContent.metaTitle || parsedContent.title,
        metaDescription: parsedContent.metaDescription || parsedContent.summary
      };

      console.log(`Custom blog post generated successfully for: ${topic}`);
      return result;

    } catch (error) {
      console.error('Error generating custom blog post:', error);
      
      // Fallback: Create a basic blog post structure
      return {
        title: `Understanding ${topic}`,
        content: `# Understanding ${topic}\n\nThis is a comprehensive guide to ${topic}.\n\n## Introduction\n\n${topic} is an important topic that deserves detailed exploration.\n\n## Key Concepts\n\nLet's dive into the fundamental concepts.\n\n## Conclusion\n\nIn conclusion, ${topic} continues to be a significant area of interest.`,
        summary: `A comprehensive guide to understanding ${topic} and its implications.`,
        tags: [topic, 'Guide', 'Technology'],
        sources: [],
        diagrams: [],
        metaTitle: `Understanding ${topic} - Complete Guide`,
        metaDescription: `Learn everything you need to know about ${topic} in this comprehensive guide.`
      };
    }
  }
}

export const contentAgent = new ContentAgent();