
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Icons } from "./icons";
import { UserAvatar } from "./user-avatar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Droplets, Users, BookUser, MessageSquareText, Camera, User, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Notifications } from "./notifications";

const navLinks = [
    { href: "/thought-bubbles", icon: Droplets, label: "Bubbles" },
    { href: "/directory", icon: BookUser, label: "Directory" },
    { href: "/friends", icon: Users, label: "Friends" },
    { href: "/chat", icon: MessageSquareText, label: "Chat" },
    { href: "/clicks", icon: Camera, label: "Clicks" },
];

export function Header() {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Icons.logo className="h-8 w-8 text-primary" />
                        <span className="hidden font-bold sm:inline-block text-lg">
                            Campus Hub
                        </span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold">Campus Hub</p>
                    <p className="text-sm text-muted-foreground">Connect, share, and chat with your college community.</p>
                </TooltipContent>
            </Tooltip>
        
          <div className="flex-1 min-w-0">
            <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                {navLinks.map((link) => (
                     <Tooltip key={link.href}>
                        <TooltipTrigger asChild>
                            <Button 
                                asChild
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "text-muted-foreground hover:text-foreground",
                                    pathname.startsWith(link.href) && "text-primary"
                                )}
                            >
                                <Link href={link.href}>
                                    <link.icon className="h-5 w-5" />
                                    <span className="sr-only">{link.label}</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{link.label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 pl-4">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            ) : currentUser ? (
              <>
                  <Notifications />
                   <Tooltip>
                      <TooltipTrigger asChild>
                           <Button asChild variant="ghost" size="icon">
                              <Link href="/dashboard">
                                  <User className="h-5 w-5" />
                                  <span className="sr-only">Profile</span>
                              </Link>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Profile</p>
                      </TooltipContent>
                  </Tooltip>
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
        </TooltipProvider>
      </div>
    </header>
  );
}
