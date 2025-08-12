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
  private storage: any; // Will be injected

  constructor(storage?: any) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.storage = storage;
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

  private async researchTopic(topic: string): Promise<string> {
    try {
      console.log(`Researching current trends for: ${topic}`);
      
      // Use web search to get current information about the topic
      const searchQuery = `latest developments trends research ${topic} 2024 2025`;
      
      // For now, we'll use OpenAI with up-to-date knowledge
      // In the future, this could be enhanced with web_search tool
      const researchCompletion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a research assistant with access to current information. Provide the latest trends, developments, and key insights about the given topic. Focus on 2024-2025 developments, industry perspectives, and practical applications."
          },
          {
            role: "user", 
            content: `Research current trends, developments, and key insights about: ${topic}. Include:
            - Latest industry developments and breakthroughs
            - Key companies and research institutions leading in this area
            - Practical applications and real-world implementations
            - Future predictions and trends for 2024-2025
            - Expert opinions and market insights
            
            Provide authoritative sources and reference-worthy information.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return researchCompletion.choices[0]?.message?.content || `Recent developments in ${topic} continue to evolve rapidly with significant advances in 2024...`;
    } catch (error) {
      console.error('Error researching topic:', error);
      return `Recent developments in ${topic} continue to evolve rapidly with significant industry advances...`;
    }
  }

  private async findRelatedContent(topic: string): Promise<Array<{title: string; slug: string; excerpt: string}>> {
    try {
      // Search for related posts in our blog using the storage interface
      // This will help create internal links and show related content
      
      // Get all published posts
      const allPosts = await this.storage.getPosts({ status: 'published' });
      
      // Filter posts that might be related to the topic
      const relatedPosts = allPosts.filter((post: any) => {
        const topicLower = topic.toLowerCase();
        const titleLower = post.title.toLowerCase();
        const excerptLower = post.excerpt?.toLowerCase() || '';
        const tagsLower = post.tags?.map((tag: string) => tag.toLowerCase()).join(' ') || '';
        
        // Check if topic keywords appear in title, excerpt, or tags
        return titleLower.includes(topicLower) || 
               excerptLower.includes(topicLower) ||
               tagsLower.includes(topicLower) ||
               this.calculateTopicRelevance(topic, post.title + ' ' + (post.excerpt || '')) > 0.3;
      });
      
      // Limit to top 3 most relevant posts
      return relatedPosts.slice(0, 3).map((post: any) => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || ''
      }));
      
    } catch (error) {
      console.error('Error finding related content:', error);
      return [];
    }
  }

  private calculateTopicRelevance(topic: string, content: string): number {
    // Simple relevance calculation based on keyword overlap
    const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 2);
    const contentWords = content.toLowerCase().split(' ');
    
    let matches = 0;
    topicWords.forEach(word => {
      if (contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))) {
        matches++;
      }
    });
    
    return matches / topicWords.length;
  }

  private async performWebResearch(topic: string): Promise<string> {
    try {
      console.log(`Performing web research for: ${topic}`);
      
      // Extract key terms and concepts from the topic for targeted research
      const searchQueries = this.generateSearchQueries(topic);
      
      // Perform multiple searches for comprehensive coverage
      const searchResults = await Promise.all(
        searchQueries.map(async (query) => {
          try {
            const result = await webSearch(query);
            return `**Search: "${query}"**\n${result}\n\n`;
          } catch (error) {
            console.error(`Web search failed for query "${query}":`, error);
            return `**Search: "${query}"**\nNo current information found.\n\n`;
          }
        })
      );
      
      return searchResults.join('');
    } catch (error) {
      console.error('Web research failed:', error);
      return 'Unable to retrieve current web information for this topic.';
    }
  }

  private generateSearchQueries(topic: string): string[] {
    const topicLower = topic.toLowerCase();
    const queries = [`${topic} 2024 latest developments`];
    
    // Add specific queries based on topic content
    if (topicLower.includes('llm') || topicLower.includes('ai')) {
      queries.push(
        `${topic} current trends 2024`,
        `${topic} real world applications 2024`,
        `${topic} best practices 2024`
      );
      
      // Add specific term searches for AI topics
      if (topicLower.includes('mcp')) {
        queries.push('Model Context Protocol MCP AI 2024');
      }
      if (topicLower.includes('a2a')) {
        queries.push('Agent to Agent A2A protocol AI 2024');
      }
      if (topicLower.includes('rag')) {
        queries.push('RAG Retrieval Augmented Generation 2024');
      }
      if (topicLower.includes('prompt engineering')) {
        queries.push('prompt engineering techniques 2024');
      }
      if (topicLower.includes('fine-tuning') || topicLower.includes('fine tuning')) {
        queries.push('LLM fine-tuning methods 2024');
      }
      if (topicLower.includes('agents')) {
        queries.push('AI agents frameworks 2024');
      }
    }
    
    // Add general technology queries
    if (topicLower.includes('react') || topicLower.includes('javascript') || topicLower.includes('frontend')) {
      queries.push(`${topic} ecosystem 2024`, `${topic} frameworks tools 2024`);
    }
    
    // Limit to 4-5 queries to avoid overwhelming the system
    return queries.slice(0, 5);
  }

  private generateTopicChecklist(topic: string): string {
    const topicLower = topic.toLowerCase();
    
    // Generate topic-specific coverage requirements
    if (topicLower.includes('llm') || (topicLower.includes('prompt') && topicLower.includes('rag')) || 
        (topicLower.includes('fine') && topicLower.includes('tuning'))) {
      return `For LLM techniques and concepts, ensure coverage of:
- Clear definition of each concept mentioned (Prompt Engineering, Fine-Tuning, RAG, MCP, Agents, A2A)
- How each technique works (step-by-step breakdown like the reference example)
- When to use each approach (specific use cases and scenarios)
- Strengths and limitations of each method
- Real-world applications and examples
- Comparative analysis between techniques
- Implementation considerations and best practices
- Learning pathways and practical next steps
- Industry adoption and future trends

**SPECIFIC AI CONTEXT REQUIREMENTS:**
- **MCP (Model Context Protocol)**: Anthropic's 2024 standard for connecting AI to external tools, data sources, and systems
- **A2A (Agent-to-Agent Protocol)**: Google's 2024 protocol enabling AI agents to communicate and collaborate across platforms
- **AI Agents**: Autonomous systems that can perceive, decide, and act to achieve specific goals
- All concepts MUST be explained specifically in relation to Large Language Models and AI systems`;
    }
    
    if (topicLower.includes('artificial intelligence') || topicLower.includes('ai') && topicLower.includes('beginner')) {
      return `For AI beginner guides, ensure coverage of:
- What is AI? (Clear, simple definition)
- Main types/subsets of AI (Machine Learning, Deep Learning, NLP, Computer Vision, etc.)
- Real-world examples (recommendations, voice assistants, autonomous vehicles, medical diagnosis)
- Brief history (from 1950s to today, key milestones like Deep Blue, AlphaGo, ChatGPT)
- Current popularity drivers (big data, computing power, algorithmic breakthroughs)
- How AI impacts daily life and various industries
- Learning resources and next steps for beginners`;
    }
    
    if (topicLower.includes('machine learning') || topicLower.includes('ml')) {
      return `For Machine Learning topics, ensure coverage of:
- What is Machine Learning? (Definition and core concepts)
- Types of ML (supervised, unsupervised, reinforcement learning)
- Real-world applications and use cases
- Popular algorithms and when to use them
- Current tools and frameworks
- Learning path and practical next steps`;
    }
    
    if (topicLower.includes('react')) {
      return `For React topics, ensure coverage of:
- What React is and why it's popular
- Core concepts and how they work
- Real-world usage examples and case studies
- Current ecosystem and best practices
- Practical examples developers can try
- Learning resources and career applications`;
    }
    
    // Generic checklist for other topics
    return `For this topic, ensure coverage of:
- Clear definition and core concepts
- Main categories, types, or approaches
- Real-world examples and current usage
- Historical context and evolution
- Current trends and adoption drivers
- Practical applications and next steps`;
  }

  async generateCustomBlogPost(topic: string): Promise<GeneratedContent> {
    try {
      console.log(`Generating custom blog post for topic: ${topic}`);

      // Step 1: Perform comprehensive web research for latest information
      const webResearchData = await this.performWebResearch(topic);
      
      // Step 2: Research current trends (existing method)
      const trendsData = await this.researchTopic(topic);
      
      // Step 2: Get related content from our site for internal linking
      const relatedPosts = await this.findRelatedContent(topic);

      const prompt = `You are an expert technical writer creating a unique, valuable blog post about: "${topic}"

**Latest Web Research:**
${webResearchData}

**Additional Research Context:**
${trendsData}

**Related Content on Our Site:**
${relatedPosts.length > 0 ? relatedPosts.map(post => `- [${post.title}](${post.slug}): ${post.excerpt}`).join('\n') : 'No related content found.'}

**AUDIENCE: Young Developer Community**
Target passionate, curious developers who want to stay ahead of the curve. They value:
- Practical knowledge they can apply immediately
- Understanding the "why" behind technologies
- Stories and examples they can relate to
- Clear learning paths for skill development
- Engaging content that makes them want to read more

**STORYTELLING REQUIREMENTS:**
- Create a compelling narrative that flows naturally from section to section
- Use smooth transitions that connect ideas and maintain reader engagement
- Include relatable examples and scenarios for young developers
- Build excitement and curiosity throughout the content
- End with actionable next steps that inspire further learning

**CONTENT STRUCTURE - NARRATIVE FLOW:**
1. **Hook Introduction** - Start with an intriguing scenario or question that resonates with developers
2. **Foundation First** - Cover essential basics that fulfill the reader's primary intent (what, how, when, where)
3. **Progressive Revelation** - Build from fundamentals to advanced concepts with smooth transitions
4. **Real-World Context** - Show practical examples and current applications
5. **Historical Perspective** - Brief coverage of origins, key milestones, and popularity growth
6. **Unique Insights** - Provide correlations and perspectives not found elsewhere
7. **Learning Pathways** - Clear next steps and resources for continued learning
8. **Inspiring Conclusion** - End with motivation and practical actions readers can take

**FUNDAMENTAL COVERAGE REQUIREMENTS:**
- Always address the core intent of the topic first (e.g., "what is X?", "how does X work?")
- Include essential subtopics and classifications
- Provide real-world examples that readers can relate to
- Cover historical context when relevant (origins, evolution, key milestones)
- Explain current adoption and popularity drivers

**ENGAGEMENT PRINCIPLES:**
- Use conversational tone that speaks directly to developers
- Include code examples, project ideas, or technical scenarios
- Create "aha moments" by connecting dots between concepts
- Use analogies and metaphors that resonate with tech-minded readers
- Maintain curiosity and momentum throughout the entire piece

**Output Format (JSON):**
{
  "title": "Compelling, unique title (50-60 chars)",
  "content": "Full markdown content with internal links and references",
  "summary": "Value proposition summary (2-3 sentences)",
  "tags": ["relevant", "tags", "for", "topic"],
  "metaTitle": "SEO optimized title",
  "metaDescription": "Unique value proposition (150-160 chars)",
  "featuredImage": "Descriptive image suggestion",
  "sources": [{"title": "Source Title", "url": "https://...", "publication": "Publisher"}],
  "diagrams": ["Diagram descriptions that add unique visual value"],
  "internalLinks": ["Suggested internal links to our related content"],
  "externalReferences": ["Key external resources for deeper learning"]
}

**TOPIC-SPECIFIC COVERAGE CHECKLIST:**
${this.generateTopicChecklist(topic)}

**ONE-SHOT EXAMPLE REFERENCE:**
Here's an example of excellent blog structure for complex technical topics (RAG vs Fine-tuning):

TITLE: "RAG vs. Fine-Tuning: A Comparative Analysis of LLM Learning Techniques"

STRUCTURE:
1. **Engaging Introduction** - Sets context about LLM limitations and need for specialization
2. **Concept 1: RAG** 
   - Clear definition and purpose
   - Step-by-step how it works (6 detailed steps)
   - Specific use cases (chatbots, translation, medical research, education, legal)
   - Benefits (accuracy, reduced hallucinations, adaptability, transparency, cost-effectiveness)
3. **Concept 2: Fine-Tuning**
   - Clear definition and purpose  
   - Step-by-step process (8 detailed steps from pre-training to deployment)
   - Specific use cases (sentiment analysis, NER, personalized recommendations)
   - Benefits and considerations
4. **Comparative Analysis** - Direct comparison of approaches
5. **Practical Guidance** - When to use which approach
6. **Conclusion** - Summary and actionable next steps

KEY ELEMENTS:
- Each major concept gets comprehensive coverage (definition → how it works → use cases → benefits)
- Step-by-step breakdowns for technical processes
- Real-world applications with specific examples
- Comparative analysis highlighting trade-offs
- 2000+ words with substantial depth on each topic

**NOW CREATE YOUR BLOG:**
Using the above structure as inspiration, create a comprehensive, engaging blog post about: ${topic}

CRITICAL REQUIREMENTS:
- Follow the reference structure: clear sections for each concept
- Provide step-by-step explanations where applicable
- Include specific real-world use cases and examples
- Add comparative analysis between different approaches
- MINIMUM 2000 words with substantial depth (aim for 2500+ words)
- Address fundamentals first, then unique insights and correlations
- For unclear terms like MCP or A2A, research their AI context using current web sources
- Ensure ALL concepts are explained in relation to AI and LLMs specifically

**CURRENT AI TERMINOLOGY (2024-2025):**
- **MCP (Model Context Protocol)**: Anthropic's open standard for AI integration with external tools and data sources (November 2024)
- **A2A (Agent-to-Agent Protocol)**: Google's open communication protocol for AI agents to collaborate across platforms (April 2024)
- Both protocols are revolutionizing AI agent ecosystems and multi-agent systems`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system", 
            content: "You are an expert technical writer who creates unique, valuable content by correlating different aspects and providing actionable insights. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
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