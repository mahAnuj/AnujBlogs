import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import Home from "@/pages/home";
import Post from "@/pages/post";
import CreatePost from "@/pages/create-post";
import CreateMarkdownPost from "@/pages/create-markdown-post";
import AIDashboard from "@/pages/ai-dashboard";
import NotionSetup from "@/pages/notion-setup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post/:slug" component={Post} />
      <Route path="/create-post" component={CreatePost} />
      <Route path="/create-markdown" component={CreateMarkdownPost} />
      <Route path="/ai-dashboard" component={AIDashboard} />
      <Route path="/notion-setup" component={NotionSetup} />
      <Route path="/category/:category" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
