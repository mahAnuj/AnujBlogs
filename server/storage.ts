import { type User, type InsertUser, type Category, type InsertCategory, type Tag, type InsertTag, type Post, type InsertPost, type UpdatePost, type Comment, type InsertComment, type PostWithDetails, type CommentWithReplies } from "@shared/schema";
import { randomUUID } from "crypto";


export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Tags
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;

  // Posts
  getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]>;
  getPost(id: string): Promise<PostWithDetails | undefined>;
  getPostBySlug(slug: string): Promise<PostWithDetails | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: UpdatePost): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  incrementPostViews(id: string): Promise<void>;
  incrementPostLikes(id: string): Promise<void>;

  // Comments
  getCommentsByPost(postId: string): Promise<CommentWithReplies[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  incrementCommentLikes(id: string): Promise<void>;
  approveComment(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private tags: Map<string, Tag>;
  private posts: Map<string, Post>;
  private comments: Map<string, Comment>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.tags = new Map();
    this.posts = new Map();
    this.comments = new Map();

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: "user-1",
      username: "anujmahajan",
      email: "anuj@anujmahajan.dev",
      name: "Anuj Mahajan",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create AI system user
    const aiUser: User = {
      id: "ai-system",
      username: "ai-system", 
      email: "ai@anujblog.ai",
      name: "AI Content Generator",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(aiUser.id, aiUser);

    // Create categories
    const categories: Category[] = [
      {
        id: "cat-1",
        name: "AI/LLM",
        slug: "ai-llm",
        description: "Artificial Intelligence and Large Language Models",
        color: "#8B5CF6",
        createdAt: new Date(),
      },
      {
        id: "cat-2",
        name: "Backend",
        slug: "backend",
        description: "Server-side development and architecture",
        color: "#10B981",
        createdAt: new Date(),
      },
      {
        id: "cat-3",
        name: "Frontend",
        slug: "frontend",
        description: "Client-side development and frameworks",
        color: "#3B82F6",
        createdAt: new Date(),
      },
      {
        id: "cat-4",
        name: "Hosting",
        slug: "hosting",
        description: "Deployment and hosting solutions",
        color: "#F59E0B",
        createdAt: new Date(),
      },
    ];

    categories.forEach(cat => this.categories.set(cat.id, cat));

    // Create tags
    const tags: Tag[] = [
      { id: "tag-1", name: "React", slug: "react", createdAt: new Date() },
      { id: "tag-2", name: "Node.js", slug: "nodejs", createdAt: new Date() },
      { id: "tag-3", name: "TypeScript", slug: "typescript", createdAt: new Date() },
      { id: "tag-4", name: "Docker", slug: "docker", createdAt: new Date() },
      { id: "tag-5", name: "AWS", slug: "aws", createdAt: new Date() },
      { id: "tag-6", name: "Next.js", slug: "nextjs", createdAt: new Date() },
    ];

    tags.forEach(tag => this.tags.set(tag.id, tag));

    // Create sample blog posts
    const samplePosts: Post[] = [
      {
        id: "post-1",
        title: "Building Intelligent Apps with OpenAI GPT-4 and LangChain",
        slug: "building-intelligent-apps-openai-gpt4-langchain",
        excerpt: "Learn how to create powerful AI applications using GPT-4, LangChain, and modern development practices. This comprehensive guide covers everything from setup to deployment.",
        content: `# Building Intelligent Apps with OpenAI GPT-4 and LangChain

The rise of Large Language Models (LLMs) has revolutionized how we think about building applications. With tools like OpenAI's GPT-4 and LangChain, developers can now create sophisticated AI-powered applications with relative ease.

## Getting Started with LangChain

LangChain is a framework designed to simplify the development of applications using language models. It provides:

- **Prompt Templates**: Reusable templates for consistent prompt engineering
- **Chains**: Sequences of calls to LLMs or other utilities
- **Memory**: Stateful conversations and context management
- **Agents**: LLM-driven decision making

\`\`\`typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage } from "langchain/schema";

const chat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
  temperature: 0.7,
});

const response = await chat.call([
  new HumanMessage("Explain quantum computing in simple terms")
]);
\`\`\`

## Advanced Features

### Vector Embeddings and Semantic Search

One of the most powerful features is the ability to work with vector embeddings:

\`\`\`python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.document_loaders import TextLoader

# Load documents
loader = TextLoader('documents.txt')
documents = loader.load()

# Create embeddings
embeddings = OpenAIEmbeddings()
db = Chroma.from_documents(documents, embeddings)

# Semantic search
docs = db.similarity_search("What is machine learning?")
\`\`\`

### Building Conversational Agents

Creating intelligent chatbots has never been easier:

\`\`\`typescript
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory();
const chain = new ConversationChain({
  llm: chat,
  memory: memory,
});

// Stateful conversation
await chain.call({ input: "Hi, I'm building a web app" });
await chain.call({ input: "What frontend framework should I use?" });
\`\`\`

## Best Practices

1. **Prompt Engineering**: Craft clear, specific prompts
2. **Error Handling**: Always handle API failures gracefully
3. **Rate Limiting**: Respect API rate limits
4. **Cost Optimization**: Monitor token usage and costs
5. **Security**: Never expose API keys client-side

## Deployment Considerations

When deploying AI-powered applications, consider:

- **Latency**: LLM calls can be slow, implement proper loading states
- **Caching**: Cache responses where appropriate
- **Monitoring**: Track usage, costs, and performance
- **Fallbacks**: Have backup plans when the AI service is unavailable

The combination of GPT-4 and LangChain opens up incredible possibilities for building intelligent applications. Start experimenting today!`,
        featuredImage: null,
        authorId: "user-1",
        categoryId: "cat-1",
        tags: ["typescript", "ai", "gpt4", "langchain"],
        status: "published",
        readTime: 8,
        views: 156,
        likes: 23,
        metaTitle: "Building AI Apps with GPT-4 and LangChain | TechStack Blog",
        metaDescription: "Learn how to create powerful AI applications using GPT-4, LangChain, and modern development practices. Complete guide with code examples.",
        publishedAt: new Date("2024-01-15T10:00:00Z"),
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      },
      {
        id: "post-2",
        title: "Modern Backend Architecture: From Monolith to Microservices",
        slug: "modern-backend-architecture-monolith-microservices",
        excerpt: "Explore the evolution of backend architecture patterns, from traditional monoliths to modern microservices. Learn when and how to make the transition.",
        content: `# Modern Backend Architecture: From Monolith to Microservices

The backend architecture landscape has evolved dramatically over the past decade. Understanding when and how to transition from monolithic architectures to microservices is crucial for building scalable applications.

## Understanding Monolithic Architecture

A monolithic architecture packages the entire application as a single deployable unit:

\`\`\`
┌─────────────────────────┐
│    Monolithic App       │
├─────────────────────────┤
│  UI Layer              │
│  Business Logic        │
│  Data Access Layer     │
│  Database              │
└─────────────────────────┘
\`\`\`

### Advantages of Monoliths

- **Simplicity**: Easy to develop, test, and deploy initially
- **Performance**: No network latency between components
- **Consistency**: Single codebase and technology stack
- **Debugging**: Easier to trace issues across the entire application

### Node.js Monolith Example

\`\`\`typescript
// app.ts - Express.js monolith
import express from 'express';
import { userRoutes } from './routes/users';
import { orderRoutes } from './routes/orders';
import { paymentRoutes } from './routes/payments';

const app = express();

app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(3000, () => {
  console.log('Monolith running on port 3000');
});
\`\`\`

## Transitioning to Microservices

Microservices break down the application into smaller, independently deployable services:

\`\`\`
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ User Service │  │Order Service │  │Payment Service│
├──────────────┤  ├──────────────┤  ├──────────────┤
│   Database   │  │   Database   │  │   Database   │
└──────────────┘  └──────────────┘  └──────────────┘
\`\`\`

### When to Consider Microservices

1. **Team Size**: When you have multiple teams working on different features
2. **Scalability**: Different components have varying load requirements
3. **Technology Diversity**: Need different tech stacks for different services
4. **Independent Deployment**: Want to deploy features independently

### Microservice Implementation

\`\`\`typescript
// user-service/server.ts
import express from 'express';
import { connectDatabase } from './database';

const app = express();

app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(user);
});

app.listen(3001, () => {
  console.log('User service running on port 3001');
});
\`\`\`

## Communication Patterns

### Synchronous Communication

\`\`\`typescript
// API Gateway pattern
import axios from 'axios';

class OrderService {
  async createOrder(orderData: OrderData) {
    // Call user service
    const user = await axios.get(\`\${USER_SERVICE}/users/\${orderData.userId}\`);
    
    // Call payment service
    const payment = await axios.post(\`\${PAYMENT_SERVICE}/charge\`, {
      amount: orderData.total,
      customerId: user.data.id
    });
    
    // Create order
    return this.orderRepository.create({
      ...orderData,
      paymentId: payment.data.id
    });
  }
}
\`\`\`

### Asynchronous Communication

\`\`\`typescript
// Event-driven architecture with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Publisher
class OrderService {
  async createOrder(orderData: OrderData) {
    const order = await this.orderRepository.create(orderData);
    
    // Publish event
    await redis.publish('order.created', JSON.stringify({
      orderId: order.id,
      userId: order.userId,
      total: order.total
    }));
    
    return order;
  }
}

// Subscriber
class EmailService {
  async init() {
    await redis.subscribe('order.created');
    redis.on('message', this.handleOrderCreated.bind(this));
  }
  
  async handleOrderCreated(channel: string, message: string) {
    const event = JSON.parse(message);
    await this.sendOrderConfirmation(event.userId, event.orderId);
  }
}
\`\`\`

## Deployment and DevOps

### Docker Containerization

\`\`\`dockerfile
# Dockerfile for microservice
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Kubernetes Orchestration

\`\`\`yaml
# k8s/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
\`\`\`

## Challenges and Solutions

### Data Consistency

- **Problem**: Distributed transactions across services
- **Solution**: Saga pattern, eventual consistency, CQRS

### Service Discovery

- **Problem**: Services need to find each other
- **Solution**: Service mesh (Istio), API Gateway, DNS-based discovery

### Monitoring and Observability

\`\`\`typescript
// Distributed tracing with OpenTelemetry
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('user-service');

app.get('/users/:id', async (req, res) => {
  const span = tracer.startSpan('get-user');
  
  try {
    const user = await userRepository.findById(req.params.id);
    span.setAttributes({ 'user.id': user.id });
    res.json(user);
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
});
\`\`\`

## Migration Strategy

1. **Start with a monolith** for new projects
2. **Identify service boundaries** based on business domains
3. **Extract services gradually** using the Strangler Fig pattern
4. **Implement proper monitoring** before and during migration
5. **Maintain data consistency** throughout the transition

The key to successful backend architecture is choosing the right pattern for your specific needs and scaling requirements.`,
        featuredImage: null,
        authorId: "user-1",
        categoryId: "cat-2",
        tags: ["nodejs", "microservices", "architecture", "backend"],
        status: "published",
        readTime: 12,
        views: 289,
        likes: 47,
        metaTitle: "Modern Backend Architecture Guide | Monolith to Microservices",
        metaDescription: "Complete guide to backend architecture patterns. Learn when and how to transition from monoliths to microservices with practical examples.",
        publishedAt: new Date("2024-01-10T14:00:00Z"),
        createdAt: new Date("2024-01-10T14:00:00Z"),
        updatedAt: new Date("2024-01-10T14:00:00Z"),
      },
      {
        id: "post-3", 
        title: "React 18 Performance Optimization: Advanced Techniques",
        slug: "react-18-performance-optimization-advanced-techniques",
        excerpt: "Master React 18's latest performance features including Concurrent Features, Suspense, and advanced optimization patterns for lightning-fast applications.",
        content: `# React 18 Performance Optimization: Advanced Techniques

React 18 introduced powerful performance features that can dramatically improve your application's user experience. Let's explore advanced techniques to make your React apps lightning fast.

## Concurrent Features

React 18's Concurrent Features allow React to pause, resume, and reprioritize work:

\`\`\`tsx
import { startTransition, useDeferredValue } from 'react';

function SearchResults({ query }: { query: string }) {
  // Defer expensive computations
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => 
    performExpensiveSearch(deferredQuery), [deferredQuery]
  );

  return (
    <div>
      {results.map(result => (
        <ResultItem key={result.id} item={result} />
      ))}
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');

  const handleSearch = (newQuery: string) => {
    // Mark as non-urgent transition
    startTransition(() => {
      setQuery(newQuery);
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      <SearchResults query={query} />
    </div>
  );
}
\`\`\`

## Advanced Suspense Patterns

Suspense isn't just for code splitting - it's a powerful tool for data fetching:

\`\`\`tsx
import { Suspense } from 'react';

// Resource pattern for Suspense
function createResource<T>(promise: Promise<T>) {
  let status = 'pending';
  let result: T;
  let suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = e;
    }
  );
  
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    }
  };
}

// Usage
const userResource = createResource(fetchUser(userId));

function UserProfile() {
  const user = userResource.read();
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfile />
    </Suspense>
  );
}
\`\`\`

## Optimized State Management

### Using Zustand for Performance

\`\`\`tsx
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Store {
  users: User[];
  filters: FilterState;
  updateFilter: (key: string, value: any) => void;
  filteredUsers: User[];
}

const useStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    users: [],
    filters: { search: '', category: 'all' },
    updateFilter: (key, value) =>
      set(state => ({
        filters: { ...state.filters, [key]: value }
      })),
    get filteredUsers() {
      const { users, filters } = get();
      return users.filter(user => 
        user.name.includes(filters.search) &&
        (filters.category === 'all' || user.category === filters.category)
      );
    }
  }))
);

// Subscribe to specific slices
function UserList() {
  const filteredUsers = useStore(state => state.filteredUsers);
  
  return (
    <div>
      {filteredUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
\`\`\`

## Virtual Scrolling for Large Lists

\`\`\`tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  height: number;
}

function VirtualizedList({ items, itemHeight, height }: VirtualizedListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}

// For dynamic heights
import { VariableSizeList } from 'react-window';

function DynamicVirtualizedList({ items }: { items: any[] }) {
  const getItemSize = (index: number) => {
    // Calculate dynamic height based on content
    return items[index].content.length > 100 ? 120 : 80;
  };

  return (
    <VariableSizeList
      height={600}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
\`\`\`

## Memory Optimization Techniques

### Avoiding Memory Leaks

\`\`\`tsx
function OptimizedComponent() {
  const [data, setData] = useState(null);
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    // Create new abort controller for each request
    abortControllerRef.current = new AbortController();
    
    fetchData({ signal: abortControllerRef.current.signal })
      .then(setData)
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      });

    // Cleanup function
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return <div>{data && <DataDisplay data={data} />}</div>;
}
\`\`\`

### Optimized Image Loading

\`\`\`tsx
import { useState, useRef, useEffect } from 'react';

function LazyImage({ src, alt, placeholder }: {
  src: string;
  alt: string;
  placeholder: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="image-container">
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            style={{ opacity: isLoaded ? 1 : 0 }}
          />
          {!isLoaded && (
            <img src={placeholder} alt="" className="placeholder" />
          )}
        </>
      )}
    </div>
  );
}
\`\`\`

## Bundle Optimization

### Code Splitting with React.lazy

\`\`\`tsx
import { lazy, Suspense } from 'react';

// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Component-based code splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function App() {
  return (
    <Router>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// Conditional loading
function DataVisualization({ showChart }: { showChart: boolean }) {
  return (
    <div>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
\`\`\`

## Performance Monitoring

### Core Web Vitals Tracking

\`\`\`tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// React 18 specific metrics
import { onCLS, onFID, onLCP } from 'web-vitals';

function setupPerformanceMonitoring() {
  onCLS(metric => {
    // Track Cumulative Layout Shift
    analytics.track('CLS', metric);
  });
  
  onFID(metric => {
    // Track First Input Delay
    analytics.track('FID', metric);
  });
  
  onLCP(metric => {
    // Track Largest Contentful Paint
    analytics.track('LCP', metric);
  });
}
\`\`\`

## Production Optimization Checklist

1. **Enable React 18 Concurrent Features**
2. **Implement proper code splitting**
3. **Use React.memo strategically**
4. **Optimize bundle size with tree shaking**
5. **Implement virtual scrolling for large lists**
6. **Use Suspense for data fetching**
7. **Monitor Core Web Vitals**
8. **Implement proper error boundaries**

React 18's performance features are game-changers when used correctly. Start implementing these patterns gradually for maximum impact.`,
        featuredImage: null,
        authorId: "user-1",
        categoryId: "cat-3",
        tags: ["react", "typescript", "performance", "frontend"],
        status: "published",
        readTime: 10,
        views: 342,
        likes: 67,
        metaTitle: "React 18 Performance Optimization Guide | Advanced Techniques",
        metaDescription: "Master React 18's performance features including Concurrent Features, Suspense, and optimization patterns for lightning-fast applications.",
        publishedAt: new Date("2024-01-08T16:00:00Z"),
        createdAt: new Date("2024-01-08T16:00:00Z"),
        updatedAt: new Date("2024-01-08T16:00:00Z"),
      },
      {
        id: "post-4",
        title: "Deploying Full-Stack Apps on Replit: Complete Guide",
        slug: "deploying-fullstack-apps-replit-complete-guide",
        excerpt: "Learn how to deploy modern full-stack applications on Replit with databases, environment variables, custom domains, and production-ready configurations.",
        content: `# Deploying Full-Stack Apps on Replit: Complete Guide

Replit has evolved into a powerful platform for hosting production applications. This guide covers everything you need to deploy full-stack apps with confidence.

## Why Choose Replit for Deployment?

Replit offers several advantages for modern web applications:

- **Zero Configuration**: Deploy with a single click
- **Integrated Database**: Built-in PostgreSQL support
- **Automatic HTTPS**: SSL certificates included
- **Global CDN**: Fast content delivery worldwide
- **Real-time Collaboration**: Share and collaborate easily

## Project Setup and Structure

### Recommended Project Structure

\`\`\`
my-fullstack-app/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── index.ts
├── shared/
│   └── types.ts
├── package.json
├── .replit
└── replit.nix
\`\`\`

### Package.json Configuration

\`\`\`json
{
  "name": "fullstack-app",
  "scripts": {
    "dev": "concurrently \\"npm run server:dev\\" \\"npm run client:dev\\"",
    "server:dev": "tsx watch server/index.ts",
    "client:dev": "cd client && npm run dev",
    "build": "cd client && npm run build && cd .. && npm run server:build",
    "server:build": "tsx server/index.ts",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "tsx": "^3.12.0",
    "@types/node": "^18.15.0"
  }
}
\`\`\`

## Replit Configuration Files

### .replit Configuration

\`\`\`toml
# .replit
modules = ["nodejs-20"]

[nix]
channel = "stable-23_11"

[deployment]
run = ["sh", "-c", "npm run build && npm start"]
deploymentTarget = "cloudrun"
ignorePorts = false

[[ports]]
localPort = 3000
externalPort = 80
exposeLocalhost = true

[env]
NODE_ENV = "production"
PORT = "3000"
\`\`\`

### Nix Configuration

\`\`\`nix
# replit.nix
{pkgs}: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.npm-9_x
    pkgs.postgresql
  ];
}
\`\`\`

## Database Integration

### PostgreSQL Setup

Replit provides managed PostgreSQL databases:

\`\`\`typescript
// server/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
\`\`\`

### Database Migrations

\`\`\`typescript
// server/migrations/001_create_tables.ts
import pool from '../database';

export async function up() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  \`);
  
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  \`);
}

export async function down() {
  await pool.query('DROP TABLE IF EXISTS posts');
  await pool.query('DROP TABLE IF EXISTS users');
}
\`\`\`

## Environment Variables and Secrets

### Managing Secrets

\`\`\`typescript
// server/config.ts
interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  nodeEnv: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  nodeEnv: process.env.NODE_ENV || 'development'
};

export default config;
\`\`\`

### Client-Side Environment Variables

\`\`\`typescript
// client/src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  appName: import.meta.env.VITE_APP_NAME || 'My App'
};
\`\`\`

## API Routes and Middleware

### Express Server Setup

\`\`\`typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/api', apiRoutes);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
\`\`\`

### API Route Example

\`\`\`typescript
// server/routes/api.ts
import express from 'express';
import pool from '../database';

const router = express.Router();

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const result = await pool.query(\`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    \`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
router.post('/posts', async (req, res) => {
  const { title, content, userId } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
\`\`\`

## Frontend Build Configuration

### Vite Configuration

\`\`\`typescript
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
\`\`\`

## Production Optimizations

### Performance Monitoring

\`\`\`typescript
// server/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.url} - \${res.statusCode} - \${duration}ms\`);
  });
  
  next();
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Something went wrong' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
\`\`\`

### Caching Strategy

\`\`\`typescript
// server/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';

export function cacheControl(maxAge: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', \`public, max-age=\${maxAge}\`);
    next();
  };
}

// Usage
app.use('/api/posts', cacheControl(300)); // 5 minutes
app.use(express.static('client/dist', { maxAge: '1y' })); // Static assets
\`\`\`

## Custom Domains and SSL

### Setting Up Custom Domain

1. **Purchase domain** from your preferred registrar
2. **Add domain** in Replit deployment settings
3. **Configure DNS** records:
   - Add CNAME record pointing to your Replit app
   - Wait for DNS propagation (usually 24-48 hours)

\`\`\`
Type: CNAME
Name: www (or @)
Value: your-app-name.repl.co
TTL: 300
\`\`\`

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build process tested locally
- [ ] Error handling implemented
- [ ] Security headers added
- [ ] Performance optimizations applied

### Post-Deployment

- [ ] Health check endpoint working
- [ ] Database connectivity verified
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented

### Health Check Endpoint

\`\`\`typescript
// server/routes/health.ts
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
\`\`\`

## Troubleshooting Common Issues

### Build Failures

1. **Check dependencies**: Ensure all packages are listed in package.json
2. **Verify Node version**: Use compatible Node.js version
3. **Check build logs**: Review deployment logs for specific errors

### Database Connection Issues

\`\`\`typescript
// Add connection retry logic
async function connectWithRetry() {
  for (let i = 0; i < 5; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connected successfully');
      return;
    } catch (error) {
      console.log(\`Database connection attempt \${i + 1} failed\`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Failed to connect to database after 5 attempts');
}
\`\`\`

Replit provides an excellent platform for deploying full-stack applications with minimal configuration. Follow this guide to ensure your deployment is production-ready and scalable.`,
        featuredImage: null,
        authorId: "user-1",
        categoryId: "cat-4",
        tags: ["replit", "deployment", "hosting", "fullstack"],
        status: "published",
        readTime: 15,
        views: 198,
        likes: 31,
        metaTitle: "Complete Guide to Deploying Full-Stack Apps on Replit",
        metaDescription: "Learn how to deploy modern full-stack applications on Replit with databases, environment variables, and production-ready configurations.",
        publishedAt: new Date("2024-01-05T12:00:00Z"),
        createdAt: new Date("2024-01-05T12:00:00Z"),
        updatedAt: new Date("2024-01-05T12:00:00Z"),
      },
      // Add AI-generated sample post to show how it looks
      {
        id: "ai-post-sample",
        title: "Emerging AI Innovations: A Comprehensive Analysis of Recent Breakthroughs",
        slug: "emerging-ai-innovations-comprehensive-analysis",
        excerpt: "A detailed analysis of recent AI breakthroughs including GPT-5 announcements, efficiency improvements in LLM training, and advances in multimodal capabilities. This post synthesizes insights from multiple leading AI research sources.",
        content: `# Emerging AI Innovations: A Comprehensive Analysis of Recent Breakthroughs

The artificial intelligence landscape continues to evolve at an unprecedented pace, with recent developments spanning from architectural innovations to breakthrough applications in scientific research. This comprehensive analysis examines the latest advancements that are shaping the future of AI technology.

## Revolutionary Training Efficiency Improvements

According to recent reports from TechCrunch, researchers have unveiled a revolutionary architecture for training large language models that significantly reduces computational requirements while maintaining performance. This breakthrough could democratize access to LLM training by making it 70% more cost-effective.

### Key Technical Innovations

The new architecture incorporates several groundbreaking elements:

- **Adaptive Attention Mechanisms**: Dynamic attention patterns that adjust based on input complexity
- **Gradient Compression Techniques**: Advanced methods for reducing memory footprint during training
- **Distributed Computing Optimizations**: Improved parallelization strategies for multi-GPU setups

\`\`\`mermaid
graph TD
    A[Input Data] --> B[Adaptive Attention Layer]
    B --> C[Compressed Gradient Processing]
    C --> D[Distributed Training Nodes]
    D --> E[Model Convergence]
    E --> F[70% Cost Reduction]
\`\`\`

## OpenAI's GPT-5: Multimodal Capabilities and Enhanced Reasoning

As reported by OpenAI's official blog, the announcement of GPT-5 represents a significant leap forward in multimodal AI capabilities. The new model demonstrates unprecedented performance in combining text, image, and audio processing with improved reasoning abilities.

### Enhanced Features

- **Cross-Modal Understanding**: Seamless integration of multiple data types
- **Advanced Reasoning**: Improved logical thinking and problem-solving capabilities  
- **Better Alignment**: Enhanced adherence to human values and intentions

## Meta's Vision-Language Breakthrough

According to arXiv research publications, Meta's new vision-language model has achieved remarkable performance on visual question answering benchmarks, surpassing human-level accuracy in several key areas.

## AI Safety and Constitutional Approaches

Anthropic's latest research introduces novel constitutional AI techniques that improve AI safety through self-correction and principle-based training methodologies, as detailed in their recent publication.

## Scientific Research Applications

Google's Gemini Ultra demonstrates exceptional performance in scientific research tasks, from protein folding predictions to climate modeling applications, showing the practical impact of advanced AI systems.

## Sources and References

This article synthesizes information from the following sources:

- **[Breakthrough in Large Language Model Efficiency](https://techcrunch.com/ai-breakthrough-efficiency)** - TechCrunch
- **[OpenAI Announces GPT-5: Multimodal Capabilities](https://openai.com/blog/gpt-5-announcement)** - OpenAI Blog  
- **[Meta's New Vision-Language Model](https://arxiv.org/abs/2024.vision.language)** - arXiv
- **[Anthropic's Constitutional AI Methods](https://anthropic.com/constitutional-ai-methods)** - Anthropic Blog
- **[Google's Gemini Ultra Scientific Applications](https://ai.googleblog.com/gemini-scientific-research)** - Google AI Blog

---

*This post was generated by AI to provide enhanced analysis and context of recent AI developments. All sources are properly attributed and linked above.*`,
        featuredImage: null,
        authorId: "ai-system",
        categoryId: "cat-1", 
        tags: ["ai", "gpt", "machine-learning", "openai", "meta", "anthropic", "google"],
        status: "published",
        readTime: 6,
        views: 42,
        likes: 8,
        metaTitle: "AI Breakthroughs: GPT-5, Training Efficiency & More | Anuj's Blog",
        metaDescription: "Comprehensive analysis of recent AI innovations including GPT-5, 70% training cost reduction, vision-language models, and scientific applications.",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    samplePosts.forEach(post => this.posts.set(post.id, post));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id, 
      createdAt: new Date(),
      description: insertCategory.description || null
    };
    this.categories.set(id, category);
    return category;
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: string): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(tag => tag.slug === slug);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = randomUUID();
    const tag: Tag = { ...insertTag, id, createdAt: new Date() };
    this.tags.set(id, tag);
    return tag;
  }

  // Posts
  async getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]> {
    let posts = Array.from(this.posts.values());

    // Apply filters
    if (filters?.status) {
      posts = posts.filter(post => post.status === filters.status);
    }

    if (filters?.category) {
      posts = posts.filter(post => {
        const category = this.categories.get(post.categoryId);
        return category?.slug === filters.category;
      });
    }

    if (filters?.tag) {
      posts = posts.filter(post => post.tags && post.tags.includes(filters.tag!));
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by publishedAt or createdAt (most recent first)
    posts.sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    // Transform to PostWithDetails
    return posts.map(post => {
      const author = this.users.get(post.authorId)!;
      const category = this.categories.get(post.categoryId)!;
      const commentsCount = Array.from(this.comments.values())
        .filter(comment => comment.postId === post.id && comment.isApproved).length;

      return { ...post, author, category, commentsCount };
    });
  }

  async getPost(id: string): Promise<PostWithDetails | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const author = this.users.get(post.authorId)!;
    const category = this.categories.get(post.categoryId)!;
    const commentsCount = Array.from(this.comments.values())
      .filter(comment => comment.postId === post.id && comment.isApproved).length;

    return { ...post, author, category, commentsCount };
  }

  async getPostBySlug(slug: string): Promise<PostWithDetails | undefined> {
    const post = Array.from(this.posts.values()).find(p => p.slug === slug);
    if (!post) return undefined;

    const author = this.users.get(post.authorId)!;
    const category = this.categories.get(post.categoryId)!;
    const commentsCount = Array.from(this.comments.values())
      .filter(comment => comment.postId === post.id && comment.isApproved).length;

    return { ...post, author, category, commentsCount };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
      status: insertPost.status || "draft",
      tags: insertPost.tags ? [...insertPost.tags] : [],
      featuredImage: insertPost.featuredImage || null,
      metaTitle: insertPost.metaTitle || null,
      metaDescription: insertPost.metaDescription || null,
      publishedAt: insertPost.publishedAt || null
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: string, updatePost: UpdatePost): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    // Fix malformed Mermaid blocks in content if present
    let content = updatePost.content;
    if (content && typeof content === 'string' && content !== 'trigger_fix') {
      content = content.replace(/```mermaid\s*```mermaid/g, '```mermaid');
      content = content.replace(/```\s*```/g, '```');
    } else if (content === 'trigger_fix') {
      // Special case: restore and fix original content
      content = post.content;
      if (content && typeof content === 'string') {
        content = content.replace(/```mermaid\s*```mermaid/g, '```mermaid');
        content = content.replace(/```\s*```/g, '```');
      }
    } else {
      content = post.content;
    }

    const updatedPost: Post = {
      ...post,
      ...updatePost,
      content,
      tags: updatePost.tags ? [...updatePost.tags] : post.tags ? [...post.tags] : [],
      updatedAt: new Date(),
    };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async incrementPostViews(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.views += 1;
      this.posts.set(id, post);
    }
  }

  async incrementPostLikes(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.likes += 1;
      this.posts.set(id, post);
    }
  }

  // Comments
  async getCommentsByPost(postId: string): Promise<CommentWithReplies[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId && comment.isApproved)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Build comment tree
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create comment objects
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }

  async getComment(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      likes: 0,
      isApproved: true, // Auto-approve for demo
      createdAt: new Date(),
      authorAvatar: insertComment.authorAvatar || null,
      parentId: insertComment.parentId || null
    };
    this.comments.set(id, comment);
    return comment;
  }

  async incrementCommentLikes(id: string): Promise<void> {
    const comment = this.comments.get(id);
    if (comment) {
      comment.likes += 1;
      this.comments.set(id, comment);
    }
  }

  async approveComment(id: string): Promise<void> {
    const comment = this.comments.get(id);
    if (comment) {
      comment.isApproved = true;
      this.comments.set(id, comment);
    }
  }
}



// Use memory storage for reliable local development
// Database storage implementation using PostgreSQL
import { db } from "./db.js";
import { eq, ilike, or, inArray, sql } from "drizzle-orm";
import { users, categories, tags, posts, comments, insertUserSchema, insertCategorySchema, insertTagSchema, insertPostSchema, insertCommentSchema } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      id: randomUUID(),
      createdAt: new Date(),
      avatar: insertUser.avatar || null
    }).returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      ...insertCategory,
      id: randomUUID(),
      createdAt: new Date(),
      description: insertCategory.description || null
    }).returning();
    return category;
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
    return tag || undefined;
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values({
      ...insertTag,
      id: randomUUID(),
      createdAt: new Date()
    }).returning();
    return tag;
  }

  // Posts
  async getPosts(filters?: { category?: string; tag?: string; search?: string; status?: string }): Promise<PostWithDetails[]> {
    // Get basic post data first
    const postsData = await db.select().from(posts).orderBy(posts.publishedAt);
    
    // For each post, get author and category data
    const result: PostWithDetails[] = [];
    
    for (const post of postsData) {
      const [author] = await db.select().from(users).where(eq(users.id, post.authorId));
      const [category] = await db.select().from(categories).where(eq(categories.id, post.categoryId));
      
      // Apply filters
      let shouldInclude = true;
      
      if (filters?.status && post.status !== filters.status) {
        shouldInclude = false;
      }
      
      if (filters?.category && category?.slug !== filters.category) {
        shouldInclude = false;
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        if (!post.title.toLowerCase().includes(searchLower) &&
            !post.excerpt.toLowerCase().includes(searchLower) &&
            !post.content.toLowerCase().includes(searchLower)) {
          shouldInclude = false;
        }
      }
      
      if (shouldInclude) {
        result.push({
          ...post,
          author: author || { 
            id: "default-user", 
            username: "system", 
            email: "system@blog.dev", 
            name: "System", 
            avatar: null, 
            createdAt: new Date() 
          },
          category: category || { 
            id: "default-cat", 
            name: "General", 
            slug: "general", 
            description: "General posts", 
            color: "#3B82F6", 
            createdAt: new Date() 
          },
          commentsCount: 0
        });
      }
    }
    
    return result.reverse(); // Most recent first
  }

  async getPost(id: string): Promise<PostWithDetails | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;
    
    const [author] = await db.select().from(users).where(eq(users.id, post.authorId));
    const [category] = await db.select().from(categories).where(eq(categories.id, post.categoryId));
    
    return {
      ...post,
      author: author || { 
        id: "default-user", 
        username: "system", 
        email: "system@blog.dev", 
        name: "System", 
        avatar: null, 
        createdAt: new Date() 
      },
      category: category || { 
        id: "default-cat", 
        name: "General", 
        slug: "general", 
        description: "General posts", 
        color: "#3B82F6", 
        createdAt: new Date() 
      },
      commentsCount: 0
    };
  }

  async getPostBySlug(slug: string): Promise<PostWithDetails | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
    if (!post) return undefined;
    
    const [author] = await db.select().from(users).where(eq(users.id, post.authorId));
    const [category] = await db.select().from(categories).where(eq(categories.id, post.categoryId));
    
    return {
      ...post,
      author: author || { 
        id: "default-user", 
        username: "system", 
        email: "system@blog.dev", 
        name: "System", 
        avatar: null, 
        createdAt: new Date() 
      },
      category: category || { 
        id: "default-cat", 
        name: "General", 
        slug: "general", 
        description: "General posts", 
        color: "#3B82F6", 
        createdAt: new Date() 
      },
      commentsCount: 0
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values({
      ...insertPost,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: insertPost.publishedAt || new Date(),
      featuredImage: insertPost.featuredImage || null,
      metaTitle: insertPost.metaTitle || null,
      metaDescription: insertPost.metaDescription || null
    }).returning();
    return post;
  }

  async updatePost(id: string, updatePost: UpdatePost): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ ...updatePost, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async incrementPostViews(id: string): Promise<void> {
    await db.update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));
  }

  async incrementPostLikes(id: string): Promise<void> {
    await db.update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, id));
  }

  // Comments
  async getCommentsByPost(postId: string): Promise<CommentWithReplies[]> {
    const allComments = await db.select().from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    // Get author data for each comment
    const commentsWithAuthors: CommentWithReplies[] = [];
    
    for (const comment of allComments) {
      commentsWithAuthors.push({
        ...comment,
        replies: []
      });
    }

    // Convert to nested structure
    const commentsMap = new Map();
    const topLevelComments: CommentWithReplies[] = [];

    commentsWithAuthors.forEach(comment => {
      commentsMap.set(comment.id, comment);
      if (!comment.parentId) {
        topLevelComments.push(comment);
      }
    });

    commentsWithAuthors.forEach(comment => {
      if (comment.parentId) {
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    return topLevelComments;
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values({
      ...insertComment,
      createdAt: new Date()
    }).returning();
    return comment;
  }

  async incrementCommentLikes(id: string): Promise<void> {
    await db.update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, id));
  }

  async approveComment(id: string): Promise<void> {
    await db.update(comments)
      .set({ isApproved: true })
      .where(eq(comments.id, id));
  }
}

// Use DatabaseStorage instead of MemStorage for persistent data
export const storage = new DatabaseStorage();
