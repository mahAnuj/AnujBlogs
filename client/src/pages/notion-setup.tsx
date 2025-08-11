import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ExternalLink, AlertCircle, Copy } from "lucide-react";
import { useState } from "react";

export default function NotionSetup() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Set Up Notion CMS Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect your blog to Notion to write and manage content in a familiar interface.
            Follow these steps to complete the integration.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                Create Notion Integration
              </CardTitle>
              <CardDescription>
                Set up a new integration in your Notion workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  1. Go to Notion integrations page
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mb-3"
                  onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Notion Integrations
                </Button>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  2. Click "New integration" and name it "TechStack Blog"
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  3. Copy the integration secret (this will be your NOTION_INTEGRATION_SECRET)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                Create or Share Notion Page
              </CardTitle>
              <CardDescription>
                Set up a page where your blog content will be stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  1. Create a new page in Notion or use an existing one
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  2. Click the "..." menu on the page → "Connections" → Add your integration
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  3. Copy the page URL (this will be your NOTION_PAGE_URL)
                </p>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Make sure to share the page with your integration in step 2. 
                  Without this, the blog won't be able to access your Notion content.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                Add Secrets to Replit
              </CardTitle>
              <CardDescription>
                Configure your environment variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  1. Go to Replit Secrets (in the sidebar)
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  2. Add these two secrets:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded border">
                    <code className="text-sm">NOTION_INTEGRATION_SECRET</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard('NOTION_INTEGRATION_SECRET')}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded border">
                    <code className="text-sm">NOTION_PAGE_URL</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard('NOTION_PAGE_URL')}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                Test the Integration
              </CardTitle>
              <CardDescription>
                Verify everything is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Once you've completed the steps above:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  1. The blog will automatically create a "Blog Posts" database in your Notion page
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  2. Sample blog posts will be added to help you get started
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  3. You can then write new posts directly in Notion and they'll appear on your blog
                </p>
              </div>
              
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  After setup, refresh this page and you should see your blog posts from Notion!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => window.location.reload()} size="lg">
            Test Integration & Refresh
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click this button after completing all steps to test the connection
          </p>
        </div>
      </main>
    </div>
  );
}