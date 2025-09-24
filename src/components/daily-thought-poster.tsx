
"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/hooks/use-auth";
import { draftDailyThought } from "@/ai/flows/draft-daily-thought";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2 } from "lucide-react";

interface DailyThoughtPosterProps {
    onThoughtPosted?: () => void;
    children: ReactNode;
}

export function DailyThoughtPoster({ onThoughtPosted, children }: DailyThoughtPosterProps) {
    const { postThought } = useAuth();
    const [thought, setThought] = useState("");
    const [isDrafting, startDrafting] = useTransition();
    const [isPosting, setIsPosting] = useState(false);
    const [isPosterOpen, setIsPosterOpen] = useState(false);
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

    const draftForm = useForm({
        defaultValues: { topic: "", mood: "" },
    });

    const handleDraftWithAI = async (values: { topic: string, mood: string}) => {
        startDrafting(async () => {
            const result = await draftDailyThought(values);
            setThought(result.thought);
            setIsAiDialogOpen(false);
        });
    };

    const handlePost = async () => {
        if (thought.trim()) {
            setIsPosting(true);
            await postThought(thought);
            setThought("");
            if (onThoughtPosted) {
                onThoughtPosted();
            }
            setIsPosting(false);
            setIsPosterOpen(false);
        }
    };
    
    return (
        <Dialog open={isPosterOpen} onOpenChange={setIsPosterOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share a Daily Thought</DialogTitle>
                    <DialogDescription>What's on your mind today? This thought will vanish in 24 hours.</DialogDescription>
                </DialogHeader>
                <Textarea 
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    placeholder="Share an update, an idea, or a question..." 
                    rows={4}
                />
                 <DialogFooter className="justify-between sm:justify-between">
                    <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Wand2 className="mr-2 h-4 w-4"/> Draft with AI</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>AI Thought Draft</DialogTitle>
                                <DialogDescription>Give the AI a topic and your mood to draft a thought.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={draftForm.handleSubmit(handleDraftWithAI)} className="space-y-4">
                                <div>
                                    <label htmlFor="topic" className="text-sm font-medium">Topic</label>
                                    <Input id="topic" {...draftForm.register("topic")} placeholder="e.g., upcoming exams" />
                                </div>
                                <div>
                                    <label htmlFor="mood" className="text-sm font-medium">Mood</label>
                                    <Input id="mood" {...draftForm.register("mood")} placeholder="e.g., optimistic" />
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                    <Button type="submit" disabled={isDrafting}>
                                        {isDrafting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Draft
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={handlePost} disabled={!thought.trim() || isPosting}>
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
