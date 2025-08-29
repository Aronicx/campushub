
"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThoughtWithAuthor } from "@/app/thought-bubbles/page";

interface ThoughtCardProps {
    thought: ThoughtWithAuthor;
    currentUserId?: string;
    onLikeToggle: (authorId: string, thoughtId: string) => void;
}

export function ThoughtCard({ thought, currentUserId, onLikeToggle }: ThoughtCardProps) {
    const initials = (thought.author.name || "NN").split(" ").map((n) => n[0]).join("");
    const isLiked = currentUserId ? thought.likes.includes(currentUserId) : false;

    const handleLikeClick = () => {
        if (currentUserId) {
            onLikeToggle(thought.author.id, thought.id);
        }
    }

    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={thought.author.profilePicture || undefined} alt={thought.author.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${thought.author.id}`} className="font-semibold hover:underline">
                        {thought.author.name}
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <p className="text-card-foreground break-words">{thought.content}</p>
            </CardContent>
            <CardFooter className="px-4 py-2 bg-muted/50 flex justify-between items-center">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays size={14} /> 
                    {formatDistanceToNow(new Date(thought.timestamp), { addSuffix: true })}
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleLikeClick} 
                        disabled={!currentUserId}
                        className="flex items-center gap-1.5"
                    >
                        <Heart className={cn("h-4 w-4", isLiked ? "text-red-500 fill-current" : "text-muted-foreground")} />
                        <span className="text-muted-foreground font-normal">{thought.likes.length}</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
