
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getNoteById, updateNote } from '@/lib/mock-data';
import type { Note } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Save, Lock, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NoteViewerPage() {
  const { currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  useEffect(() => {
    if (!noteId) return;

    async function fetchNote() {
      setIsLoading(true);
      const noteData = await getNoteById(noteId);
      if (noteData) {
        setNote(noteData);
        setEditContent(noteData.content);
      } else {
        toast({ variant: 'destructive', title: 'Note not found.' });
        router.push('/notes');
      }
      setIsLoading(false);
    }

    fetchNote();
  }, [noteId, router, toast]);

  const handleEditClick = () => {
    // If the note has no password and the current user is the author, allow editing directly.
    if (!note?.password && currentUser?.id === note?.authorId) {
      setIsEditing(true);
    } else if (note?.password) {
      // Otherwise, require a password.
      setIsPasswordModalOpen(true);
    } else {
      toast({ variant: 'destructive', title: 'Not Authorized', description: 'You do not have permission to edit this note.' });
    }
  };

  const handlePasswordSubmit = () => {
    if (password === note?.password) {
      setIsPasswordModalOpen(false);
      setIsEditing(true);
      setPassword(''); // Clear password after successful entry
      toast({ title: 'Access Granted', description: 'You can now edit the note.' });
    } else {
      toast({ variant: 'destructive', title: 'Incorrect Password' });
    }
  };

  const handleSaveChanges = async () => {
    if (!note) return;
    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.id, { content: editContent });
      if (updatedNote) {
        setNote(updatedNote);
        toast({ title: 'Note Saved!', description: 'Your changes have been saved.' });
        setIsEditing(false);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || !note) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-[calc(100vh-12rem)] w-full" />
      </div>
    );
  }

  const initials = (note.authorName || 'NN').split(' ').map((n) => n[0]).join('');

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <Button variant="ghost" size="sm" onClick={() => router.push('/notes')} className="mb-4">
                <ArrowLeft className="mr-2" /> Back to Notes
              </Button>
              <CardTitle className="text-3xl font-bold tracking-tight">{note.heading}</CardTitle>
              <CardDescription className="mt-2">{note.description}</CardDescription>
            </div>
            <div className="flex-shrink-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button onClick={handleEditClick} disabled={currentUser?.id !== note.authorId}>
                  <Edit className="mr-2" /> Edit Note
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[50vh] text-base leading-relaxed"
              autoFocus
            />
          ) : (
            <div className="prose prose-stone dark:prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed">
                {note.content}
            </div>
          )}
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
      
      <AlertDialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Lock /> Password Required</AlertDialogTitle>
            <AlertDialogDescription>
              This note is password protected. Please enter the password to enable editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Unlock</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
