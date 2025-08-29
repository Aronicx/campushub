
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { getRecentClicks, addClick, getClicksByAuthor, cleanupExpiredClicks } from "@/lib/mock-data";
import type { Click, Student } from "@/lib/types";
import { resizeAndCompressImage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import Link from "next/link";


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
        if (!currentUser) return;
        getClicksByAuthor(currentUser.id).then(clicks => {
            setUserClickCount(clicks.length);
        });
    }, [currentUser, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 1024 * 1024) { // 1MB limit
                toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image smaller than 1MB.' });
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
                    <Upload className="mr-2" /> Upload Click
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

function ClicksGrid({ clicks }: { clicks: Click[] }) {
    if (clicks.length === 0) {
        return (
            <Card className="text-center p-8 border-dashed col-span-full">
                <p className="text-muted-foreground">No Clicks from the last 24 hours. Be the first to share one!</p>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {clicks.map(click => (
                <Card key={click.id} className="group relative overflow-hidden aspect-[9/16]">
                    <Image src={click.imageUrl} alt={`Click by ${click.authorName}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint="user content" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-3 w-full">
                         <Link href={`/profile/${click.authorId}`} className="flex items-center gap-2">
                             <Avatar className="h-8 w-8 border-2 border-primary">
                                <AvatarImage src={click.authorProfilePicture} />
                                <AvatarFallback>{click.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-semibold text-white truncate">{click.authorName}</p>
                         </Link>
                    </div>
                </Card>
            ))}
        </div>
    )
}

export default function ClicksPage() {
    const { currentUser } = useAuth();
    const [clicks, setClicks] = useState<Click[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasRunCleanup = useRef(false);

    const fetchClicks = useCallback(async () => {
        setIsLoading(true);
        const recentClicks = await getRecentClicks();
        setClicks(recentClicks);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Run cleanup only once per component mount
        if (!hasRunCleanup.current) {
            cleanupExpiredClicks().then(() => {
                hasRunCleanup.current = true;
                // Fetch clicks after cleanup
                fetchClicks();
            });
        } else {
             fetchClicks();
        }
    }, [fetchClicks]);

    const handleUploadSuccess = (newClick: Click) => {
        setClicks(prevClicks => [newClick, ...prevClicks]);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-4xl font-bold tracking-tight text-primary">Clicks</h1>
                    <p className="mt-2 text-lg text-muted-foreground">A 24-hour gallery of campus life.</p>
                </div>
                {currentUser && <UploadDialog onUploadSuccess={handleUploadSuccess} />}
            </div>
            
            {isLoading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {[...Array(10)].map((_, i) => <Skeleton key={i} className="rounded-lg aspect-[9/16]" />)}
                 </div>
            ) : (
                <ClicksGrid clicks={clicks} />
            )}
        </div>
    );
}
