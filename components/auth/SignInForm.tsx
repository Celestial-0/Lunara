'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {  Mail, Loader2, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { FaGoogle } from "react-icons/fa";
//FcGoogle is not used, using FaGoogle instead
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account');
        }

        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/chat');
        } else {
          throw new Error('Failed to sign in after signup');
        }
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/chat');
        } else {
          throw new Error('Invalid email or password');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/chat' });
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden animated-bg">
      {/* Enhanced animated background with OKLCH */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{
            background: `oklch(from var(--primary) l c h / 0.05)`
          }}
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `oklch(from var(--primary) calc(l + 0.1) c h / 0.03)`
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-6"
      >
        <div className="container mx-auto flex justify-between items-center">
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
          <AnimatedThemeToggler />
        </div>
      </motion.header>

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glass-effect border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `linear-gradient(135deg, oklch(from var(--primary) l c h), oklch(from var(--primary) calc(l + 0.1) c h / 0.6))`
                }}
              >
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              
              <CardTitle className="text-2xl font-bold">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription>
                {isSignUp 
                  ? 'Create your account to start chatting with Lunara'
                  : 'Sign in to continue your conversation with Lunara'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl btn-secondary"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaGoogle className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl input-enhanced"
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl pr-12 input-enhanced"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl btn-primary" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}