'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AudioControls() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="flex items-center space-x-1">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className={cn(
            'h-9 w-9 rounded-xl transition-colors',
            isMuted && 'text-red-500'
          )}
          style={isMuted ? {
            background: `oklch(62% 0.204 29 / 0.1)`
          } : {}}
        >
          <motion.div
            animate={isMuted ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </motion.div>
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleListening}
          className={cn(
            'h-9 w-9 rounded-xl transition-colors',
            isListening && 'text-green-500'
          )}
          style={isListening ? {
            background: `oklch(65% 0.15 145 / 0.1)`
          } : {}}
        >
          <motion.div
            animate={isListening ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
          >
            <Headphones className="h-4 w-4" />
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}