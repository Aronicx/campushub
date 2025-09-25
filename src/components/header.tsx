
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Icons } from "./icons";
import { UserAvatar } from "./user-avatar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Droplets, Users, BookUser, MessageSquareText, User, Bell, BookCopy } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Notifications } from "./notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";


const navLinks = [
    { href: "/notes", icon: BookCopy, label: "Notes" },
    { href: "/chat", icon: MessageSquareText, label: "Chat" },
];

export function Header() {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="font-bold hidden sm:inline-block text-lg">Campus Hub</span>
        </Link>
        
        {isClient && (
            <TooltipProvider>
                <div className="flex-1 min-w-0">
                    <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                        {navLinks.map((link) => (
                            <Tooltip key={link.href}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        asChild
                                        variant={pathname.startsWith(link.href) ? "default" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "rounded-full",
                                            !pathname.startsWith(link.href) && "text-muted-foreground hover:text-foreground"
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
                         {currentUser && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button 
                                    variant={pathname.startsWith('/directory') || pathname.startsWith('/thought-bubbles') || pathname.startsWith('/friends') ? "secondary" : "ghost"}
                                    className="rounded-full px-4"
                                >
                                    <Users className="h-5 w-5 mr-2" /> Social
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem asChild>
                                        <Link href="/directory"><BookUser className="mr-2"/>Directory</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/thought-bubbles"><Droplets className="mr-2"/>Bubbles</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/friends"><Users className="mr-2"/>Friends</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         )}
                    </nav>
                </div>

                <div className="flex items-center space-x-2 pl-4">
                    {isLoading ? (
                        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                    ) : currentUser ? (
                        <>
                            <Notifications />
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
        )}
      </div>
    </header>
  );
}
