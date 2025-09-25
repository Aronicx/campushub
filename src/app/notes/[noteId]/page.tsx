
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getNoteById, updateNote } from '@/lib/mock-data';
import type { Note } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Save, Loader2, User, Key, Link2, FileText, Type } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const editNoteSchema = z.object({
  heading: z.string().min(1, "Heading is required"),
  description: z.string().max(50, "Description must be 50 characters or less"),
  link: z.string().url("Please enter a valid URL"),
});


export default function NoteEditorPage() {
  const { currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof editNoteSchema>>({
    resolver: zodResolver(editNoteSchema),
  });
  
  useEffect(() => {
    if (!noteId) return;

    async function fetchNote() {
      setIsLoading(true);
      const noteData = await getNoteById(noteId);
      if (noteData) {
        setNote(noteData);
        if (noteData.authorId === currentUser?.id) {
            setIsAuthorized(true);
        } else {
             toast({ variant: 'destructive', title: 'Unauthorized', description: "You don't have permission to edit this note." });
             router.push('/notes');
        }
        form.reset({
            heading: noteData.heading,
            description: noteData.description,
            link: noteData.link,
        });
      } else {
        toast({ variant: 'destructive', title: 'Note not found.' });
        router.push('/notes');
      }
      setIsLoading(false);
    }
    
    if (currentUser) {
        fetchNote();
    }
  }, [noteId, router, toast, currentUser, form]);

  async function onSubmit(values: z.infer<typeof editNoteSchema>) {
    if (!note) return;
    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.id, values);
      if (updatedNote) {
        setNote(updatedNote);
        toast({ title: 'Note Updated!', description: 'Your changes have been saved.' });
        form.reset(values);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || !note || !isAuthorized) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-[calc(100vh-12rem)] w-full" />
      </div>
    );
  }

  const initials = (note.authorName || 'NN').split(' ').map((n) => n[0]).join('');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
         <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/notes')} className="mb-4">
                <ArrowLeft className="mr-2" /> Back to All Notes
            </Button>
        </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-3xl font-bold tracking-tight">Manage Note</CardTitle>
          <CardDescription className="mt-2">Edit the details for your shared note here. The content itself is managed at the external link.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField control={form.control} name="heading" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Type /> Heading</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><FileText /> Description</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="link" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Link2 /> Link URL</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="flex justify-end pt-4">
                         <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 border-t flex justify-between items-center">
            <Link href={`/profile/${note.authorId}`} className="flex items-center gap-2 hover:underline">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={note.authorProfilePicture} alt={note.authorName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                    <p className="font-medium">{note.authorName}</p>
                    <p className="text-xs text-muted-foreground">Author</p>
                </div>
            </Link>
            <p className="text-sm text-muted-foreground">
                Last updated {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
