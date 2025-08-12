import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertPostSchema, type Category, type Tag, type InsertPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Eye, Plus, X, Save, FileText } from "lucide-react";

const createPostFormSchema = insertPostSchema.extend({
  tags: insertPostSchema.shape.tags.optional().default([]),
});

type CreatePostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  status: "draft" | "published";
  metaTitle?: string;
  metaDescription?: string;
  readTime?: number;
};

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Check if we're editing an existing post
  const urlParams = new URLSearchParams(window.location.search);
  const editPostId = urlParams.get('edit');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Fetch existing post data if editing
  const { data: existingPost } = useQuery<any>({
    queryKey: [`/api/posts/id/${editPostId}`],
    enabled: !!editPostId,
  });

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      categoryId: "",
      tags: [],
      status: "draft",
      metaTitle: "",
      metaDescription: "",
      readTime: 5,
    },
  });

  // Update form when existing post data is loaded
  useEffect(() => {
    if (existingPost) {
      form.reset({
        title: existingPost.title || "",
        slug: existingPost.slug || "",
        excerpt: existingPost.excerpt || "",
        content: existingPost.content || "",
        categoryId: existingPost.categoryId || "",
        tags: existingPost.tags || [],
        status: existingPost.status || "draft",
        metaTitle: existingPost.metaTitle || "",
        metaDescription: existingPost.metaDescription || "",
        readTime: existingPost.readTime || 5,
      });
      setSelectedTags(existingPost.tags || []);
    }
  }, [existingPost, form]);

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      const postData: InsertPost = {
        ...data,
        authorId: "user-1", // In a real app, this would come from auth
        tags: selectedTags,
        readTime: data.readTime || estimateReadTime(data.content),
        publishedAt: data.status === "published" ? new Date() : null,
      };
      
      if (editPostId) {
        // Update existing post
        const response = await fetch(`/api/posts/${editPostId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
        if (!response.ok) throw new Error("Failed to update post");
        return response.json();
      } else {
        // Create new post
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
        if (!response.ok) throw new Error("Failed to create post");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/drafts"] });
      toast({
        title: "Success",
        description: editPostId ? "Post updated successfully!" : "Post created successfully!",
      });
      setLocation(editPostId ? "/ai-dashboard" : "/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : (editPostId ? "Failed to update post" : "Failed to create post"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostForm) => {
    createPostMutation.mutate(data);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    form.setValue("title", title);
    if (!form.getValues("slug")) {
      form.setValue("slug", generateSlug(title));
    }
    if (!form.getValues("metaTitle")) {
      form.setValue("metaTitle", `${title} | Tech Blog`);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const content = form.watch("content");
  const readTime = estimateReadTime(content);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {editPostId ? "Edit Post" : "Create New Post"}
        </h1>
        <p className="text-muted-foreground">
          {editPostId ? 
            "Update your existing post with our integrated editor" : 
            "Write and publish a new blog post with our integrated editor"
          }
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title..."
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    placeholder="url-friendly-slug"
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    {...form.register("excerpt")}
                    placeholder="Brief description of the post..."
                    rows={3}
                  />
                  {form.formState.errors.excerpt && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.excerpt.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write your post content in Markdown. Estimated read time: {readTime} minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="mt-4">
                    <Textarea
                      {...form.register("content")}
                      placeholder="Write your post content in Markdown..."
                      rows={20}
                      className="font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-4">
                    <div className="border rounded-lg p-4 min-h-[500px] prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !className;
                            return !isInline && match ? (
                              <SyntaxHighlighter
                                style={tomorrow as any}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {content || "*No content yet. Start writing in the Edit tab.*"}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value: "draft" | "published") =>
                      form.setValue("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={form.watch("categoryId")}
                    onValueChange={(value) => form.setValue("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="readTime">Read Time (minutes)</Label>
                  <Input
                    id="readTime"
                    type="number"
                    {...form.register("readTime", { valueAsNumber: true })}
                    min={1}
                    max={60}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {allTags.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Existing tags:</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => {
                            if (!selectedTags.includes(tag.slug)) {
                              setSelectedTags([...selectedTags, tag.slug]);
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    {...form.register("metaTitle")}
                    placeholder="SEO title..."
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    {...form.register("metaDescription")}
                    placeholder="SEO description..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPostMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {createPostMutation.isPending
              ? "Creating..."
              : form.watch("status") === "published"
              ? "Publish Post"
              : "Save Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}