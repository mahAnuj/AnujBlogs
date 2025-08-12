import OpenAI from 'openai';
import type { GeneratedContent } from './contentAgent';

export interface ReviewResult {
  approved: boolean;
  issues: ReviewIssue[];
  suggestedFixes?: string[];
  qualityScore: number; // 0-100
}

export interface ReviewIssue {
  type: 'factual_error' | 'hallucination' | 'formatting_error' | 'diagram_error' | 'attribution_missing' | 'content_quality' | 'tag_missing' | 'image_error' | 'styling_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
}

export class ReviewAgent {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async reviewContent(content: GeneratedContent): Promise<ReviewResult> {
    try {
      console.log('Starting comprehensive content review process...');

      // Run multiple review checks in parallel
      const [
        factualCheck,
        diagramCheck,
        attributionCheck,
        qualityCheck,
        tagCheck,
        stylingCheck,
        uniquenessCheck,
        valueCheck
      ] = await Promise.all([
        this.checkFactualAccuracy(content),
        this.checkDiagramErrors(content),
        this.checkAttributionIntegrity(content),
        this.assessContentQuality(content),
        this.validateTags(content),
        this.checkStylingIssues(content),
        this.assessContentUniqueness(content),
        this.assessReaderValue(content)
      ]);

      const allIssues: ReviewIssue[] = [
        ...factualCheck,
        ...diagramCheck,
        ...attributionCheck,
        ...qualityCheck,
        ...tagCheck,
        ...stylingCheck,
        ...uniquenessCheck,
        ...valueCheck
      ];

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(allIssues);
      
      // Determine if content should be approved
      const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
      const highIssues = allIssues.filter(issue => issue.severity === 'high');
      
      const approved = criticalIssues.length === 0 && highIssues.length <= 2 && qualityScore >= 70;

      const result: ReviewResult = {
        approved,
        issues: allIssues,
        qualityScore,
        suggestedFixes: approved ? undefined : this.generateSuggestedFixes(allIssues)
      };

      console.log(`Review completed: ${approved ? 'APPROVED' : 'REJECTED'} (Score: ${qualityScore}/100)`);
      if (!approved) {
        console.log(`Issues found: ${allIssues.length} (${criticalIssues.length} critical, ${highIssues.length} high)`);
      }

      return result;

    } catch (error) {
      console.error('Error during content review:', error);
      throw new Error(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkFactualAccuracy(content: GeneratedContent): Promise<ReviewIssue[]> {
    const prompt = `Review this blog post content for factual accuracy and potential hallucinations:

TITLE: ${content.title}
CONTENT: ${content.content}
SOURCES: ${content.sources.map(s => `${s.title} - ${s.publication}`).join(', ')}

Identify:
1. Claims that appear unsupported by the sources
2. Technical inaccuracies about AI/ML concepts
3. Potential hallucinations or fabricated information
4. Inconsistencies with known industry facts

Respond with JSON array of issues: [{"type": "factual_error|hallucination", "severity": "low|medium|high|critical", "description": "...", "location": "...", "suggestion": "..."}]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{"issues": []}');
      return result.issues || [];
    } catch (error) {
      console.warn('Factual accuracy check failed:', error);
      return [];
    }
  }

  private async checkDiagramErrors(content: GeneratedContent): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    // Check for diagram generation failures
    if (content.content.includes('Could you please provide more details') ||
        content.content.includes('error in your request') ||
        content.content.includes('I\'m sorry, but it seems')) {
      issues.push({
        type: 'diagram_error',
        severity: 'high',
        description: 'Diagram generation failed with error message visible in content',
        location: 'Diagram sections',
        suggestion: 'Remove failed diagram attempts and create working diagrams'
      });
    }

    // Check for invalid Mermaid syntax
    const mermaidMatches = content.content.match(/```mermaid\n([\s\S]*?)\n```/g);
    if (mermaidMatches) {
      for (const match of mermaidMatches) {
        const diagramCode = match.replace(/```mermaid\n|\n```/g, '');
        if (!this.isValidMermaidSyntax(diagramCode)) {
          issues.push({
            type: 'diagram_error',
            severity: 'medium',
            description: 'Invalid Mermaid diagram syntax detected',
            location: 'Mermaid diagram block',
            suggestion: 'Fix diagram syntax or remove invalid diagram'
          });
        }
      }
    }

    return issues;
  }

  private async checkAttributionIntegrity(content: GeneratedContent): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    // Check if sources are properly credited
    const sourceCount = content.sources.length;
    const attributionPatterns = [
      /According to .+ from .+/gi,
      /As reported by .+/gi,
      /.+ notes that/gi,
      /\[.+\]\(.+\)/gi // Links
    ];

    let attributionCount = 0;
    attributionPatterns.forEach(pattern => {
      const matches = content.content.match(pattern);
      if (matches) attributionCount += matches.length;
    });

    if (sourceCount > 0 && attributionCount < sourceCount) {
      issues.push({
        type: 'attribution_missing',
        severity: 'high',
        description: `Insufficient source attribution: ${attributionCount} attributions for ${sourceCount} sources`,
        suggestion: 'Add proper attribution for all sources used'
      });
    }

    return issues;
  }

  private async assessContentQuality(content: GeneratedContent): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    // Check content length
    if (content.content.length < 800) {
      issues.push({
        type: 'content_quality',
        severity: 'medium',
        description: 'Content appears too short for a comprehensive blog post',
        suggestion: 'Expand content with more analysis and insights'
      });
    }

    // Check for generic/shallow content
    const shallowIndicators = [
      'Recent developments',
      'Latest trends',
      'In conclusion',
      'To summarize'
    ];

    const shallowCount = shallowIndicators.reduce((count, indicator) => {
      return count + (content.content.toLowerCase().includes(indicator.toLowerCase()) ? 1 : 0);
    }, 0);

    if (shallowCount > 2) {
      issues.push({
        type: 'content_quality',
        severity: 'medium',
        description: 'Content contains generic language patterns',
        suggestion: 'Add more specific technical insights and analysis'
      });
    }

    return issues;
  }

  private async validateTags(content: GeneratedContent): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    // Check for specific important tags
    const contentLower = content.content.toLowerCase();
    const suggestedTags: string[] = [];

    // AI/ML specific tags
    if (contentLower.includes('openai') && !content.tags.some(tag => tag.toLowerCase().includes('openai'))) {
      suggestedTags.push('OpenAI');
    }
    if (contentLower.includes('gpt') && !content.tags.some(tag => tag.toLowerCase().includes('gpt'))) {
      suggestedTags.push('GPT');
    }
    if (contentLower.includes('anthropic') && !content.tags.some(tag => tag.toLowerCase().includes('anthropic'))) {
      suggestedTags.push('Anthropic');
    }
    if (contentLower.includes('claude') && !content.tags.some(tag => tag.toLowerCase().includes('claude'))) {
      suggestedTags.push('Claude');
    }
    if (contentLower.includes('transformer') && !content.tags.some(tag => tag.toLowerCase().includes('transformer'))) {
      suggestedTags.push('Transformers');
    }
    if (contentLower.includes('multimodal') && !content.tags.some(tag => tag.toLowerCase().includes('multimodal'))) {
      suggestedTags.push('Multimodal');
    }

    if (suggestedTags.length > 0) {
      issues.push({
        type: 'tag_missing',
        severity: 'low',
        description: `Missing relevant tags: ${suggestedTags.join(', ')}`,
        suggestion: `Add tags: ${suggestedTags.join(', ')}`
      });
    }

    return issues;
  }

  private isValidMermaidSyntax(diagramCode: string): boolean {
    // Basic validation for common Mermaid diagram types
    const validDiagramTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'gitgraph', 'erDiagram', 'journey'];
    const trimmedCode = diagramCode.trim();
    
    if (trimmedCode.length === 0) return false;
    
    const firstLine = trimmedCode.split('\n')[0].trim();
    return validDiagramTypes.some(type => firstLine.startsWith(type));
  }

  private calculateQualityScore(issues: ReviewIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  private async checkStylingIssues(content: GeneratedContent): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    try {
      // Check if featured image URL is valid
      if (content.featuredImage) {
        try {
          const response = await fetch(content.featuredImage, { method: 'HEAD' });
          if (!response.ok) {
            issues.push({
              type: 'image_error',
              severity: 'high',
              description: `Featured image URL returns ${response.status} error and will display as broken`,
              location: 'featuredImage',
              suggestion: 'Replace with a working image URL or remove the featuredImage property'
            });
          }
        } catch (error) {
          issues.push({
            type: 'image_error',
            severity: 'high',
            description: 'Featured image URL is unreachable and will display as broken',
            location: 'featuredImage',
            suggestion: 'Replace with a working image URL or remove the featuredImage property'
          });
        }
      }

      // Check for any inline image links in content that might be broken
      const imageRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
      let match;
      while ((match = imageRegex.exec(content.content)) !== null) {
        const imageUrl = match[2];
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (!response.ok) {
            issues.push({
              type: 'image_error',
              severity: 'medium',
              description: `Inline image "${match[1] || 'untitled'}" returns ${response.status} error`,
              location: `content (${imageUrl})`,
              suggestion: 'Replace with a working image URL or remove the image'
            });
          }
        } catch (error) {
          issues.push({
            type: 'image_error',
            severity: 'medium',
            description: `Inline image "${match[1] || 'untitled'}" is unreachable`,
            location: `content (${imageUrl})`,
            suggestion: 'Replace with a working image URL or remove the image'
          });
        }
      }

      // Check for potential formatting issues in markdown
      if (content.content.includes('```mermaid') && content.content.includes('flowchart TD')) {
        // This is good - mermaid diagrams should be properly formatted
      } else if (content.content.includes('```') && !content.content.match(/```\w+/g)) {
        issues.push({
          type: 'formatting_error',
          severity: 'low',
          description: 'Code blocks found without language specification',
          location: 'content',
          suggestion: 'Add language specification to code blocks (e.g., ```javascript, ```python)'
        });
      }

    } catch (error) {
      console.error('Error checking styling issues:', error);
    }

    return issues;
  }

  private generateSuggestedFixes(issues: ReviewIssue[]): string[] {
    return issues
      .filter(issue => issue.suggestion)
      .map(issue => issue.suggestion!)
      .slice(0, 5); // Limit to top 5 suggestions
  }

  private async assessContentUniqueness(content: GeneratedContent): Promise<ReviewIssue[]> {
    try {
      const prompt = `Evaluate this blog content for uniqueness and originality:

**Title:** ${content.title}
**Content:** ${content.content}

**Assessment Criteria:**
1. Does this provide a unique perspective or angle not commonly found elsewhere?
2. Does it correlate different aspects or synthesize information in novel ways?
3. Are there original insights that add new value to the topic?
4. Does it avoid rehashing common knowledge without adding value?
5. Does it provide practical applications or examples not typically covered?

**Response Format:**
Provide specific issues with suggestions for improvement. Focus on areas where the content lacks uniqueness or simply restates common knowledge.

Rate the uniqueness on a scale of 1-10 and explain specific areas that need improvement.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a content uniqueness expert. Identify areas where content lacks originality and provide specific suggestions for creating unique value."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const response = completion.choices[0]?.message?.content || '';
      const issues: ReviewIssue[] = [];

      // Parse the response for specific uniqueness issues
      if (response.toLowerCase().includes('lacks uniqueness') || response.toLowerCase().includes('common knowledge')) {
        issues.push({
          type: 'content_quality',
          severity: 'high',
          description: 'Content lacks uniqueness - appears to rehash commonly available information',
          suggestion: 'Add unique insights, correlate different perspectives, or provide novel synthesis of concepts'
        });
      }

      if (response.toLowerCase().includes('superficial') || response.toLowerCase().includes('surface level')) {
        issues.push({
          type: 'content_quality',
          severity: 'medium',
          description: 'Content provides only surface-level treatment of the topic',
          suggestion: 'Dive deeper into specific aspects and provide expert-level insights'
        });
      }

      return issues;
    } catch (error) {
      console.error('Error assessing content uniqueness:', error);
      return [];
    }
  }

  private async assessReaderValue(content: GeneratedContent): Promise<ReviewIssue[]> {
    try {
      const prompt = `Evaluate this blog content for reader value and practical utility:

**Title:** ${content.title}
**Content:** ${content.content}

**Assessment Criteria:**
1. Does this provide actionable insights readers can immediately apply?
2. Does it solve real problems or answer important questions?
3. Does it provide clear learning pathways for different skill levels?
4. Are there practical examples and real-world applications?
5. Does it connect theory to practice effectively?
6. Does it provide resources for further learning?
7. Is the content structured for easy comprehension and implementation?

**Response Format:**
Identify specific areas where the content fails to provide sufficient value to readers. Focus on practical applicability and actionable insights.

Rate the reader value on a scale of 1-10 and explain what would make it more valuable.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a content value expert. Assess whether content provides practical, actionable value to readers and suggest improvements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const response = completion.choices[0]?.message?.content || '';
      const issues: ReviewIssue[] = [];

      // Parse the response for value-related issues
      if (response.toLowerCase().includes('lacks practical') || response.toLowerCase().includes('not actionable')) {
        issues.push({
          type: 'content_quality',
          severity: 'high',
          description: 'Content lacks practical, actionable insights for readers',
          suggestion: 'Add specific steps, examples, or implementations that readers can follow'
        });
      }

      if (response.toLowerCase().includes('too theoretical') || response.toLowerCase().includes('abstract')) {
        issues.push({
          type: 'content_quality',
          severity: 'medium',
          description: 'Content is too theoretical without practical application',
          suggestion: 'Include real-world examples, case studies, or step-by-step implementations'
        });
      }

      if (response.toLowerCase().includes('missing resources') || response.toLowerCase().includes('no references')) {
        issues.push({
          type: 'attribution_missing',
          severity: 'medium',
          description: 'Content lacks references to authoritative sources for deeper learning',
          suggestion: 'Add links to authoritative sources, documentation, or advanced learning materials'
        });
      }

      return issues;
    } catch (error) {
      console.error('Error assessing reader value:', error);
      return [];
    }
  }
}