
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Icons } from "./icons";
import { UserAvatar } from "./user-avatar";

export function Header() {
  const { currentUser, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="hidden font-bold sm:inline-block text-lg">
            Campus Hub
          </span>
        </Link>
        <div className="flex-1 min-w-0 overflow-x-auto">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/thought-bubbles"
                className="text-foreground/60 transition-colors hover:text-foreground/80 whitespace-nowrap"
              >
                Bubbles
              </Link>
              <Link
                href="/directory"
                className="text-foreground/60 transition-colors hover:text-foreground/80 whitespace-nowrap"
              >
                Directory
              </Link>
               <Link
                href="/friends"
                className="text-foreground/60 transition-colors hover:text-foreground/80 whitespace-nowrap"
              >
                Friends
              </Link>
               <Link
                href="/chat"
                className="text-foreground/60 transition-colors hover:text-foreground/80 whitespace-nowrap"
              >
                Chat
              </Link>
              <Link
                href="/clicks"
                className="text-foreground/60 transition-colors hover:text-foreground/80 whitespace-nowrap"
              >
                Clicks
              </Link>
            </nav>
        </div>

        <div className="flex items-center space-x-2 pl-4">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : currentUser ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Profile</Link>
              </Button>
              <UserAvatar />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
