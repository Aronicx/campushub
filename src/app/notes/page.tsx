
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { addNote, getNotes, deleteNote, uploadFileToStorage } from "@/lib/mock-data";
import type { Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Loader2, Upload, Search, X, Link as LinkIcon } from "lucide-react";
import { NoteCard } from "@/components/note-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resizeAndCompressImage } from "@/lib/utils";


const noteUploadSchema = z.object({
  heading: z.string().min(1, "Heading is required"),
  description: z.string().max(50, "Description must be 50 characters or less"),
  file: z.instanceof(File, { message: "A file is required for upload." }),
});

const noteLinkSchema = z.object({
  heading: z.string().min(1, "Heading is required"),
  description: z.string().max(50, "Description must be 50 characters or less"),
  link: z.string().url({ message: "Please enter a valid URL." }),
});


const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'success' | 'error' | 'cancelled';

function AddNoteDialog({ onNoteAdded }: { onNoteAdded: (newNote: Note) => void }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  
  const uploadAbortController = useRef<AbortController | null>(null);

  const uploadForm = useForm<z.infer<typeof noteUploadSchema>>({
    resolver: zodResolver(noteUploadSchema),
    defaultValues: { heading: "", description: "" },
  });

  const linkForm = useForm<z.infer<typeof noteLinkSchema>>({
    resolver: zodResolver(noteLinkSchema),
    defaultValues: { heading: "", description: "", link: "" },
  });

  const resetForms = () => {
    uploadForm.reset();
    linkForm.reset();
    setUploadStatus('idle');
    setUploadProgress(0);
    if(uploadAbortController.current) {
        uploadAbortController.current.abort();
        uploadAbortController.current = null;
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (uploadStatus === 'processing' || uploadStatus === 'uploading') return;
    setIsOpen(open);
    if (!open) {
        resetForms();
    }
  }

  const handleCancelUpload = () => {
    if (uploadAbortController.current) {
        uploadAbortController.current.abort();
    }
    setUploadStatus('cancelled');
    setUploadProgress(0);
    uploadForm.reset();
  }

  const handleUploadSubmit = async (values: z.infer<typeof noteUploadSchema>) => {
    if (!currentUser || !values.file) {
      toast({ variant: "destructive", title: "File missing", description: "Please select a file to upload." });
      return;
    }

    if (values.file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "File too large", description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.` });
        return;
    }
    
    uploadAbortController.current = new AbortController();
    const signal = uploadAbortController.current.signal;

    setUploadStatus('processing');

    try {
      const fileToUpload = await resizeAndCompressImage(values.file, 1920, 1080, 0.7);

      if (signal.aborted) throw new Error("cancelled");

      setUploadStatus('uploading');
      
      const downloadURL = await uploadFileToStorage(
        fileToUpload,
        (progress) => {
          if (!signal.aborted) setUploadProgress(progress);
        },
        signal
      );

      if (signal.aborted) throw new Error("cancelled");

      const newNote = await addNote(currentUser, {
        heading: values.heading,
        description: values.description,
        link: downloadURL,
      });
      
      setUploadStatus('success');
      setUploadProgress(100);
      toast({ title: "Note Added!", description: "Your note has been shared." });
      
      setTimeout(() => {
          onNoteAdded(newNote);
          resetForms();
      }, 500);

    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'cancelled') {
            setUploadStatus('cancelled');
            toast({ variant: "default", title: "Upload Cancelled" });
        } else {
            console.error(error);
            setUploadStatus('error');
            toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        }
        uploadForm.reset();
        setUploadProgress(0);
    }
  };

  const handleLinkSubmit = async (values: z.infer<typeof noteLinkSchema>) => {
    if (!currentUser) return;
    try {
        const newNote = await addNote(currentUser, values);
        toast({ title: "Note Shared!", description: "Your link has been added." });
        setIsOpen(false);
        resetForms();
        onNoteAdded(newNote);
    } catch(error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to share link." });
    }
  }
  
  const isSubmitting = uploadStatus === 'processing' || uploadStatus === 'uploading';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share a New Note</DialogTitle>
          <DialogDescription>
            Choose to upload a file to be stored securely, or share a link to an existing note.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" disabled={isSubmitting}><Upload className="mr-2 h-4 w-4" /> Upload File</TabsTrigger>
            <TabsTrigger value="link" disabled={isSubmitting}><LinkIcon className="mr-2 h-4 w-4" /> Share Link</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(handleUploadSubmit)} className="space-y-4 py-4">
                <FormField control={uploadForm.control} name="heading" render={({ field }) => (
                    <FormItem><FormLabel>Heading</FormLabel><FormControl><Input placeholder="e.g., Quantum Physics Summary" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={uploadForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Short Description</FormLabel><FormControl><Input placeholder="Quick notes for the final exam." {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={uploadForm.control} name="file" render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem><FormLabel>Note File (Max {MAX_FILE_SIZE_MB}MB)</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <Input type="file" className="pl-12" onChange={(e) => onChange(e.target.files?.[0])} disabled={isSubmitting} {...rest} />
                            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </div>
                        </FormControl><FormMessage />
                    </FormItem>
                )} />

                {(uploadStatus !== 'idle' && uploadStatus !== 'success') && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <p className="text-muted-foreground capitalize">{uploadStatus}</p>
                            {isSubmitting && (<Button type="button" variant="ghost" size="sm" onClick={handleCancelUpload} className="text-destructive hover:text-destructive"><X className="mr-2 h-4 w-4" /> Cancel</Button>)}
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                    </div>
                )}

                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="ghost" disabled={isSubmitting}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting || uploadStatus === 'success'}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'success' ? 'Shared!' : 'Upload & Share'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="link">
              <Form {...linkForm}>
                  <form onSubmit={linkForm.handleSubmit(handleLinkSubmit)} className="space-y-4 py-4">
                     <FormField control={linkForm.control} name="heading" render={({ field }) => (
                        <FormItem><FormLabel>Heading</FormLabel><FormControl><Input placeholder="e.g., History Lecture Notes" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={linkForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Short Description</FormLabel><FormControl><Input placeholder="From Prof. Smith's class." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={linkForm.control} name="link" render={({ field }) => (
                        <FormItem><FormLabel>Link URL</FormLabel><FormControl><Input type="url" placeholder="https://docs.google.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Share Link</Button>
                    </DialogFooter>
                  </form>
              </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchNotes() {
      setIsLoading(true);
      const notesData = await getNotes();
      setNotes(notesData);
      setIsLoading(false);
    }
    fetchNotes();
  }, []);

  const handleNoteAdded = (newNote: Note) => {
    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note =>
        note.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  const handleNoteDelete = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    const originalNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await deleteNote(noteId, noteToDelete.link);
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
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-primary">Shared Notes</h1>
              <p className="mt-2 text-lg text-muted-foreground">A community-curated list of useful notes and resources.</p>
          </div>
          {currentUser && <AddNoteDialog onNoteAdded={handleNoteAdded} />}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by heading or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:max-w-md"
          />
        </div>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredNotes.map(note => (
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
          <h3 className="text-xl font-semibold">No Notes Found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? `Your search for "${searchTerm}" did not return any results.` : "Be the first one to share a note!"}
            </p>
        </Card>
      )}
    </div>
  );
}
