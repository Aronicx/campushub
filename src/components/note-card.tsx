

"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { Trash2, ExternalLink, Settings } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Note } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface NoteCardProps {
  note: Note;
  currentUserId?: string;
  onDelete: (noteId: string) => void;
}

export function NoteCard({ note, currentUserId, onDelete }: NoteCardProps) {
  const { currentUser } = useAuth();
  const initials = (note.authorName || 'NN').split(" ").map((n) => n[0]).join("");
  
  const isAuthor = note.authorId === currentUserId;
  const isCoordinator = currentUser?.isCoordinator;
  const canDelete = isAuthor || isCoordinator;


  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <Card className="flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{note.heading}</CardTitle>
            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive flex-shrink-0">
                            <Trash2 size={16} />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete this note listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the note listing from Campus Hub. It will not delete the note at the source link.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        <p className="text-sm text-muted-foreground pt-1 !mt-1 h-10 overflow-hidden">{note.description}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
        <Button asChild className="w-full">
            <a href={note.link} target="_blank" rel="noopener noreferrer">
                Open Note <ExternalLink className="ml-2 h-4 w-4"/>
            </a>
        </Button>
        {isAuthor && (
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href={`/notes/${note.id}`}>
              <Settings className="mr-2 h-4 w-4" /> Manage
            </Link>
          </Button>
        )}
      </CardContent>
      <CardFooter className="p-3 bg-muted/50 border-t flex items-center justify-between">
        <Link href={`/profile/${note.authorId}`} className="flex items-center gap-2 hover:underline">
            <Avatar className="h-6 w-6">
              <AvatarImage src={note.authorProfilePicture || undefined} alt={note.authorName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">{note.authorName}</span>
        </Link>
         <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
        </p>
      </CardFooter>
    </Card>
  );
}
