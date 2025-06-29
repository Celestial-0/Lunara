'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  className?: string;
  isMobile?: boolean;
}

export function AudioControls({ className, isMobile = false }: AudioControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const buttonSize = isMobile ? "sm" : "sm";
  const iconSize = isMobile ? "h-4 w-4" : "h-4 w-4";

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1 md:gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size={buttonSize}
                onClick={toggleMute}
                className={cn(
                  'h-9 w-9 md:h-10 md:w-10 rounded-xl transition-all duration-200',
                  isMuted && 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                )}
              >
                <motion.div
                  animate={isMuted ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isMuted ? (
                    <VolumeX className={iconSize} />
                  ) : (
                    <Volume2 className={iconSize} />
                  )}
                </motion.div>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMuted ? "Unmute audio" : "Mute audio"}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size={buttonSize}
                onClick={toggleListening}
                className={cn(
                  'h-9 w-9 md:h-10 md:w-10 rounded-xl transition-all duration-200',
                  isListening && 'text-green-500 bg-green-500/10 hover:bg-green-500/20'
                )}
              >
                <motion.div
                  animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
                >
                  <Headphones className={iconSize} />
                </motion.div>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? "Stop listening" : "Start listening"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}