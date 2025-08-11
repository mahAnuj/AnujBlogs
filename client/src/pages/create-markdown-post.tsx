import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Eye, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface MarkdownPostForm {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
  status: "draft" | "published";
}

export default function CreateMarkdownPost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<MarkdownPostForm>({
    title: "",
    excerpt: "",
    content: "",
    categoryId: "",
    tags: [],
    featuredImage: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft"
  });
  
  const [currentTag, setCurrentTag] = useState("");
  const [activeTab, setActiveTab] = useState("edit");

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest("/api/posts", "POST", postData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Post created successfully!",
        description: "Your post has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      // Reset form
      setForm({
        title: "",
        excerpt: "",
        content: "",
        categoryId: "",
        tags: [],
        featuredImage: "",
        metaTitle: "",
        metaDescription: "",
        status: "draft"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleAddTag = () => {
    if (currentTag.trim() && !form.tags.includes(currentTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.categoryId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, content, and category",
        variant: "destructive",
      });
      return;
    }

    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const excerpt = form.excerpt || form.content.substring(0, 200) + "...";
    const readTime = estimateReadTime(form.content);

    const postData = {
      ...form,
      slug,
      excerpt,
      readTime,
      authorId: "user-1", // Default author
      metaTitle: form.metaTitle || form.title,
      metaDescription: form.metaDescription || excerpt,
    };

    createPostMutation.mutate(postData);
  };

  const parseMarkdownTemplate = (content: string) => {
    const lines = content.split('\n');
    let title = '';
    let excerpt = '';
    let tags: string[] = [];
    let category = '';
    let contentStart = 0;

    // Parse frontmatter-style headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ') && !title) {
        title = line.substring(2).trim();
        contentStart = Math.max(contentStart, i + 1);
      } else if (line.startsWith('**Tags:**') || line.startsWith('Tags:')) {
        const tagLine = line.replace(/\*\*Tags:\*\*|Tags:/, '').trim();
        tags = tagLine.split(',').map(t => t.trim()).filter(t => t.length > 0);
        contentStart = Math.max(contentStart, i + 1);
      } else if (line.startsWith('**Category:**') || line.startsWith('Category:')) {
        category = line.replace(/\*\*Category:\*\*|Category:/, '').trim();
        contentStart = Math.max(contentStart, i + 1);
      } else if (line.startsWith('**Excerpt:**') || line.startsWith('Excerpt:')) {
        excerpt = line.replace(/\*\*Excerpt:\*\*|Excerpt:/, '').trim();
        contentStart = Math.max(contentStart, i + 1);
      }
    }

    const mainContent = lines.slice(contentStart).join('\n').trim();

    // Auto-detect category if not specified
    if (!category && categories.length > 0) {
      const contentLower = (title + ' ' + mainContent).toLowerCase();
      if (contentLower.includes('ai') || contentLower.includes('llm') || contentLower.includes('gpt') || contentLower.includes('machine learning')) {
        category = 'AI/LLM';
      } else if (contentLower.includes('react') || contentLower.includes('vue') || contentLower.includes('frontend') || contentLower.includes('css')) {
        category = 'Frontend';
      } else if (contentLower.includes('node') || contentLower.includes('backend') || contentLower.includes('api') || contentLower.includes('server')) {
        category = 'Backend';
      } else if (contentLower.includes('docker') || contentLower.includes('aws') || contentLower.includes('deploy') || contentLower.includes('hosting')) {
        category = 'Hosting';
      } else {
        category = 'AI/LLM'; // Default fallback
      }
    }

    const selectedCategory = categories.find(c => c.name === category || c.slug === category.toLowerCase());

    return {
      title,
      excerpt,
      content: mainContent,
      tags,
      categoryId: selectedCategory?.id || categories[0]?.id || '',
    };
  };

  const handleQuickFill = () => {
    if (form.content) {
      const parsed = parseMarkdownTemplate(form.content);
      setForm(prev => ({
        ...prev,
        ...parsed,
        metaTitle: parsed.title,
        metaDescription: parsed.excerpt,
      }));
      toast({
        title: "Auto-filled from content",
        description: "Extracted title, tags, and category from your markdown",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
        <p className="text-muted-foreground">
          Write your post in Markdown and it will be automatically formatted
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Post Details
              </CardTitle>
              <CardDescription>
                Basic information about your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of your post"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.categoryId} onValueChange={(value) => setForm(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={form.featuredImage}
                  onChange={(e) => setForm(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value: "draft" | "published") => setForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={form.metaTitle}
                  onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO title (defaults to post title)"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={form.metaDescription}
                  onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="SEO description (defaults to excerpt)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Content Editor */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write your post in Markdown format
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleQuickFill}>
                Auto-Fill
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="mt-4">
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={`# Building Modern AI Applications with TypeScript

**Category:** AI/LLM
**Tags:** AI, TypeScript, OpenAI, API
**Excerpt:** A comprehensive guide to building intelligent applications using TypeScript and modern AI APIs

## Introduction

Artificial Intelligence is revolutionizing how we build applications. In this post, we'll explore how to integrate AI capabilities into TypeScript applications using modern tools and best practices.

## Setting Up Your Environment

First, let's set up our development environment with the necessary dependencies:

\`\`\`bash
npm install openai @types/node typescript
npm install -D @types/express
\`\`\`

## Building the AI Service

Here's how to create a reusable AI service:

\`\`\`typescript
import OpenAI from 'openai';

export class AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });
    
    return response.choices[0]?.message?.content || '';
  }
}
\`\`\`

## Best Practices

1. **Error Handling**: Always implement proper error handling
2. **Rate Limiting**: Respect API rate limits
3. **Security**: Never expose API keys in client-side code
4. **Testing**: Write comprehensive tests for AI integrations

## Conclusion

Building AI-powered applications with TypeScript provides type safety and excellent developer experience. The combination of strong typing and powerful AI APIs opens up endless possibilities for creating intelligent applications.

---

*Ready to get started? Try implementing these concepts in your next project!*`}
                    className="min-h-[500px] font-mono text-sm"
                  />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 min-h-[500px] max-h-[500px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        code(props) {
                          const { children, className, node, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code {...rest} className={className}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {form.content || "*No content to preview*"}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending}
              className="flex-1"
            >
              {createPostMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {form.status === "published" ? "Publish Post" : "Save Draft"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}