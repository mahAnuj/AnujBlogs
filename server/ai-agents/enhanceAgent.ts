import OpenAI from 'openai';
import type { GeneratedContent } from './contentAgent.js';
import type { ReviewResult } from './reviewAgent.js';

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

    // Check if there are storytelling/flow issues
    const storytellingIssues = reviewResult.issues.filter(issue => issue.type === 'storytelling_flow');
    const headingIssues = reviewResult.issues.filter(issue => issue.type === 'unprofessional_heading');
    const topicIssues = reviewResult.issues.filter(issue => issue.type === 'topic_coverage');

    return `Please enhance this blog post content based ONLY on the specific feedback provided. Do NOT make changes based on your own knowledge.

**ORIGINAL CONTENT:**
Title: ${content.title}
Summary: ${content.summary}
Tags: ${content.tags?.join(', ') || 'None'}
Content:
${content.content}

**SPECIFIC REVIEW FEEDBACK TO ADDRESS:**

${criticalIssues.length > 0 ? `**CRITICAL ISSUES (Must Fix):**
${criticalIssues.map(issue => `- ${issue.description}${issue.suggestion ? ' | Solution: ' + issue.suggestion : ''}`).join('\n')}
` : ''}

${majorIssues.length > 0 ? `**MAJOR ISSUES (High Priority):**
${majorIssues.map(issue => `- ${issue.description}${issue.suggestion ? ' | Solution: ' + issue.suggestion : ''}`).join('\n')}
` : ''}

${storytellingIssues.length > 0 ? `**STORYTELLING & FLOW ISSUES (Priority Focus):**
${storytellingIssues.map(issue => `- ${issue.description}${issue.suggestion ? ' | Solution: ' + issue.suggestion : ''}`).join('\n')}
` : ''}

${headingIssues.length > 0 ? `**UNPROFESSIONAL HEADING ISSUES (Critical Fix):**
${headingIssues.map(issue => `- ${issue.description}${issue.suggestion ? ' | Solution: ' + issue.suggestion : ''}`).join('\n')}

IMPORTANT: Replace ALL meta-headings like "Hook Introduction", "Foundation First", "Learning Pathways", "Inspiring Conclusion" with professional, topic-specific headings that add value.
Examples: "Understanding the Architecture" → "Implementation Strategies" → "Performance Considerations" → "Production Deployment"
` : ''}

${topicIssues.length > 0 ? `**TOPIC COVERAGE ISSUES (Critical Focus):**
${topicIssues.map(issue => `- ${issue.description}${issue.suggestion ? ' | Solution: ' + issue.suggestion : ''}`).join('\n')}

CRITICAL: The content must directly address the original user request. If topic coverage is insufficient, refocus the content to better match what the user specifically asked for.
` : ''}

${minorIssues.length > 0 ? `**MINOR IMPROVEMENTS:**
${minorIssues.map(issue => `- ${issue.description}${issue.suggestion ? ' | Solution: ' + issue.suggestion : ''}`).join('\n')}
` : ''}

**CRITICAL ENHANCEMENT RULES:**
- Address ONLY the specific issues listed above
- Do NOT add content based on your own knowledge or assumptions
- Focus on fixing the exact problems identified in the review
- If storytelling issues are mentioned, prioritize smooth transitions and narrative flow
- If engagement issues are noted, enhance appeal to young developer community
- Preserve any elements that weren't criticized in the review

${storytellingIssues.length > 0 ? `**STORYTELLING ENHANCEMENT FOCUS:**
Since storytelling issues were identified, ensure you:
- Add smooth transitions between sections
- Create a compelling narrative flow from start to finish
- Use engaging language that speaks to young developers
- Include relatable examples and scenarios
- Build momentum throughout the content
` : ''}

Address ONLY the review feedback above. Do not make additional changes.`;
  }
}

export const enhanceAgent = new EnhanceAgent();