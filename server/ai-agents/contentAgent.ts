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
            content: `You are an expert AI/ML technical writer for a professional blog. Create detailed, insightful blog posts from single news articles.

CRITICAL REQUIREMENTS:
1. SINGLE FOCUS: Create one comprehensive blog post about ONE specific topic/article
2. DEEP ANALYSIS: Provide technical depth, implications, and expert insights
3. PROPER ATTRIBUTION: Credit the original source and author
4. TECHNICAL ACCURACY: Ensure all technical information is correct
5. STRUCTURED CONTENT: Use clear headings and logical progression
6. ACTIONABLE DIAGRAMS: Only suggest diagrams that add real value

FORMAT: Respond with JSON containing:
- title: Specific, engaging title about the main topic
- content: Full markdown blog post (1500-2500 words) with proper attribution
- summary: 2-3 sentence summary focusing on key insights
- tags: Specific, relevant tags (include company names, technologies, concepts)
- diagrams: Array of specific Mermaid diagram descriptions (only if truly helpful)

DIAGRAM GUIDELINES:
- Only suggest diagrams that illustrate complex concepts
- Be specific: "Flowchart showing the GPT-4 training pipeline"
- Don't suggest generic diagrams like "AI overview"

TAG GUIDELINES:
- Include specific technologies (GPT-4, Claude, Transformers)
- Include company names (OpenAI, Anthropic, Google)
- Include technical concepts (Multimodal, Fine-tuning, RAG)
- Use proper capitalization`
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

      // Add proper tags based on content analysis
      const enhancedTags = this.enhanceTags(generated.tags || [], generated.content, article);
      
      return {
        title: generated.title || article.title,
        content: generated.content || '',
        summary: generated.summary || 'A detailed analysis of recent AI developments.',
        tags: enhancedTags,
        sources: [source],
        diagrams: generated.diagrams || []
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
    return `Create a comprehensive, detailed blog post from this single AI news article:

**Original Article:**
Source: ${article.source}
Title: ${article.title}
URL: ${article.url}
Published: ${article.publishedAt}
Content: ${article.content}
Original Tags: ${article.tags.join(', ')}

${focusTopic ? `Focus Topic: ${focusTopic}` : 'Analyze this AI/ML development in depth'}

REQUIREMENTS:
1. Expand on the topic with technical depth and expert analysis
2. Explain implications for the AI industry and developers
3. Provide context about why this development matters
4. Include technical details and concepts for an informed audience
5. Credit the original source and author properly
6. Add insights and analysis not present in the original article
7. Structure with clear headings and logical flow
8. Only suggest diagrams that would genuinely help explain complex concepts
9. Use specific, accurate tags related to the technology and companies mentioned

EXAMPLE STRUCTURE:
# [Specific Title About the Main Topic]

## Introduction
Brief overview and why this matters

## Key Developments
Detailed explanation of what happened

## Technical Analysis
Deep dive into technical implications

## Industry Impact
What this means for the field

## Implementation Considerations
Practical aspects for developers/companies

## Future Implications
Where this leads

## Conclusion
Key takeaways

[Proper source attribution at the end]
7. Make the content more valuable than just reading the original articles

The post should be 1000-1500 words and demonstrate deep understanding of the AI/ML field.`;
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
}

export const contentAgent = new ContentAgent();