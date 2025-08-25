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
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link
            href="/directory"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            Directory
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : currentUser ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserAvatar />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
