
"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/types";
import { Button } from "./ui/button";
import { ArrowRight, UserPlus, UserCheck, Heart, Users, UserMinus, UserX, MoreVertical, Trash2, ShieldCheck } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface StudentCardProps {
  student: Student;
  currentUserId?: string;
  listType?: 'followers' | 'following' | 'likes' | 'directory';
  onFollowToggle?: (studentId: string) => void;
  onLikeToggle?: (studentId: string) => void;
  onTrustLikeToggle?: (studentId: string) => void;
  onCancelRequest?: (studentId: string) => void;
  onRemoveFollower?: (studentId: string) => void;
}

export function StudentCard({ 
  student, 
  currentUserId,
  listType = 'directory',
  onFollowToggle, 
  onLikeToggle,
  onTrustLikeToggle,
  onCancelRequest,
  onRemoveFollower
}: StudentCardProps) {
  const { currentUser } = useAuth();
  const initials = (student.name || 'NN').split(" ").map((n) => n[0]).join("");
  const displayName = student.name || '(no name)';
  
  const isFollowing = currentUser ? (currentUser.following || []).includes(student.id) : false;
  const hasSentRequest = currentUser ? (currentUser.sentFollowRequests || []).includes(student.id) : false;
  const isLiked = currentUserId ? (student.likedBy || []).includes(currentUserId) : false;

  const twentyDaysAgo = useMemo(() => Date.now() - 20 * 24 * 60 * 60 * 1000, []);
  const hasTrustLiked = useMemo(() => (student.trustLikes || []).some(like => like.userId === currentUserId && like.timestamp > twentyDaysAgo), [student.trustLikes, currentUserId, twentyDaysAgo]);
  const recentTrustLikeCount = useMemo(() => (student.trustLikes || []).filter(like => like.timestamp > twentyDaysAgo).length, [student.trustLikes, twentyDaysAgo]);


  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(currentUserId && onFollowToggle) {
        onFollowToggle(student.id);
    }
  }

  const handleCancelRequestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId && onCancelRequest) {
      onCancelRequest(student.id);
    }
  };
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId && onLikeToggle) {
      onLikeToggle(student.id);
    }
  };

  const handleTrustLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId && onTrustLikeToggle && currentUserId !== student.id) {
      onTrustLikeToggle(student.id);
    }
  };
  
  const handleRemoveFollowerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId && onRemoveFollower) {
      onRemoveFollower(student.id);
    }
  }

  const FollowButton = () => {
    if (!onFollowToggle || !currentUserId || currentUserId === student.id || listType !== 'directory') return null;

    if (isFollowing) {
        return (
            <Button variant="ghost" size="icon" onClick={handleFollowClick} disabled={!currentUserId} className="h-8 w-8" aria-label="Unfollow">
                <UserCheck className="text-primary"/>
            </Button>
        )
    }
    if (hasSentRequest) {
        return (
            <Button variant="ghost" size="icon" onClick={handleCancelRequestClick} disabled={!currentUserId || !onCancelRequest} className="h-8 w-8" aria-label="Cancel follow request">
                <UserMinus className="text-muted-foreground"/>
            </Button>
        )
    }
    return (
        <Button variant="ghost" size="icon" onClick={handleFollowClick} disabled={!currentUserId} className="h-8 w-8" aria-label="Follow">
            <UserPlus className="text-muted-foreground"/>
        </Button>
    )
  }
  
  const ActionMenu = () => {
    if (currentUserId === student.id) return null;
    
    if (listType === 'following' && onFollowToggle) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">Unfollow</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unfollow {displayName}?</AlertDialogTitle>
              <AlertDialogDescription>
                They will not be notified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.stopPropagation(); onFollowToggle(student.id); }}>Unfollow</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    if (listType === 'followers' && onRemoveFollower) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">Remove</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this follower?</AlertDialogTitle>
              <AlertDialogDescription>
                {displayName} will no longer be following you and will not be notified of this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.stopPropagation(); onRemoveFollower(student.id); }} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    
    return null;
  }

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
            <h3 className="font-semibold text-lg leading-tight hover:underline">{displayName}</h3>
          </Link>
          <p className="text-sm text-muted-foreground leading-tight">{student.major}</p>
          <p className="text-xs text-muted-foreground">Roll No: {student.rollNo}</p>
        </div>
        <FollowButton />
      </CardHeader>
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
          <div className="flex items-center gap-2 sm:gap-4 text-muted-foreground">
             {onTrustLikeToggle && (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleTrustLikeClick} disabled={!currentUserId || currentUserId === student.id}>
                       <ShieldCheck className={cn("h-5 w-5", hasTrustLiked ? "text-green-500 fill-current" : "text-muted-foreground")} />
                    </Button>
                    <span className="text-sm">{recentTrustLikeCount}</span>
                </div>
            )}
            {onLikeToggle && (
                <div className="flex items-center gap-1">
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
          <ActionMenu />
          {(listType === 'directory' || listType === 'likes') && (
            <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${student.id}`}>
                    View <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          )}
      </CardFooter>
    </Card>
  );
}
