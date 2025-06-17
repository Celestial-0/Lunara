'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Mic, Volume2, Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const BentoCard = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`bento-item ${className}`}
    whileHover={{ y: -4 }}
  >
    {children}
  </motion.div>
);

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      duration: 0.8, 
      delay,
      type: "spring",
      stiffness: 100
    }}
    whileHover={{ scale: 1.05 }}
    className="absolute"
  >
    {children}
  </motion.div>
);

export const HomeUI = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/chat');
    }
  }, [status, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden animated-bg">
      {/* Enhanced animated background elements with OKLCH */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: y1 }}
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{
            background: `oklch(from var(--primary) l c h / 0.05)`
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `oklch(from var(--primary) calc(l + 0.1) c h / 0.03)`
          }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Enhanced cursor follower with OKLCH */}
        <motion.div
          className="absolute w-4 h-4 rounded-full blur-sm pointer-events-none"
          style={{
            background: `oklch(from var(--primary) l c h / 0.2)`
          }}
          animate={{
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-6"
      >
        <div className="container mx-auto flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `oklch(from var(--primary) l c h)`
              }}
            >
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Lunara</span>
          </motion.div>
          <ThemeToggle />
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative inline-block mb-8"
          >
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, oklch(from var(--primary) l c h), oklch(from var(--primary) calc(l + 0.1) c h / 0.6))`
              }}
            >
              <Sparkles className="w-12 h-12 text-primary-foreground" />
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-background status-online"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6 text-balance"
          >
            Meet{' '}
            <span className="gradient-text">
              Lunara
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance"
          >
            Your intelligent AI companion designed to understand, assist, and engage with you in meaningful conversations.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => router.push('/auth/signin')}
              className="btn-primary px-8 py-6 text-lg rounded-2xl group"
            >
              Start Chatting
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        {/* Enhanced Bento Grid Features */}
        <div className="bento-grid mb-20">
          <BentoCard className="md:col-span-2" delay={0.1}>
            <div className="flex items-start space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`
                }}
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Natural Conversations</h3>
                <p className="text-muted-foreground">
                  Engage in fluid, context-aware conversations that feel natural and meaningful. 
                  Lunara understands nuance and responds with empathy.
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard delay={0.2}>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`
                }}
              >
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm">
                Get instant responses powered by advanced AI technology.
              </p>
            </div>
          </BentoCard>

          <BentoCard delay={0.3}>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`
                }}
              >
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice Interaction</h3>
              <p className="text-muted-foreground text-sm">
                Speak naturally and hear responses with advanced voice recognition.
              </p>
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2" delay={0.4}>
            <div className="flex items-start space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`
                }}
              >
                <Volume2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Audio Playback</h3>
                <p className="text-muted-foreground">
                  Listen to responses with high-quality text-to-speech and comprehensive audio controls 
                  for the perfect listening experience.
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard delay={0.5}>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`
                }}
              >
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground text-sm">
                Your conversations are secure and private, always.
              </p>
            </div>
          </BentoCard>

          <BentoCard delay={0.6}>
            <div className="text-center">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `oklch(from var(--primary) l c h / 0.1)`
                }}
              >
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Always Available</h3>
              <p className="text-muted-foreground text-sm">
                Access Lunara anytime, anywhere, on any device.
              </p>
            </div>
          </BentoCard>
        </div>

        {/* Enhanced Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="card-elevated border-0 shadow-2xl overflow-hidden">
            <CardHeader 
              className="text-primary-foreground"
              style={{
                background: `linear-gradient(135deg, oklch(from var(--primary) l c h), oklch(from var(--primary) calc(l + 0.1) c h / 0.8))`
              }}
            >
              <CardTitle className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `oklch(from var(--primary-foreground) l c h / 0.2)`
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Chat Preview</span>
              </CardTitle>
              <CardDescription 
                className="opacity-90"
                style={{ color: `oklch(from var(--primary-foreground) l c h / 0.8)` }}
              >
                See how conversations flow naturally with Lunara
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="flex justify-end"
                >
                  <div className="message-user rounded-3xl rounded-br-lg px-6 py-3 max-w-xs">
                    Hello! Can you help me plan my day?
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex justify-start"
                >
                  <div className="message-assistant rounded-3xl rounded-bl-lg px-6 py-3 max-w-xs">
                    I'd be happy to help you plan your day! What are your main priorities and how much time do you have available?
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2 }}
                  className="flex justify-end"
                >
                  <div className="message-user rounded-3xl rounded-br-lg px-6 py-3 max-w-xs">
                    I have meetings until 3 PM, then I'm free.
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.5 }}
                  className="flex justify-start"
                >
                  <div className="message-assistant rounded-3xl rounded-bl-lg px-6 py-3 max-w-xs">
                    Perfect! Let's organize your afternoon. What tasks or activities would you like to focus on after 3 PM?
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 py-12 text-center text-muted-foreground"
      >
        <p>&copy; 2025 Lunara. Crafted with care for meaningful conversations.</p>
      </motion.footer>
    </div>
  );
};