import { db } from './db';
import { users, categories, tags, posts } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database with sample data...');

    // Create sample user
    const [user] = await db.insert(users).values({
      name: 'Anuj Mahajan',
      username: 'anuj',
      email: 'anuj@example.com',
      bio: 'Full-stack developer passionate about AI, backend technologies, and modern web development.',
      avatar: null
    }).returning();

    // Create categories
    const categoriesData = [
      {
        id: 'cat-1',
        name: 'AI/LLM',
        slug: 'ai-llm',
        description: 'Articles about Artificial Intelligence and Large Language Models',
        color: '#8B5CF6'
      },
      {
        id: 'cat-2',
        name: 'Backend',
        slug: 'backend',
        description: 'Server-side development, APIs, and databases',
        color: '#10B981'
      },
      {
        id: 'cat-3',
        name: 'Frontend',
        slug: 'frontend',
        description: 'Client-side development, React, and modern web technologies',
        color: '#F59E0B'
      },
      {
        id: 'cat-4',
        name: 'Hosting',
        slug: 'hosting',
        description: 'Deployment, cloud services, and infrastructure',
        color: '#EF4444'
      }
    ];

    const createdCategories = await db.insert(categories).values(categoriesData).returning();

    // Create tags
    const tagsData = [
      { id: 'tag-1', name: 'React', slug: 'react' },
      { id: 'tag-2', name: 'TypeScript', slug: 'typescript' },
      { id: 'tag-3', name: 'OpenAI', slug: 'openai' },
      { id: 'tag-4', name: 'LangChain', slug: 'langchain' },
      { id: 'tag-5', name: 'Node.js', slug: 'nodejs' },
      { id: 'tag-6', name: 'PostgreSQL', slug: 'postgresql' },
      { id: 'tag-7', name: 'Vercel', slug: 'vercel' },
      { id: 'tag-8', name: 'Performance', slug: 'performance' }
    ];

    const createdTags = await db.insert(tags).values(tagsData).returning();

    // Create sample posts
    const postsData = [
      {
        id: 'post-1',
        title: 'Building Intelligent Apps with OpenAI GPT-4 and LangChain',
        slug: 'building-intelligent-apps-openai-gpt4-langchain',
        excerpt: 'Learn how to create powerful AI applications using GPT-4, LangChain, and modern development practices. This comprehensive guide covers everything from setup to deployment.',
        content: `# Building Intelligent Apps with OpenAI GPT-4 and LangChain

The rise of Large Language Models (LLMs) has revolutionized how we think about building applications. With tools like OpenAI's GPT-4 and LangChain, developers can now create sophisticated AI-powered applications with relative ease.

## Getting Started with LangChain

LangChain is a framework designed to simplify the development of applications using language models. It provides:

- **Prompt Templates**: Reusable templates for consistent prompt engineering
- **Chains**: Sequences of calls to LLMs or other utilities
- **Memory**: Stateful conversations and context management
- **Agents**: LLMs that can use tools and make decisions

## Setting Up Your Development Environment

\`\`\`bash
npm install langchain openai
# or
pip install langchain openai
\`\`\`

## Basic Implementation

Here's a simple example of creating a conversational AI:

\`\`\`typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
  temperature: 0.7,
});

const memory = new BufferMemory();
const chain = new ConversationChain({ llm: model, memory });

const response = await chain.call({
  input: "Hello, I'm building an AI app!"
});
\`\`\`

## Best Practices

1. **Prompt Engineering**: Craft clear, specific prompts
2. **Error Handling**: Always handle API failures gracefully
3. **Rate Limiting**: Respect OpenAI's rate limits
4. **Cost Management**: Monitor token usage carefully

Building with AI is exciting but requires careful consideration of costs, user experience, and ethical implications.`,
        featuredImage: null,
        authorId: user.id,
        categoryId: createdCategories[0].id, // AI/LLM
        tags: ['openai', 'langchain', 'typescript'],
        status: 'published',
        readTime: 8,
        views: 1250,
        likes: 45,
        metaTitle: 'Building Intelligent Apps with OpenAI GPT-4 and LangChain | Tech Blog',
        metaDescription: 'Complete guide to creating AI-powered applications using GPT-4, LangChain, and modern development practices. Learn setup, implementation, and best practices.',
        publishedAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: 'post-2',
        title: 'Modern React Patterns for Scalable Applications',
        slug: 'modern-react-patterns-scalable-applications',
        excerpt: 'Explore advanced React patterns including custom hooks, context optimization, and component composition for building maintainable large-scale applications.',
        content: `# Modern React Patterns for Scalable Applications

As React applications grow in complexity, it becomes crucial to adopt patterns that promote maintainability, reusability, and performance. Let's explore some modern React patterns that can help you build scalable applications.

## Custom Hooks: Encapsulating Logic

Custom hooks are one of the most powerful patterns in React for sharing stateful logic:

\`\`\`typescript
import { useState, useEffect } from 'react';

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
\`\`\`

## Component Composition

Instead of prop drilling, use composition:

\`\`\`tsx
// Instead of this
<Header user={user} notifications={notifications} />

// Do this
<Header>
  <UserProfile user={user} />
  <NotificationBell notifications={notifications} />
</Header>
\`\`\`

## Performance Optimization

Use React.memo and useMemo strategically:

\`\`\`typescript
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => /* expensive operation */);
  }, [data]);

  return <div>{/* render processedData */}</div>;
});
\`\`\`

These patterns help maintain clean, performant React applications as they scale.`,
        featuredImage: null,
        authorId: user.id,
        categoryId: createdCategories[2].id, // Frontend
        tags: ['react', 'typescript', 'performance'],
        status: 'published',
        readTime: 6,
        views: 890,
        likes: 32,
        metaTitle: 'Modern React Patterns for Scalable Applications | Tech Blog',
        metaDescription: 'Learn advanced React patterns including custom hooks, context optimization, and component composition for building maintainable applications.',
        publishedAt: new Date('2024-01-10T14:30:00Z')
      },
      {
        id: 'post-3',
        title: 'Building High-Performance APIs with Node.js and PostgreSQL',
        slug: 'high-performance-apis-nodejs-postgresql',
        excerpt: 'Discover techniques for building fast, scalable APIs using Node.js, PostgreSQL, and modern backend practices including connection pooling and query optimization.',
        content: `# Building High-Performance APIs with Node.js and PostgreSQL

Creating fast, scalable APIs requires careful attention to database design, query optimization, and proper use of Node.js patterns. Let's explore key techniques for building high-performance backend systems.

## Database Connection Pooling

Connection pooling is crucial for performance:

\`\`\`typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
\`\`\`

## Query Optimization

Use prepared statements and indexes effectively:

\`\`\`sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Use prepared statements
PREPARE get_user_posts AS 
SELECT * FROM posts 
WHERE author_id = $1 AND status = 'published'
ORDER BY published_at DESC;
\`\`\`

## Caching Strategies

Implement multiple layers of caching:

\`\`\`typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getCachedPosts(userId: string) {
  const cacheKey = \`user:\${userId}:posts\`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fallback to database
  const posts = await db.getUserPosts(userId);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(posts));
  
  return posts;
}
\`\`\`

## Monitoring and Observability

Always include proper logging and monitoring:

\`\`\`typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Log database query performance
const startTime = Date.now();
const result = await pool.query(sql, params);
const duration = Date.now() - startTime;

logger.info('Database query completed', {
  duration,
  query: sql,
  rowCount: result.rowCount
});
\`\`\`

These techniques will help you build APIs that can handle significant load while maintaining fast response times.`,
        featuredImage: null,
        authorId: user.id,
        categoryId: createdCategories[1].id, // Backend
        tags: ['nodejs', 'postgresql', 'performance'],
        status: 'published',
        readTime: 10,
        views: 756,
        likes: 28,
        metaTitle: 'High-Performance APIs with Node.js and PostgreSQL | Tech Blog',
        metaDescription: 'Learn techniques for building fast, scalable APIs using Node.js, PostgreSQL, connection pooling, and query optimization.',
        publishedAt: new Date('2024-01-08T09:15:00Z')
      },
      {
        id: 'post-4',
        title: 'Deploying Full-Stack Apps to Vercel: A Complete Guide',
        slug: 'deploying-fullstack-apps-vercel-complete-guide',
        excerpt: 'Step-by-step guide to deploying full-stack applications on Vercel, including serverless functions, database connections, and environment configuration.',
        content: `# Deploying Full-Stack Apps to Vercel: A Complete Guide

Vercel has become a popular choice for deploying modern web applications, especially those built with React, Next.js, and other frontend frameworks. This guide covers deploying full-stack applications with serverless functions.

## Project Structure for Vercel

Organize your project for optimal Vercel deployment:

\`\`\`
my-app/
├── api/              # Serverless functions
│   ├── users.ts
│   └── posts/
│       └── [id].ts
├── public/           # Static assets
├── src/              # Frontend code
└── vercel.json       # Vercel configuration
\`\`\`

## Serverless Functions

Create API endpoints as serverless functions:

\`\`\`typescript
// api/users.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    // Handle GET request
    const users = await getUsers();
    res.json(users);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
\`\`\`

## Environment Variables

Configure secrets in Vercel dashboard:

\`\`\`bash
# Add these in Vercel dashboard
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret
\`\`\`

## Database Connections

Use connection pooling for serverless environments:

\`\`\`typescript
import { Pool } from '@neondatabase/serverless';

// Create a single pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
\`\`\`

## Vercel Configuration

Optimize your \`vercel.json\`:

\`\`\`json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE" }
      ]
    }
  ]
}
\`\`\`

## Deployment Process

Deploy with the Vercel CLI:

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
\`\`\`

## Monitoring and Analytics

Vercel provides built-in analytics and logging. For advanced monitoring, consider integrating tools like:

- **Sentry** for error tracking
- **LogRocket** for user session replay
- **DataDog** for application performance monitoring

Following these patterns ensures your full-stack application deploys smoothly and performs well on Vercel's edge network.`,
        featuredImage: null,
        authorId: user.id,
        categoryId: createdCategories[3].id, // Hosting
        tags: ['vercel', 'nodejs', 'postgresql'],
        status: 'published',
        readTime: 7,
        views: 623,
        likes: 19,
        metaTitle: 'Deploying Full-Stack Apps to Vercel: Complete Guide | Tech Blog',
        metaDescription: 'Step-by-step guide to deploying full-stack applications on Vercel with serverless functions, database connections, and environment setup.',
        publishedAt: new Date('2024-01-05T16:45:00Z')
      }
    ];

    await db.insert(posts).values(postsData);

    console.log('Database seeded successfully!');
    console.log(`Created ${createdCategories.length} categories`);
    console.log(`Created ${createdTags.length} tags`);
    console.log(`Created ${postsData.length} posts`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}