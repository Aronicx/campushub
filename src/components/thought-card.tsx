
"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, Heart, MessageSquare, Trash2, Edit, Send, X, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ThoughtWithAuthor } from "@/app/thought-bubbles/page";
import type { Student, Comment } from "@/lib/types";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { addOrUpdateComment, deleteComment } from "@/lib/mock-data";


interface ThoughtCardProps {
    thought: ThoughtWithAuthor;
    currentUserId?: string;
    currentUser?: Student | null;
    onLikeToggle: (authorId: string, thoughtId: string) => void;
    onCommentUpdate: (thoughtId: string, updatedComments: Comment[]) => void;
    onThoughtDelete: (authorId: string, thoughtId: string) => void;
    onThoughtUpdate: (authorId: string, thoughtId: string, newContent: string) => void;
}

function CommentItem({ comment, thought, currentUser, onCommentUpdate }: {
    comment: Comment;
    thought: ThoughtWithAuthor;
    currentUser?: Student | null;
    onCommentUpdate: (thoughtId: string, updatedComments: Comment[]) => void;
}) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isPending, startTransition] = useTransition();

    const initials = (comment.authorName || "NN").split(" ").map((n) => n[0]).join("");
    const isCommentAuthor = currentUser?.id === comment.authorId;

    const handleUpdateComment = () => {
        if (!currentUser || !editContent.trim()) return;

        startTransition(async () => {
            try {
                const updatedComments = await addOrUpdateComment(thought.author.id, thought.id, currentUser, editContent);
                if (updatedComments) {
                    onCommentUpdate(thought.id, updatedComments);
                    toast({ title: "Comment updated!" });
                    setIsEditing(false);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to update comment." });
            }
        });
    }

    const handleDeleteComment = () => {
        if (!currentUser) return;
        startTransition(async () => {
             try {
                const updatedComments = await deleteComment(thought.author.id, thought.id, currentUser.id);
                if (updatedComments) {
                    onCommentUpdate(thought.id, updatedComments);
                    toast({ title: "Comment deleted." });
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to delete comment." });
            } finally {
                setIsDeleting(false);
            }
        });
    }

    return (
        <div className="flex items-start gap-3 py-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.authorProfilePicture} alt={comment.authorName} />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                         <Link href={`/profile/${comment.authorId}`} className="font-semibold text-sm hover:underline">
                            {comment.authorName}
                        </Link>
                         <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                   {isCommentAuthor && !isEditing && (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}><Edit size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsDeleting(true)}><Trash2 size={14} /></Button>
                        </div>
                   )}
                </div>
                 {isEditing ? (
                    <div className="mt-2 space-y-2">
                        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleUpdateComment} disabled={isPending}>Update</Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-card-foreground/90 mt-1 break-words">{comment.content}</p>
                )}
            </div>
             <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteComment} disabled={isPending} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function CommentForm({ thought, currentUser, onCommentUpdate }: {
    thought: ThoughtWithAuthor;
    currentUser: Student | null;
    onCommentUpdate: (thoughtId: string, updatedComments: Comment[]) => void;
}) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const userComment = thought.comments.find(c => c.authorId === currentUser?.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !content.trim()) return;

        startTransition(async () => {
            try {
                const updatedComments = await addOrUpdateComment(thought.author.id, thought.id, currentUser, content);
                if (updatedComments) {
                    onCommentUpdate(thought.id, updatedComments);
                    toast({ title: userComment ? "Comment updated!" : "Comment posted!" });
                    setContent("");
                }
            } catch (error) {
                 toast({ variant: "destructive", title: "Failed to post comment." });
            }
        });
    }

    if (userComment) return null; // Don't show form if user already commented
    if (!currentUser) return null;

    return (
        <form onSubmit={handleSubmit} className="flex items-start gap-3 pt-4">
             <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.profilePicture} alt={currentUser.name || ''} />
                <AvatarFallback>{(currentUser.name || "NN").split(" ").map((n) => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <Textarea 
                placeholder="Write a comment..." 
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={2}
                className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isPending || !content.trim()}>
                <Send size={16} />
            </Button>
        </form>
    )

}

export function ThoughtCard({ thought, currentUserId, currentUser, onLikeToggle, onCommentUpdate, onThoughtDelete, onThoughtUpdate }: ThoughtCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editContent, setEditContent] = useState(thought.content);
    const [isPending, startTransition] = useTransition();

    const initials = (thought.author.name || "NN").split(" ").map((n) => n[0]).join("");
    const isLiked = currentUserId ? thought.likes.includes(currentUserId) : false;
    const isAuthor = currentUserId === thought.author.id;

    const handleLikeClick = () => {
        if (currentUserId) {
            onLikeToggle(thought.author.id, thought.id);
        }
    }
    
    const handleUpdateThought = () => {
        if (!editContent.trim() || editContent === thought.content) {
            setIsEditing(false);
            return;
        };
        startTransition(() => {
            onThoughtUpdate(thought.author.id, thought.id, editContent);
            setIsEditing(false);
        })
    }
    
    const handleDeleteThought = () => {
        startTransition(() => {
            onThoughtDelete(thought.author.id, thought.id);
            setIsDeleting(false);
        });
    }

    return (
        <Card>
            <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                    <Avatar>
                        <AvatarImage src={thought.author.profilePicture || undefined} alt={thought.author.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                     <div className="flex-1">
                        <Link href={`/profile/${thought.author.id}`} className="font-semibold hover:underline">
                            {thought.author.name}
                        </Link>
                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={14} /> 
                            {formatDistanceToNow(new Date(thought.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                    {isAuthor && !isEditing && (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}><Edit size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => setIsDeleting(true)}><Trash2 size={14} /></Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                 {isEditing ? (
                    <div className="space-y-2">
                        <Textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)} 
                            rows={3} 
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditContent(thought.content); }}>
                                <X className="mr-1.5" size={16}/> Cancel
                            </Button>
                             <Button size="sm" onClick={handleUpdateThought} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-1.5 animate-spin" size={16} /> : <Check className="mr-1.5" size={16} />}
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-card-foreground break-words">{thought.content}</p>
                )}
            </CardContent>
            <CardFooter className="px-4 py-2 bg-muted/50 flex justify-between items-center">
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
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-normal text-sm">{thought.comments.length}</span>
                    </div>
                </div>
            </CardFooter>
            <Collapsible>
                 <CollapsibleContent className="p-4 border-t">
                    <CommentForm thought={thought} currentUser={currentUser} onCommentUpdate={onCommentUpdate} />
                    <div className="divide-y">
                        {thought.comments
                            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map(comment => (
                                <CommentItem key={comment.id} comment={comment} thought={thought} currentUser={currentUser} onCommentUpdate={onCommentUpdate} />
                        ))}
                    </div>
                 </CollapsibleContent>
                 <div className="px-4 pb-2">
                     <CollapsibleTrigger asChild>
                         <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
                             {thought.comments.length > 0 ? 'View all comments' : 'Be the first to comment'}
                         </Button>
                     </CollapsibleTrigger>
                 </div>
            </Collapsible>
            
             <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this thought?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this thought from your profile.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteThought} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                             {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
