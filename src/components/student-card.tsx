
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/types";
import { Button } from "./ui/button";
import { ArrowRight, UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: Student;
  currentUserId?: string;
  onFollowToggle?: (studentId: string) => void;
}

export function StudentCard({ student, currentUserId, onFollowToggle }: StudentCardProps) {
  const initials = (student.name || 'NN').split(" ").map((n) => n[0]).join("");
  const displayName = student.name || '(no name)';
  const isFollowing = currentUserId ? (student.followers || []).includes(currentUserId) : false;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(currentUserId && onFollowToggle) {
        onFollowToggle(student.id);
    }
  }

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/profile/${student.id}`} className="flex flex-col flex-grow">
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
        <CardFooter className="flex justify-between items-center">
           <Button variant="outline" className="w-full">
                View Profile <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
        </CardFooter>
      </Link>
       {onFollowToggle && currentUserId !== student.id && (
         <div className="border-t p-3 flex justify-end items-center gap-2">
              <span className="text-sm text-muted-foreground">{student.followers?.length || 0} Followers</span>
              <Button 
                  variant={isFollowing ? "secondary" : "default"}
                  size="sm" 
                  onClick={handleFollowClick} 
                  disabled={!currentUserId}
                  className="w-24"
                  aria-label={isFollowing ? "Unfollow profile" : "Follow profile"}
              >
                  {isFollowing ? <UserCheck className="mr-2"/> : <UserPlus className="mr-2"/>}
                  {isFollowing ? "Following" : "Follow"}
              </Button>
        </div>
       )}
    </Card>
  );
}
