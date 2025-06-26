'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Sidebar } from '@/components/chat/Sidebar';

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to signin
  }

  return (
    <div className="h-screen flex relative">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isMobile={true} 
        />
      )}
      
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface 
          isMobile={isMobile}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}