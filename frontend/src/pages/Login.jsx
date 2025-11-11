import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sun, Moon, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { login, loading, error, clearError } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    // Use email as username for login
    const credentials = {
      username: formData.email,
      password: formData.password
    };

    const result = await login(credentials);
    
    if (result.success) {
      toast.success('Login successful!');
      
      // Redirect based on role
      if (result.user.role === 'super_admin') {
        navigate('/super-admin/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/dashboard');
      } else if (result.user.role === 'employee') {
        navigate('/employee/dashboard');
      }
    } else {
      toast.error(result.error || 'Invalid credentials', {
        duration: 5000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-primary/10 dark:bg-grid-primary/10 bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 dark:bg-primary/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-primary/20 dark:bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 h-10 w-10 z-20 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:border dark:border-gray-600"
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </Button>

      <div className="w-full max-w-md relative z-10">
        {/* Enhanced Logo/Brand Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 dark:bg-primary/20 blur-2xl rounded-full"></div>
              <img 
                src="/elevate-logo.png" 
                alt="Elevate Logo" 
                className="w-32 h-32 mx-auto mb-6 drop-shadow-2xl relative z-10"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground dark:text-white tracking-tight drop-shadow-lg">Elevate</h1>
              <p className="text-lg text-muted-foreground dark:text-gray-300 font-medium">HR Management System</p>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary mx-auto rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-2 border-gray-200 dark:border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm dark:shadow-[0_20px_60px_rgba(20,217,190,0.2)]">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Welcome Back
            </CardTitle>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Sign in to continue</p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 dark:bg-gray-700/50 dark:border-gray-600"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 dark:bg-gray-700/50 dark:border-gray-600"
                    required
                  />
                </div>
              </div>

              {/* Default Credentials Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  💡 Default Credentials
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                  <p><span className="font-medium">Element Tree Admin:</span> admin@company.com / password</p>
                  <p><span className="font-medium">Super Admin:</span> superadmin@elevate.com / SuperAdmin@123</p>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Sign Up Link */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <a 
                    href="/pricing" 
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Sign Up
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
