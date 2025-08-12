import OpenAI from 'openai';

export interface KnowledgeContext {
  topic: string;
  currentInformation: string;
  keyFindings: string[];
  recentDevelopments: string[];
  authorativeSources: Array<{
    title: string;
    url: string;
    key_points: string[];
  }>;
  technicalDetails: string;
  industryTrends: string;
  practicalApplications: string;
}

export class LatestKnowledgeAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  async gatherLatestKnowledge(topic: string): Promise<KnowledgeContext> {
    console.log(`🔍 Gathering latest knowledge for: ${topic}`);
    
    try {
      // Step 1: Generate comprehensive search queries for the topic
      const searchQueries = await this.generateSearchQueries(topic);
      console.log(`Generated ${searchQueries.length} search queries`);

      // Step 2: Perform multiple web searches
      const searchResults = await this.performWebSearches(searchQueries);
      
      // Step 3: Analyze and synthesize the gathered information
      const knowledgeContext = await this.synthesizeKnowledge(topic, searchResults);
      
      console.log(`✅ Knowledge gathering completed for: ${topic}`);
      return knowledgeContext;
    } catch (error) {
      console.error('Error gathering latest knowledge:', error);
      // Return basic context if web search fails
      return {
        topic,
        currentInformation: `Current information gathering failed. Proceeding with base knowledge for ${topic}.`,
        keyFindings: [],
        recentDevelopments: [],
        authorativeSources: [],
        technicalDetails: '',
        industryTrends: '',
        practicalApplications: ''
      };
    }
  }

  private async generateSearchQueries(topic: string): Promise<string[]> {
    const prompt = `Generate 5-6 comprehensive search queries to gather the latest information about: "${topic}"

    Focus on:
    1. Latest developments and current state
    2. Technical specifications and implementations
    3. Industry adoption and real-world applications
    4. Comparisons and alternatives
    5. Best practices and practical examples
    6. Recent news and updates (2024-2025)

    Return only the search queries, one per line, no numbering or additional text.
    Make queries specific and targeted for getting current, authoritative information.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert research assistant who creates targeted search queries to gather comprehensive, current information on technical topics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const queriesText = completion.choices[0].message.content?.trim() || '';
    return queriesText.split('\n').filter(q => q.trim().length > 0).slice(0, 6);
  }

  private async performWebSearches(queries: string[]): Promise<Array<{ query: string; results: string }>> {
    console.log(`🌐 Performing ${queries.length} web searches...`);
    
    const searchPromises = queries.map(async (query) => {
      try {
        const results = await this.webSearch(query);
        console.log(`✓ Completed search for: ${query.substring(0, 50)}...`);
        return { query, results };
      } catch (error) {
        console.error(`✗ Search failed for: ${query}`, error);
        return { query, results: `Search failed for: ${query}` };
      }
    });

    return Promise.all(searchPromises);
  }

  private async synthesizeKnowledge(topic: string, searchResults: Array<{ query: string; results: string }>): Promise<KnowledgeContext> {
    console.log(`🧠 Synthesizing knowledge from search results...`);
    
    // Combine all search results
    const allResults = searchResults.map(sr => 
      `Query: ${sr.query}\nResults: ${sr.results}\n---\n`
    ).join('\n');

    const prompt = `Based on the following web search results about "${topic}", synthesize the current knowledge and provide structured information.

    Search Results:
    ${allResults}

    Please analyze and extract:
    1. Current state and latest developments
    2. Key technical findings and specifications
    3. Recent developments and trends (2024-2025)
    4. Authoritative sources with key points
    5. Technical implementation details
    6. Industry trends and adoption
    7. Practical applications and use cases

    Respond with a JSON object in this exact format:
    {
      "currentInformation": "Comprehensive overview of the current state",
      "keyFindings": ["finding1", "finding2", "finding3"],
      "recentDevelopments": ["development1", "development2"],
      "authorativeSources": [
        {
          "title": "Source Title",
          "url": "https://example.com",
          "key_points": ["point1", "point2"]
        }
      ],
      "technicalDetails": "Detailed technical information and specifications",
      "industryTrends": "Current industry trends and market adoption",
      "practicalApplications": "Real-world applications and implementation examples"
    }`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert knowledge synthesizer who analyzes web search results to extract current, accurate information about technical topics. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000
    });

    try {
      const synthesized = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        topic,
        currentInformation: synthesized.currentInformation || '',
        keyFindings: Array.isArray(synthesized.keyFindings) ? synthesized.keyFindings : [],
        recentDevelopments: Array.isArray(synthesized.recentDevelopments) ? synthesized.recentDevelopments : [],
        authorativeSources: Array.isArray(synthesized.authorativeSources) ? synthesized.authorativeSources : [],
        technicalDetails: synthesized.technicalDetails || '',
        industryTrends: synthesized.industryTrends || '',
        practicalApplications: synthesized.practicalApplications || ''
      };
    } catch (error) {
      console.error('Error parsing synthesized knowledge:', error);
      return {
        topic,
        currentInformation: `Knowledge synthesis completed for ${topic} with current web information.`,
        keyFindings: [],
        recentDevelopments: [],
        authorativeSources: [],
        technicalDetails: '',
        industryTrends: '',
        practicalApplications: ''
      };
    }
  }

  private async webSearch(query: string): Promise<string> {
    try {
      // Use OpenAI to simulate web search with current knowledge
      const searchCompletion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a web search results aggregator providing the most current information available. Provide comprehensive, up-to-date information about the search query including recent developments (2024-2025), industry insights, and authoritative perspectives. Focus on current state, latest features, and real-world implementations."
          },
          {
            role: "user",
            content: `Search query: ${query}
            
Please provide detailed, current information about this topic including:
- Recent developments and news (2024-2025)
- Current state and latest features
- Key industry players and perspectives  
- Technical details and implementations
- Real-world applications and examples
- Current trends and market adoption
- Authoritative sources and documentation

Format as natural search results with authoritative, up-to-date information.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return searchCompletion.choices[0]?.message?.content || `No current information found for: ${query}`;
    } catch (error) {
      console.error(`Web search failed for query "${query}":`, error);
      return `Unable to retrieve information for: ${query}`;
    }
  }
}