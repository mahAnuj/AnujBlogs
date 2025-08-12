import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, BookOpen, Zap, Users, Heart, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface NotionStatus {
  configured: boolean;
  message: string;
}

export default function CreatePost() {
  const { data: notionStatus, isLoading } = useQuery<NotionStatus>({
    queryKey: ["/api/notion/status"],
  });
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Write with Notion CMS
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your blog is now powered by Notion! Write, edit, and publish posts using Notion's amazing editor that you already know and love.
          </p>
        </div>

        {/* Notion Status Alert */}
        {!isLoading && notionStatus && !notionStatus.configured && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Notion Setup Required:</strong> {notionStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && notionStatus && notionStatus.configured && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Notion Ready:</strong> Your Notion integration is properly configured!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Why Notion CMS */}
          <Card className="border-primary border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Why We Chose Notion
              </CardTitle>
              <CardDescription>
                The best content management experience for technical writers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Familiar Interface</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the editor you already know and love
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Rich Content Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code blocks, tables, embeds, and more
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Collaborative Writing</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Multiple authors can work together
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Auto-Sync</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Changes appear on your blog instantly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                How It Works
              </CardTitle>
              <CardDescription>
                Simple workflow for publishing blog posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                <span className="text-sm">Write in your Notion workspace</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                <span className="text-sm">Add to "Blog Posts" database</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                <span className="text-sm">Set status to "Published"</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">✓</span>
                <span className="text-sm">Post appears on your blog!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.open('https://notion.so', '_blank')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Open Notion Workspace
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="text-lg px-8 py-3"
            asChild
          >
            <Link href="/notion-setup">
              Setup Instructions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Content Management Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Content Management Tips
            </CardTitle>
            <CardDescription>
              Best practices for managing your blog content in Notion
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Post Metadata</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Use the Title field for your post title</li>
                <li>• Add a Slug for SEO-friendly URLs</li>
                <li>• Write an Excerpt for post previews</li>
                <li>• Set Category and Tags for organization</li>
                <li>• Add Meta Title & Description for SEO</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Publishing Workflow</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Start with "Draft" status while writing</li>
                <li>• Use "Published" when ready to go live</li>
                <li>• Set Published Date for scheduling</li>
                <li>• Use headings for proper content structure</li>
                <li>• Add code blocks with language syntax</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Alert className="mt-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Already set up?</strong> Your Notion workspace is connected! 
            Go to your "Blog Posts" database in Notion to start writing. 
            Changes will automatically sync to your blog.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}