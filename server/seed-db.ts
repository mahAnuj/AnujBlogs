import { db } from "./db.js";
import { users, categories, tags, posts } from "@shared/schema";
import { randomUUID } from "crypto";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create users
    const defaultUser = {
      id: "user-1",
      username: "anujmahajan",
      email: "anuj@anujmahajan.dev",
      name: "Anuj Mahajan",
      avatar: null,
      createdAt: new Date(),
    };

    const aiUser = {
      id: "ai-system",
      username: "ai-system",
      email: "ai@anujblog.ai",
      name: "AI Content Generator",
      avatar: null,
      createdAt: new Date(),
    };

    await db.insert(users).values([defaultUser, aiUser]).onConflictDoNothing();
    console.log("✅ Users created");

    // Create categories
    const categoriesData = [
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

    await db.insert(categories).values(categoriesData).onConflictDoNothing();
    console.log("✅ Categories created");

    // Create tags
    const tagsData = [
      { id: "tag-1", name: "React", slug: "react", createdAt: new Date() },
      { id: "tag-2", name: "Node.js", slug: "nodejs", createdAt: new Date() },
      { id: "tag-3", name: "TypeScript", slug: "typescript", createdAt: new Date() },
      { id: "tag-4", name: "Docker", slug: "docker", createdAt: new Date() },
      { id: "tag-5", name: "AWS", slug: "aws", createdAt: new Date() },
      { id: "tag-6", name: "Next.js", slug: "nextjs", createdAt: new Date() },
      { id: "tag-7", name: "AI", slug: "ai", createdAt: new Date() },
      { id: "tag-8", name: "GPT", slug: "gpt", createdAt: new Date() },
      { id: "tag-9", name: "Machine Learning", slug: "machine-learning", createdAt: new Date() },
    ];

    await db.insert(tags).values(tagsData).onConflictDoNothing();
    console.log("✅ Tags created");

    // Create sample post
    const samplePost = {
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

The combination of GPT-4 and LangChain opens up incredible possibilities for building intelligent applications. Start experimenting today!`,
      featuredImage: null,
      authorId: "user-1",
      categoryId: "cat-1",
      tags: ["typescript", "ai", "gpt", "langchain"],
      status: "published" as const,
      readTime: 8,
      views: 156,
      likes: 23,
      metaTitle: "Building AI Apps with GPT-4 and LangChain | Anuj's Blog",
      metaDescription: "Learn how to create powerful AI applications using GPT-4, LangChain, and modern development practices. Complete guide with code examples.",
      publishedAt: new Date("2024-01-15T10:00:00Z"),
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      metadata: null
    };

    await db.insert(posts).values([samplePost]).onConflictDoNothing();
    console.log("✅ Sample posts created");

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedDatabase };