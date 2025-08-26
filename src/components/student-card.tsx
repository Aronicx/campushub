
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/types";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export function StudentCard({ student }: { student: Student }) {
  const initials = (student.name || 'NN').split(" ").map((n) => n[0]).join("");
  const displayName = student.name || '(no name)';

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row gap-4 items-center">
        <Avatar>
          <AvatarImage src={student.profilePicture || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{displayName}</h3>
          <p className="text-sm text-muted-foreground">{student.major}</p>
          <p className="text-xs text-muted-foreground">Roll No: {student.rollNo}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          {student.interests.slice(0, 3).map((interest) => (
            <Badge key={interest} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/profile/${student.id}`}>
            View Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    