"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Mic,
  Volume2,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Star,
} from "lucide-react";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

const FeatureCard = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 ${className}`}
    whileHover={{ y: -4 }}
  >
    {children}
  </motion.div>
);

export const HomeUI = () => {
  const { status } = useSession();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/chat");
    }
  }, [status, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (status === "loading") {
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

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Modern animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: y1 }}
          className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gradient-to-l from-primary/15 via-primary/5 to-transparent blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Interactive cursor follower */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-primary/20 blur-sm pointer-events-none"
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
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Lunara
            </span>
          </motion.div>
          <AnimatedThemeToggler />
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative inline-block mb-8"
          >
            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center relative shadow-2xl shadow-primary/25">
              <Sparkles className="w-16 h-16 text-primary-foreground" />
              <motion.div
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 border-4 border-background shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black mb-6 tracking-tight"
          >
            Meet{" "}
            <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              Lunara
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Your intelligent AI companion designed to understand, assist, and
            engage with you in meaningful conversations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={() => router.push("/auth/signin")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group"
            >
              Start Chatting
              <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Badge
              variant="secondary"
              className="text-sm px-4 py-2 rounded-full bg-muted/50 border border-border/50"
            >
              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
              Free to use
            </Badge>
          </motion.div>
        </div>
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          <FeatureCard delay={0.1}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">Natural Conversations</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Engage in fluid, context-aware conversations that feel natural
                and meaningful. Lunara understands nuance and responds with
                empathy.
              </p>
            </div>
          </FeatureCard>

          <FeatureCard delay={0.2}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get instant responses powered by advanced AI technology with
                minimal latency.
              </p>
            </div>
          </FeatureCard>

          <FeatureCard delay={0.3}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                <Mic className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">Voice Interaction</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Speak naturally and hear responses with advanced voice
                recognition technology.
              </p>
            </div>
          </FeatureCard>

          <FeatureCard delay={0.4}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/20 flex items-center justify-center">
                <Volume2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">Audio Playback</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Listen to responses with high-quality text-to-speech and
                comprehensive audio controls.
              </p>
            </div>
          </FeatureCard>

          <FeatureCard delay={0.5}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold">Privacy First</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your conversations are secure and private, protected with
                enterprise-grade security.
              </p>
            </div>
          </FeatureCard>

          <FeatureCard delay={0.6}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                <Globe className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold">Always Available</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Access Lunara anytime, anywhere, on any device with seamless
                synchronization.
              </p>
            </div>
          </FeatureCard>
        </div>{" "}
        {/* Chat Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-card/80 backdrop-blur-xl border border-border/30 shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-3xl p-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <div>
                    <span className="text-lg font-semibold">Lunara AI</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-xs opacity-90">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary-foreground/40"></div>
                  <div className="w-3 h-3 rounded-full bg-primary-foreground/40"></div>
                  <div className="w-3 h-3 rounded-full bg-primary-foreground/40"></div>
                </div>
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm">
                Experience natural conversations with AI
              </CardDescription>
            </CardHeader>{" "}
            <CardContent className="p-0 bg-gradient-to-br from-background/95 to-muted/20 relative">
              {/* Chat messages container */}
              <div className="h-[28rem] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80 pointer-events-none z-10"></div>
                <div className="px-8 py-6 space-y-6 h-full overflow-y-auto scrollbar-hide">
                  {" "}
                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                    className="flex justify-end items-end space-x-3 mb-4"
                  >
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-6 py-4 max-w-sm shadow-lg relative">
                      <p className="text-sm leading-relaxed">
                        Hello! Can you help me plan my day?
                      </p>
                      <div className="text-xs opacity-70 mt-2">12:30 PM</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-semibold mb-1">
                      You
                    </div>
                  </motion.div>
                  {/* AI message */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    className="flex justify-start items-end space-x-3 mb-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg mb-1">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-md px-6 py-4 max-w-sm shadow-lg">
                      <p className="text-sm leading-relaxed text-foreground">
                        I&apos;d be happy to help you plan your day! What are
                        your main priorities and how much time do you have
                        available?
                      </p>
                      <div className="text-xs opacity-70 mt-2">12:30 PM</div>
                    </div>
                  </motion.div>
                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2 }}
                    className="flex justify-end items-end space-x-3 mb-4"
                  >
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-6 py-4 max-w-sm shadow-lg">
                      <p className="text-sm leading-relaxed">
                        I have meetings until 3 PM, then I&apos;m free.
                      </p>
                      <div className="text-xs opacity-70 mt-2">12:31 PM</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-semibold mb-1">
                      You
                    </div>
                  </motion.div>
                  {/* AI message with typing indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 }}
                    className="flex justify-start items-end space-x-3 mb-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg mb-1">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-md px-6 py-4 max-w-sm shadow-lg">
                      <p className="text-sm leading-relaxed text-foreground">
                        Perfect! Let&apos;s organize your afternoon. What tasks
                        or activities would you like to focus on after 3 PM?
                      </p>
                      <div className="text-xs opacity-70 mt-2">12:31 PM</div>
                    </div>
                  </motion.div>
                  {/* Typing indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3 }}
                    className="flex justify-start items-end space-x-3 mb-6"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg mb-1">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-bl-md px-6 py-4 shadow-lg">
                      <div className="flex space-x-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-muted-foreground/40"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-muted-foreground/40"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-muted-foreground/40"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              {/* Input area */}
              <div className="border-t border-border/30 bg-background/80 backdrop-blur-sm p-6 rounded-b-3xl">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-muted/50 rounded-2xl px-5 py-4 border border-border/30">
                    <div className="text-sm text-muted-foreground">
                      Type your message...
                    </div>
                  </div>
                  <Button size="sm" className="rounded-xl px-5 py-4 shadow-lg">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              {" "}
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
                &lt;1s
              </div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">
                ∞
              </div>
              <div className="text-sm text-muted-foreground">Possibilities</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 py-12 text-center border-t border-border/50 bg-muted/20 backdrop-blur-sm"
      >
        <div className="container mx-auto px-6">
          <p className="text-muted-foreground">
            &copy; 2025 Lunara. Crafted with care for meaningful conversations.
          </p>
        </div>
      </motion.footer>
    </div>
  );
};
