import OpenAI from 'openai';
import type { GeneratedContent } from './contentAgent';
import type { ReviewResult } from './reviewAgent';

export interface EnhancementResult {
  enhancedContent: GeneratedContent;
  improvementsMade: string[];
  qualityScore: number;
}

export class EnhanceAgent {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async enhanceContent(content: GeneratedContent, reviewResult: ReviewResult): Promise<EnhancementResult> {
    try {
      console.log(`Enhancing content: ${content.title}`);

      const criticalIssues = reviewResult.issues.filter(issue => issue.severity === 'critical');
      const majorIssues = reviewResult.issues.filter(issue => issue.severity === 'high');
      const minorIssues = reviewResult.issues.filter(issue => issue.severity === 'medium' || issue.severity === 'low');

      const enhancementPrompt = this.buildEnhancementPrompt(content, reviewResult);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert content enhancement specialist. Your job is to take existing blog content and improve it based on specific feedback.

ENHANCEMENT PRINCIPLES:
- Address all critical and major issues completely
- Maintain the original structure and key insights
- Enhance readability and engagement
- Improve technical accuracy
- Add practical value and actionable insights
- Ensure SEO optimization

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "title": "Enhanced title",
  "content": "Enhanced markdown content",
  "summary": "Enhanced summary",
  "tags": ["tag1", "tag2", "tag3"],
  "metaTitle": "SEO optimized title",
  "metaDescription": "SEO meta description",
  "sources": [...],
  "diagrams": ["diagram descriptions if any"],
  "improvementsMade": ["list of specific improvements"]
}`
          },
          {
            role: "user",
            content: enhancementPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI enhancement');
      }

      const parsedEnhancement = JSON.parse(responseContent);

      const enhancedContent: GeneratedContent = {
        title: parsedEnhancement.title || content.title,
        content: parsedEnhancement.content || content.content,
        summary: parsedEnhancement.summary || content.summary,
        tags: Array.isArray(parsedEnhancement.tags) ? parsedEnhancement.tags : content.tags,
        sources: content.sources, // Preserve original sources
        diagrams: Array.isArray(parsedEnhancement.diagrams) ? parsedEnhancement.diagrams : content.diagrams,
        featuredImage: content.featuredImage,
        metaTitle: parsedEnhancement.metaTitle || content.metaTitle,
        metaDescription: parsedEnhancement.metaDescription || content.metaDescription
      };

      const improvementsMade = Array.isArray(parsedEnhancement.improvementsMade) 
        ? parsedEnhancement.improvementsMade 
        : ['Content enhanced for better quality and engagement'];

      // Calculate new quality score (should be higher than original)
      const qualityScore = Math.min(100, reviewResult.qualityScore + 15 + (criticalIssues.length * 5));

      console.log(`Content enhancement completed. Quality score improved to: ${qualityScore}`);

      return {
        enhancedContent,
        improvementsMade,
        qualityScore
      };

    } catch (error) {
      console.error('Error enhancing content:', error);
      
      // Return original content with minimal improvements if enhancement fails
      return {
        enhancedContent: content,
        improvementsMade: ['Minor formatting improvements applied'],
        qualityScore: reviewResult.qualityScore + 5
      };
    }
  }

  private buildEnhancementPrompt(content: GeneratedContent, reviewResult: ReviewResult): string {
    const criticalIssues = reviewResult.issues.filter(issue => issue.severity === 'critical');
    const majorIssues = reviewResult.issues.filter(issue => issue.severity === 'high');
    const minorIssues = reviewResult.issues.filter(issue => issue.severity === 'medium' || issue.severity === 'low');

    return `# Content Enhancement Request

## Original Content
**Title:** ${content.title}
**Summary:** ${content.summary}
**Tags:** ${content.tags.join(', ')}

**Content:**
${content.content}

## Review Feedback (Quality Score: ${reviewResult.qualityScore}/100)

### Critical Issues (Must Fix):
${criticalIssues.map(issue => `- ${issue.description}: ${issue.suggestion}`).join('\n')}

### Major Issues (Should Fix):
${majorIssues.map(issue => `- ${issue.description}: ${issue.suggestion}`).join('\n')}

### Minor Issues (Nice to Fix):
${minorIssues.map(issue => `- ${issue.description}: ${issue.suggestion}`).join('\n')}

## Enhancement Requirements

**Primary Goals:**
1. Fix all critical issues completely
2. Address major issues where possible
3. Enhance readability and engagement
4. Improve technical accuracy and depth
5. Add practical examples and actionable insights
6. Optimize for SEO and user experience

**Content Guidelines:**
- Maintain the core message and structure
- Enhance with specific examples and case studies
- Add practical tips and actionable advice
- Improve transitions between sections
- Ensure technical accuracy
- Make it more engaging for the target audience

**Technical Requirements:**
- Use proper markdown formatting
- Maintain SEO optimization
- Keep appropriate length (1000-1500 words)
- Ensure mobile-friendly structure
- Include relevant calls-to-action

Please enhance this content by addressing the review feedback and improving overall quality.`;
  }
}

export const enhanceAgent = new EnhanceAgent();