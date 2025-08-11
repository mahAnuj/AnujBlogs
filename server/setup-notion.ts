import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

// Setup database for blog posts
async function setupNotionDatabases() {
    await createDatabaseIfNotExists("Blog Posts", {
        // Every database needs a Title property
        Title: {
            title: {}
        },
        Slug: {
            rich_text: {}
        },
        Excerpt: {
            rich_text: {}
        },
        Category: {
            select: {
                options: [
                    { name: "AI/LLM", color: "blue" },
                    { name: "Backend", color: "green" },
                    { name: "Frontend", color: "orange" },
                    { name: "Hosting", color: "purple" },
                    { name: "General", color: "gray" }
                ]
            }
        },
        Tags: {
            multi_select: {
                options: [
                    { name: "React", color: "blue" },
                    { name: "Node.js", color: "green" },
                    { name: "Python", color: "yellow" },
                    { name: "AI", color: "purple" },
                    { name: "Machine Learning", color: "pink" },
                    { name: "DevOps", color: "orange" },
                    { name: "Tutorial", color: "gray" }
                ]
            }
        },
        Status: {
            select: {
                options: [
                    { name: "Draft", color: "gray" },
                    { name: "Published", color: "green" },
                    { name: "Archived", color: "red" }
                ]
            }
        },
        "Published Date": {
            date: {}
        },
        "Created Date": {
            created_time: {}
        },
        "Meta Title": {
            rich_text: {}
        },
        "Meta Description": {
            rich_text: {}
        },
        "Read Time": {
            number: {}
        },
        Views: {
            number: {}
        },
        Likes: {
            number: {}
        }
    });
}

async function createSampleBlogPosts() {
    try {
        console.log("Adding sample blog posts...");

        // Find the blog database
        const blogDb = await findDatabaseByTitle("Blog Posts");

        if (!blogDb) {
            throw new Error("Could not find the Blog Posts database.");
        }

        const samplePosts = [
            {
                title: "Building Intelligent Apps with OpenAI GPT-4",
                slug: "building-intelligent-apps-with-openai-gpt-4",
                excerpt: "Learn how to integrate OpenAI's GPT-4 into your applications for natural language processing, content generation, and intelligent user interactions.",
                category: "AI/LLM",
                tags: ["AI", "OpenAI", "GPT-4"],
                status: "Published",
                metaTitle: "Build AI Apps with GPT-4: Complete Developer Guide",
                metaDescription: "Step-by-step tutorial on integrating OpenAI GPT-4 into your applications. Learn prompt engineering, API best practices, and real-world implementations.",
                readTime: 8
            },
            {
                title: "Serverless Architecture with Vercel and Next.js",
                slug: "serverless-architecture-vercel-nextjs",
                excerpt: "Explore modern serverless deployment strategies using Vercel's platform with Next.js for scalable, cost-effective web applications.",
                category: "Hosting",
                tags: ["Vercel", "Next.js", "Serverless"],
                status: "Published",
                metaTitle: "Serverless Deployment Guide: Vercel + Next.js",
                metaDescription: "Master serverless architecture with Vercel and Next.js. Learn deployment strategies, performance optimization, and cost management.",
                readTime: 10
            },
            {
                title: "React Performance Optimization Techniques",
                slug: "react-performance-optimization-techniques",
                excerpt: "Comprehensive guide to optimizing React applications for better performance, including code splitting, memoization, and lazy loading strategies.",
                category: "Frontend",
                tags: ["React", "Performance", "Optimization"],
                status: "Published",
                metaTitle: "React Performance: Advanced Optimization Guide",
                metaDescription: "Boost your React app performance with proven optimization techniques. Learn code splitting, memoization, lazy loading, and performance monitoring.",
                readTime: 12
            },
            {
                title: "Building Scalable APIs with Node.js and PostgreSQL",
                slug: "building-scalable-apis-nodejs-postgresql",
                excerpt: "Design and implement robust, scalable REST APIs using Node.js, Express, and PostgreSQL with proper authentication, validation, and error handling.",
                category: "Backend",
                tags: ["Node.js", "PostgreSQL", "API Design"],
                status: "Published",
                metaTitle: "Node.js API Development: PostgreSQL Integration",
                metaDescription: "Build production-ready APIs with Node.js and PostgreSQL. Learn authentication, validation, error handling, and scalability best practices.",
                readTime: 15
            }
        ];

        for (let post of samplePosts) {
            // Create the page first
            const page = await notion.pages.create({
                parent: {
                    database_id: blogDb.id
                },
                properties: {
                    Title: {
                        title: [
                            {
                                text: {
                                    content: post.title
                                }
                            }
                        ]
                    },
                    Slug: {
                        rich_text: [
                            {
                                text: {
                                    content: post.slug
                                }
                            }
                        ]
                    },
                    Excerpt: {
                        rich_text: [
                            {
                                text: {
                                    content: post.excerpt
                                }
                            }
                        ]
                    },
                    Category: {
                        select: {
                            name: post.category
                        }
                    },
                    Tags: {
                        multi_select: post.tags.map(tag => ({ name: tag }))
                    },
                    Status: {
                        select: {
                            name: post.status
                        }
                    },
                    "Published Date": {
                        date: {
                            start: new Date().toISOString().split('T')[0]
                        }
                    },
                    "Meta Title": {
                        rich_text: [
                            {
                                text: {
                                    content: post.metaTitle
                                }
                            }
                        ]
                    },
                    "Meta Description": {
                        rich_text: [
                            {
                                text: {
                                    content: post.metaDescription
                                }
                            }
                        ]
                    },
                    "Read Time": {
                        number: post.readTime
                    },
                    Views: {
                        number: Math.floor(Math.random() * 1000) + 100
                    },
                    Likes: {
                        number: Math.floor(Math.random() * 50) + 5
                    }
                }
            });

            // Add some sample content to the page
            await notion.blocks.children.append({
                block_id: page.id,
                children: [
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: post.excerpt
                                    }
                                }
                            ]
                        }
                    },
                    {
                        object: "block",
                        type: "heading_2",
                        heading_2: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: "Introduction"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: "This is a sample blog post created automatically. You can edit this content directly in Notion to update your blog post. Add headings, code blocks, images, and more using Notion's rich editor."
                                    }
                                }
                            ]
                        }
                    },
                    {
                        object: "block",
                        type: "code",
                        code: {
                            caption: [],
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: "// Sample code block\nconsole.log('Hello from Notion CMS!');"
                                    }
                                }
                            ],
                            language: "javascript"
                        }
                    }
                ]
            });

            console.log(`Created blog post: ${post.title}`);
        }

        console.log("Sample blog posts creation complete.");
    } catch (error) {
        console.error("Error creating sample blog posts:", error);
    }
}

// Run the setup
setupNotionDatabases().then(() => {
    return createSampleBlogPosts();
}).then(() => {
    console.log("Notion setup complete!");
    process.exit(0);
}).catch(error => {
    console.error("Setup failed:", error);
    process.exit(1);
});