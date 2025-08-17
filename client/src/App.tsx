import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AdminProvider } from "@/hooks/use-admin";
import Home from "@/pages/home";
import Post from "@/pages/post";
import CreatePost from "@/pages/create-post";
import CreateMarkdownPost from "@/pages/create-markdown-post";
import AIDashboard from "@/pages/ai-dashboard";
import EnhancedAIDashboard from "@/pages/enhanced-ai-dashboard";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";
import { Analytics } from "@vercel/analytics/react"

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post/:slug" component={Post} />
      <Route path="/create-post" component={CreatePost} />
      <Route path="/create-markdown" component={CreateMarkdownPost} />
      <Route path="/ai-dashboard" component={AIDashboard} />
      <Route path="/enhanced-ai-dashboard" component={EnhancedAIDashboard} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/category/:category" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
}

export default App;
