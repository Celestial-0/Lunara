"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isMobile?: boolean;
}

export function TypingIndicator({ isMobile = false }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className={cn(
        "flex gap-2 md:gap-3 lg:gap-4 w-full",
        isMobile
          ? "max-w-[calc(100%-3rem)]"
          : "max-w-[calc(100%-4rem)] md:max-w-[calc(100%-5rem)]"
      )}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex-shrink-0"
      >
        <Avatar
          className={cn(
            "border-2 border-primary/20",
            isMobile ? "h-6 w-6 md:h-8 md:w-8" : "h-8 w-8 md:h-10 md:w-10"
          )}
        >
          <AvatarImage src="https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Lunara%20AI%20Icon.PNG" />{" "}
          <AvatarFallback className="bg-primary/10">
            <Sparkles
              className={cn(
                "text-primary",
                isMobile ? "w-3 h-3 md:w-4 md:h-4" : "w-4 h-4 md:w-5 md:h-5"
              )}
            />
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex flex-col items-start min-w-0 flex-1">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={cn(
            "bg-secondary text-secondary-foreground rounded-2xl md:rounded-3xl rounded-bl-lg shadow-lg",
            isMobile ? "px-3 py-2 md:px-4 md:py-3" : "px-4 py-3 md:px-6 md:py-4"
          )}
        >
          <div className="flex space-x-1 md:space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  "rounded-full",
                  isMobile
                    ? "w-1 h-1 md:w-1.5 md:h-1.5"
                    : "w-1.5 h-1.5 md:w-2 md:h-2"
                )}
                style={{
                  background: `oklch(from var(--primary) l c h)`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "text-muted-foreground mt-1 md:mt-2 ml-2",
            isMobile ? "text-xs" : "text-xs"
          )}
        >
          Lunara is thinking...
        </motion.span>
      </div>
    </motion.div>
  );
}
