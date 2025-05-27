"use client"

import { useSignature } from '@/hooks';
import { Link } from 'react-router-dom'

export default function LandingPageHeader() {
  const { isConnected } = useSignature();
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm text-white">D</span>
          </div>
          <span className="text-xl font-bold">dpolls</span>
        </div>
        </Link>
        {isConnected &&
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/polls/live" className="text-muted-foreground hover:text-foreground">
              Live Polls
            </Link>
            <Link to="/polls/new" className="text-muted-foreground hover:text-foreground">
              Create Poll
            </Link>
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          </nav>
        }
      </div>
    </header>
  );
}    