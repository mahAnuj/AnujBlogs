import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Lock, Shield } from 'lucide-react';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin, login } = useAdmin();
  const { toast } = useToast();

  // Redirect if already admin
  if (isAdmin) {
    setLocation('/ai-dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = login(password);
    
    if (success) {
      toast({
        title: "Access granted",
        description: "Welcome to the admin dashboard",
      });
      setLocation('/ai-dashboard');
    } else {
      toast({
        title: "Access denied",
        description: "Invalid admin password",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      <main className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Enter admin password to access AI dashboard
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !password}
              >
                {isLoading ? 'Authenticating...' : 'Access Dashboard'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-primary hover:underline">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}