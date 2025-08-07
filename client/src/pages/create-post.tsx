import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
import { SEOHead } from "@/components/seo-head";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Eye, Plus, X } from "lucide-react";
import { Link } from "wouter";
import type { Category, Tag } from "@shared/schema";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  excerpt: z.string().min(1, "Excerpt is required").max(300, "Excerpt must be under 300 characters"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "published"]),
  readTime: z.number().min(1, "Read time must be at least 1 minute"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featuredImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  authorId: z.string().min(1, "Author is required"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      categoryId: "",
      status: "draft",
      readTime: 5,
      metaTitle: "",
      metaDescription: "",
      featuredImage: "",
      authorId: "user-1", // Default to the sample user
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostForm & { tags: string[]; slug: string }) =>
      apiRequest("POST", "/api/posts", data),
    onSuccess: (response) => {
      const postData = response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post created successfully!",
        description: "Your post has been saved.",
      });
      setLocation(`/post/${response.slug || generateSlug(form.getValues("title"))}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleContentChange = (content: string) => {
    form.setValue("content", content);
    const readTime = estimateReadTime(content);
    form.setValue("readTime", readTime);
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

  const onSubmit = (data: CreatePostForm) => {
    const slug = generateSlug(data.title);
    createPostMutation.mutate({
      ...data,
      tags: selectedTags,
      slug,
    });
  };

  const saveDraft = () => {
    form.setValue("status", "draft");
    form.handleSubmit(onSubmit)();
  };

  const publish = () => {
    form.setValue("status", "published");
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-secondary dark:text-slate-200">
      <SEOHead
        title="Create New Post - TechStack Blog"
        description="Create and publish a new blog post on TechStack Blog"
      />
      
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <a>
              <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                <ArrowLeft className="mr-2" size={16} />
                Back to Blog
              </Button>
            </a>
          </Link>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setPreview(!preview)}
              className="flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>{preview ? "Edit" : "Preview"}</span>
            </Button>
            
            <Button
              onClick={saveDraft}
              disabled={createPostMutation.isPending}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save Draft</span>
            </Button>
            
            <Button
              onClick={publish}
              disabled={createPostMutation.isPending}
              className="flex items-center space-x-2"
            >
              {createPostMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Publish Post</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter post title..."
                              className="text-lg font-semibold"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excerpt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of your post..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            {preview ? (
                              <div className="min-h-[400px] p-6 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                  {field.value.split('\n').map((paragraph, index) => (
                                    <p key={index} className="mb-4 last:mb-0">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <RichTextEditor
                                value={field.value}
                                onChange={handleContentChange}
                                placeholder="Start writing your post content..."
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Post Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: category.color }}
                                    />
                                    <span>{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="readTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Read Time (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        Add
                      </Button>
                    </div>
                    
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="mb-2">Popular tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 6).map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (!selectedTags.includes(tag.name)) {
                                setSelectedTags([...selectedTags, tag.name]);
                              }
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SEO optimized title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="SEO description for search engines"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
