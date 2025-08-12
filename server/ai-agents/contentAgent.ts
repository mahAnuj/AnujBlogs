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

  async generateBlogPost(articles: NewsArticle[], focusTopic?: string): Promise<GeneratedContent> {
    try {
      console.log(`Generating comprehensive blog post from ${articles.length} articles...`);

      // Create sources array with proper attribution
      const sources = articles.map(article => ({
        title: article.title,
        url: article.url,
        publication: article.source,
        author: this.extractAuthor(article.content)
      }));

      // Generate enhanced content with attribution
      const prompt = this.buildContentPrompt(articles, focusTopic);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert AI/ML technical writer for a professional blog. Your task is to create comprehensive, insightful content that goes beyond simple summarization. 

CRITICAL REQUIREMENTS:
1. ATTRIBUTION: Always credit original sources and authors throughout the content
2. ENHANCEMENT: Add value through analysis, context, and insights not present in original articles
3. TECHNICAL DEPTH: Provide technical explanations suitable for an informed audience
4. DIAGRAMS: Identify where Mermaid diagrams would enhance understanding
5. STRUCTURE: Use clear headings, subheadings, and logical flow

FORMAT: Respond with JSON containing:
- title: Engaging, SEO-friendly title
- content: Full markdown blog post with proper attribution
- summary: 2-3 sentence summary
- tags: Relevant tags array
- diagrams: Array of Mermaid diagram suggestions with descriptions

ATTRIBUTION STYLE:
- "According to [Author] from [Publication]..."
- "As reported by [Publication]..."
- "[Publication] notes that..."
- Always include source links: [original article](URL)`
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

      // Add source attribution to the generated content
      const contentWithSources = this.addSourceAttribution(generated.content, sources);
      
      return {
        title: generated.title || 'Latest AI Developments',
        content: contentWithSources,
        summary: generated.summary || 'A comprehensive overview of recent AI developments.',
        tags: generated.tags || ['AI', 'Machine Learning'],
        sources,
        diagrams: generated.diagrams || []
      };

    } catch (error) {
      console.error('Error generating blog post:', error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildContentPrompt(articles: NewsArticle[], focusTopic?: string): string {
    const articlesContent = articles.map(article => `
**Source: ${article.source}**
**Title: ${article.title}**
**URL: ${article.url}**
**Published: ${article.publishedAt}**
**Content Preview: ${article.content}**
**Tags: ${article.tags.join(', ')}**
---`).join('\n');

    return `Create a comprehensive blog post analyzing these recent AI developments:

${articlesContent}

${focusTopic ? `Focus Topic: ${focusTopic}` : 'General AI/ML Focus'}

REQUIREMENTS:
1. Create an engaging, informative blog post that synthesizes these developments
2. Add technical insights and analysis beyond what's in the original articles  
3. Credit all sources properly with author names and publication details
4. Include relevant technical context and implications
5. Suggest 1-2 Mermaid diagrams that would help readers understand key concepts
6. Use proper markdown formatting with headers, lists, and emphasis
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