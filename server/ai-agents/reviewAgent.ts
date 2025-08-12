import OpenAI from 'openai';
import type { GeneratedContent } from './contentAgent';

export interface ReviewResult {
  approved: boolean;
  issues: ReviewIssue[];
  suggestedFixes?: string[];
  qualityScore: number; // 0-100
}

export interface ReviewIssue {
  type: 'factual_error' | 'hallucination' | 'formatting_error' | 'diagram_error' | 'attribution_missing' | 'content_quality' | 'tag_missing';
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
      console.log('Starting content review process...');

      // Run multiple review checks in parallel
      const [
        factualCheck,
        diagramCheck,
        attributionCheck,
        qualityCheck,
        tagCheck
      ] = await Promise.all([
        this.checkFactualAccuracy(content),
        this.checkDiagramErrors(content),
        this.checkAttributionIntegrity(content),
        this.assessContentQuality(content),
        this.validateTags(content)
      ]);

      const allIssues: ReviewIssue[] = [
        ...factualCheck,
        ...diagramCheck,
        ...attributionCheck,
        ...qualityCheck,
        ...tagCheck
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

  private generateSuggestedFixes(issues: ReviewIssue[]): string[] {
    return issues
      .filter(issue => issue.suggestion)
      .map(issue => issue.suggestion!)
      .slice(0, 5); // Limit to top 5 suggestions
  }
}