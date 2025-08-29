
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { getRecentClicks, toggleClickLike, cleanupExpiredClicks } from "@/lib/mock-data";
import type { Click } from "@/lib/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ImagePlus, Heart, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function ClickCard({ click, currentUserId, onLikeToggle }: { click: Click, currentUserId?: string, onLikeToggle: (clickId: string) => void }) {
    const isLiked = currentUserId ? (click.likes || []).includes(currentUserId) : false;

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentUserId) {
            onLikeToggle(click.id);
        }
    };
    
    return (
        <div className="h-full w-full snap-center relative flex-shrink-0">
            <Image 
                src={click.imageUrl} 
                alt={`Click by ${click.authorName}`} 
                fill 
                className="object-contain" 
                data-ai-hint="user content"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-0 left-0 p-4 bg-gradient-to-b from-black/50 to-transparent w-full">
                <Link href={`/profile/${click.authorId}`} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                        <AvatarImage src={click.authorProfilePicture} />
                        <AvatarFallback>{click.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-md font-semibold text-white truncate">{click.authorName}</p>
                </Link>
            </div>
            <div className="absolute bottom-0 right-0 p-4 flex flex-col items-center gap-4">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white" onClick={handleLikeClick} disabled={!currentUserId}>
                    <Heart className={cn("h-7 w-7 transition-all", isLiked ? "text-red-500 fill-current" : "text-white")} />
                </Button>
                <span className="text-white font-bold text-lg drop-shadow-md">{(click.likes || []).length}</span>
            </div>
        </div>
    )
}

function ClickReel({ clicks, currentUserId, onLikeToggle, sortMode }: { clicks: Click[], currentUserId?: string, onLikeToggle: (clickId: string) => void, sortMode: 'all' | 'rank' }) {
    const sortedClicks = [...clicks].sort((a, b) => {
        if (sortMode === 'rank') {
            return (b.likes?.length || 0) - (a.likes?.length || 0);
        }
        // @ts-ignore
        return (a.authorRollNo || 0) - (b.authorRollNo || 0);
    });

    if (sortedClicks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <ImagePlus size={64} className="mb-4" />
                <h3 className="text-xl font-semibold">No Clicks Yet</h3>
                <p>Share a moment from your Profile page!</p>
            </div>
        )
    }

    return (
         <div className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
            {sortedClicks.map(click => (
                <ClickCard key={click.id} click={click} currentUserId={currentUserId} onLikeToggle={onLikeToggle} />
            ))}
        </div>
    )
}


export default function ClicksPage() {
    const { currentUser } = useAuth();
    const [clicks, setClicks] = useState<Click[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortMode, setSortMode] = useState<'all' | 'rank'>('all');
    const hasRunCleanup = useRef(false);

    const fetchClicks = useCallback(async () => {
        setIsLoading(true);
        const recentClicks = await getRecentClicks();
        setClicks(recentClicks);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!hasRunCleanup.current) {
            cleanupExpiredClicks().then(() => {
                hasRunCleanup.current = true;
                fetchClicks();
            });
        } else {
             fetchClicks();
        }
    }, [fetchClicks]);
    
    const handleLikeToggle = async (clickId: string) => {
        if (!currentUser) return;
        
        // Optimistic update
        setClicks(prev => prev.map(click => {
            if (click.id === clickId) {
                const isLiked = (click.likes || []).includes(currentUser.id);
                const newLikes = isLiked
                    ? (click.likes || []).filter(id => id !== currentUser.id)
                    : [...(click.likes || []), currentUser.id];
                return { ...click, likes: newLikes };
            }
            return click;
        }));

        try {
            await toggleClickLike(clickId, currentUser.id);
        } catch (error) {
            console.error("Failed to toggle like on click:", error);
            // Revert on error
            fetchClicks();
        }
    }


    return (
        <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-black">
            <header className="absolute top-0 left-0 w-full p-4 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as any)} className="w-auto mx-auto bg-black/20 rounded-full p-1 border border-white/20">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="all" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full">
                                <Users className="mr-2"/> All
                            </TabsTrigger>
                            <TabsTrigger value="rank" className="text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full">
                                <TrendingUp className="mr-2" /> Rank
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </header>
            
            <main className="flex-1 relative">
                 {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                       <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                ) : (
                    <ClickReel clicks={clicks} currentUserId={currentUser?.id} onLikeToggle={handleLikeToggle} sortMode={sortMode}/>
                )}
            </main>
        </div>
    );
}
