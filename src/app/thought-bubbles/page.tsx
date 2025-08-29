
import { getStudents } from "@/lib/mock-data";
import type { Student, Thought } from "@/lib/types";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays } from "lucide-react";

interface ThoughtWithAuthor extends Thought {
  author: {
    id: string;
    name: string;
    profilePicture?: string;
  }
}

export default async function ThoughtBubblesPage() {
  const students = await getStudents();
  
  const allThoughts: ThoughtWithAuthor[] = students
    .flatMap(student => 
      student.thoughts.map(thought => ({
        ...thought,
        author: {
          id: student.id,
          name: student.name || `User ${student.rollNo}`,
          profilePicture: student.profilePicture,
        }
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Thought Bubbles</h1>
        <p className="mt-2 text-lg text-muted-foreground">A live feed of thoughts from around campus.</p>
      </div>
      
      <div className="space-y-6">
        {allThoughts.length > 0 ? (
          allThoughts.map(thought => {
             const initials = (thought.author.name || "NN").split(" ").map((n) => n[0]).join("");
            return (
                <Card key={thought.id}>
                    <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={thought.author.profilePicture || undefined} alt={thought.author.name} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <Link href={`/profile/${thought.author.id}`} className="font-semibold hover:underline">
                                {thought.author.name}
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-card-foreground break-words">{thought.content}</p>
                    </CardContent>
                    <CardFooter className="px-4 py-2 bg-muted/50">
                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={14} /> 
                            {formatDistanceToNow(new Date(thought.timestamp), { addSuffix: true })}
                        </p>
                    </CardFooter>
                </Card>
            )
          })
        ) : (
          <Card className="text-center p-8 border-dashed">
            <p className="text-muted-foreground">No thoughts have been shared yet. Be the first!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
