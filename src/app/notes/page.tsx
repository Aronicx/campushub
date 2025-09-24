

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { addNote, getNotes, deleteNote } from "@/lib/mock-data";
import type { Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Loader2 } from "lucide-react";
import { NoteCard } from "@/components/note-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";

const noteFormSchema = z.object({
  heading: z.string().min(1, "Heading is required"),
  description: z.string().max(50, "Description must be 50 characters or less"),
  content: z.string().min(1, "Note content cannot be empty."),
  password: z.string().optional(),
});

function AddNoteForm({ onNoteAdded }: { onNoteAdded: () => void }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { heading: "", description: "", content: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await addNote(currentUser, values);
      toast({ title: "Note Added!", description: "Your note has been shared." });
      form.reset();
      setIsOpen(false);
      onNoteAdded();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add note." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a New Note</DialogTitle>
          <DialogDescription>Share your notes with the community. You can optionally add a password to restrict editing.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="heading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heading</FormLabel>
                  <FormControl><Input placeholder="e.g., Quantum Physics Summary" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl><Input placeholder="Quick notes for the final exam." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl><Textarea placeholder="Start writing your notes here..." rows={6} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edit Password (Optional)</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Share
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    setIsLoading(true);
    const notesData = await getNotes();
    setNotes(notesData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleNoteDelete = async (noteId: string) => {
    const originalNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await deleteNote(noteId);
      toast({ title: "Note Deleted", description: "The note has been removed." });
    } catch (error) {
      setNotes(originalNotes);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete note." });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Shared Notes</h1>
            <p className="mt-2 text-lg text-muted-foreground">Find and share useful notes and resources.</p>
        </div>
        {currentUser && <AddNoteForm onNoteAdded={fetchNotes} />}
      </div>

      {notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              currentUserId={currentUser?.id} 
              onDelete={handleNoteDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center p-10 border-dashed col-span-full">
          <h3 className="text-xl font-semibold">No Notes Yet</h3>
          <p className="text-muted-foreground">Be the first one to share a note!</p>
        </Card>
      )}
    </div>
  );
}
