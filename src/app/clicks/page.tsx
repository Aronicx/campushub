
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { getRecentClicks, addClick, getClicksByAuthor, cleanupExpiredClicks, toggleClickLike } from "@/lib/mock-data";
import type { Click, Student } from "@/lib/types";
import { resizeAndCompressImage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Loader2, ImagePlus, Heart, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function UploadDialog({ onUploadSuccess }: { onUploadSuccess: (newClick: Click) => void }) {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [userClickCount, setUserClickCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentUser || !isOpen) return;
        getClicksByAuthor(currentUser.id).then(clicks => {
            setUserClickCount(clicks.length);
        });
    }, [currentUser, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit, server can handle larger files now
                toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image smaller than 10MB.' });
                return;
            }
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUser) return;
        setIsUploading(true);
        try {
            const compressedDataUrl = await resizeAndCompressImage(file, 1080, 1920, 0.8);
            const newClick = await addClick(currentUser, compressedDataUrl);
            onUploadSuccess(newClick);
            toast({ title: 'Click posted!', description: 'Your image is now visible to others.' });
            handleClose();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsOpen(false);
    }
    
    if (!currentUser) return null;

    const clicksLeft = 10 - userClickCount;
    const canUpload = clicksLeft > 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2" /> Share a Click
                </Button>
            </DialogTrigger>
            <DialogContent onInteractOutside={(e) => {if(isUploading) e.preventDefault()}}>
                <DialogHeader>
                    <DialogTitle>Share a Click</DialogTitle>
                    <DialogDescription>
                        Upload an image to share with the campus. It will disappear in 24 hours.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">You have {clicksLeft} clicks left for today.</p>
                        <Progress value={(userClickCount / 10) * 100} className="w-full h-2" />
                    </div>

                    {!preview ? (
                        <div 
                            className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 cursor-pointer hover:bg-muted/50"
                             onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Click to browse or drag & drop</p>
                            <p className="text-xs text-muted-foreground/80">PNG, JPG, WEBP up to 1MB</p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={!canUpload || isUploading}
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <Image src={preview} alt="Image preview" width={500} height={500} className="rounded-md object-contain max-h-[400px]" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setPreview(null); setFile(null); }} disabled={isUploading}>
                                <X size={16}/>
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" onClick={handleClose} disabled={isUploading}>Cancel</Button></DialogClose>
                    <Button onClick={handleUpload} disabled={!file || !canUpload || isUploading}>
                        {isUploading ? <><Loader2 className="mr-2 animate-spin" /> Uploading...</> : <>Post Click</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

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
                <p>Be the first one to share a moment!</p>
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

    const handleUploadSuccess = (newClick: Click) => {
        setClicks(prevClicks => [newClick, ...prevClicks]);
    }
    
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
                    
                    <div className="absolute right-4 top-4">
                        {currentUser && <UploadDialog onUploadSuccess={handleUploadSuccess} />}
                    </div>
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
