
"use client"
import { getStudents, toggleLikeThought } from "@/lib/mock-data";
import type { Student, Thought } from "@/lib/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ThoughtCard } from "@/components/thought-card";
import { Card } from "@/components/ui/card";

export interface ThoughtWithAuthor extends Thought {
  author: {
    id: string;
    name: string;
    profilePicture?: string;
  }
}

export default function ThoughtBubblesPage() {
  const [thoughts, setThoughts] = useState<ThoughtWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    async function fetchThoughts() {
        setIsLoading(true);
        const students = await getStudents();
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const allThoughts: ThoughtWithAuthor[] = students
            .flatMap(student => 
            student.thoughts
                .filter(thought => new Date(thought.timestamp) > twentyFourHoursAgo)
                .map(thought => ({
                    ...thought,
                    author: {
                        id: student.id,
                        name: student.name || `User ${student.rollNo}`,
                        profilePicture: student.profilePicture,
                    }
                }))
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setThoughts(allThoughts);
        setIsLoading(false);
    }
    fetchThoughts();
  }, []);

  const handleLikeToggle = async (authorId: string, thoughtId: string) => {
    if (!currentUser) return;

    // Optimistically update the UI
    const newThoughts = thoughts.map(thought => {
        if (thought.id === thoughtId) {
            const newLikes = thought.likes.includes(currentUser.id)
                ? thought.likes.filter(id => id !== currentUser!.id)
                : [...thought.likes, currentUser.id];
            return { ...thought, likes: newLikes };
        }
        return thought;
    });
    setThoughts(newThoughts);

    // Call the backend
    try {
        await toggleLikeThought(authorId, thoughtId, currentUser.id);
    } catch (error) {
        console.error("Failed to toggle like:", error);
        // Revert the optimistic update on error
        setThoughts(thoughts);
    }
  };


  if (isLoading) {
      return (
         <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Thought Bubbles</h1>
                <p className="mt-2 text-lg text-muted-foreground">A live feed of thoughts from around campus.</p>
            </div>
            <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
            </div>
        </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Thought Bubbles</h1>
        <p className="mt-2 text-lg text-muted-foreground">A live feed of thoughts from around campus.</p>
      </div>
      
      <div className="space-y-6">
        {thoughts.length > 0 ? (
          thoughts.map(thought => (
            <ThoughtCard 
                key={thought.id}
                thought={thought}
                currentUserId={currentUser?.id}
                onLikeToggle={handleLikeToggle}
            />
          ))
        ) : (
          <Card className="text-center p-8 border-dashed">
            <p className="text-muted-foreground">No thoughts have been shared in the last 24 hours. Be the first!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
