
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/types";
import { Button } from "./ui/button";
import { ArrowRight, UserPlus, UserCheck, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: Student;
  currentUserId?: string;
  onFollowToggle?: (studentId: string) => void;
  onLikeToggle?: (studentId: string) => void;
}

export function StudentCard({ student, currentUserId, onFollowToggle, onLikeToggle }: StudentCardProps) {
  const initials = (student.name || 'NN').split(" ").map((n) => n[0]).join("");
  const displayName = student.name || '(no name)';
  const isFollowing = currentUserId ? (student.followers || []).includes(currentUserId) : false;
  const isLiked = currentUserId ? (student.likedBy || []).includes(currentUserId) : false;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(currentUserId && onFollowToggle) {
        onFollowToggle(student.id);
    }
  }
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId && onLikeToggle) {
      onLikeToggle(student.id);
    }
  };

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row gap-4 items-center p-4">
        <Link href={`/profile/${student.id}`} className="flex-shrink-0">
          <Avatar>
            <AvatarImage src={student.profilePicture || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${student.id}`}>
            <h3 className="font-semibold text-lg leading-tight">{displayName}</h3>
            <p className="text-sm text-muted-foreground leading-tight">{student.major}</p>
          </Link>
          <p className="text-xs text-muted-foreground">Roll No: {student.rollNo}</p>
        </div>
        {onFollowToggle && currentUserId && currentUserId !== student.id && (
          <Button 
              variant="ghost"
              size="icon" 
              onClick={handleFollowClick} 
              disabled={!currentUserId}
              className="h-8 w-8"
              aria-label={isFollowing ? "Unfollow profile" : "Follow profile"}
          >
              {isFollowing ? <UserCheck className="text-primary"/> : <UserPlus className="text-muted-foreground"/>}
          </Button>
       )}
      </CardHeader>
      <Link href={`/profile/${student.id}`} className="flex flex-col flex-grow">
        <CardContent className="px-4 pb-4 flex-grow">
          <div className="flex flex-wrap gap-2">
            {student.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
            {student.interests.length > 3 && <Badge variant="secondary">...</Badge>}
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t">
           <div className="flex items-center gap-4 text-muted-foreground">
             {onLikeToggle && (
                 <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLikeClick} disabled={!currentUserId}>
                         <Heart className={cn("h-5 w-5", isLiked ? "text-red-500 fill-current" : "text-muted-foreground")} />
                    </Button>
                    <span className="text-sm">{(student.likedBy || []).length}</span>
                </div>
             )}
            <div className="flex items-center gap-1">
                 <Users className="h-4 w-4" />
                 <span className="text-sm">{(student.followers || []).length}</span>
            </div>
           </div>
           <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${student.id}`}>
                    View <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
           </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
