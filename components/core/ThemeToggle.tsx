'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // Determine current theme (handle system theme)
  const getCurrentTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };
  
  const toggleTheme = () => {
    const currentTheme = getCurrentTheme();
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 relative overflow-hidden"
      onClick={toggleTheme}
    >
      <div className="relative w-4 h-4">
        <Sun className="h-4 w-4 absolute inset-0 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-90 dark:scale-0" />
        <Moon className="h-4 w-4 absolute inset-0 rotate-90 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}