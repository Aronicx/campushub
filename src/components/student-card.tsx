
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Student } from "@/lib/types";
import { Button } from "./ui/button";
import { Heart, UserCheck, UserPlus, UserMinus, ShieldCheck, Building, MessageSquare } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";

interface StudentCardProps {
  student: Student;
  currentUserId?: string;
  listType?: 'followers' | 'following' | 'likes' | 'directory' | 'suggestions';
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
  const router = useRouter();
  const initials = (student.name || 'NN').split(" ").map((n) => n[0]).join("");
  const displayName = student.name || '(no name)';
  
  const isFollowing = currentUser ? (currentUser.following || []).includes(student.id) : false;
  const hasSentRequest = currentUser ? (currentUser.sentFollowRequests || []).includes(student.id) : false;
  const isLiked = currentUserId ? (student.likedBy || []).includes(currentUserId) : false;
  const hasTrustLiked = (student.trustLikes || []).some(like => like.userId === currentUserId);
  const trustLikeCount = (student.trustLikes || []).length;
  const isOwnProfile = currentUserId === student.id;

  const bannerStyle = useMemo(() => {
    if (!student?.profileColor) return {};
    try {
        if (student.profileColor.startsWith('{')) {
            return JSON.parse(student.profileColor);
        }
    } catch (e) { /* Fallback below */ }
    return {};
  }, [student?.profileColor]);

  const bannerClass = useMemo(() => {
    if (!student?.profileColor) return 'bg-muted';
    if (student.profileColor.startsWith('{')) return '';
    return student.profileColor;
  }, [student?.profileColor]);

  const borderColorStyle = useMemo(() => {
    if (!student?.profileColor || student.profileColor.startsWith('{')) {
      return {};
    }
    const colorMapping: Record<string, string> = {
        'bg-red-500': '#ef4444',
        'bg-blue-500': '#3b82f6',
        'bg-green-500': '#22c55e',
        'bg-yellow-500': '#eab308',
        'bg-pink-500': '#ec4899',
        'bg-white': '#ffffff',
        'bg-black': '#000000',
        'bg-gray-500': '#6b7280',
        'bg-purple-800': '#6b21a8',
        'bg-blue-400': '#60a5fa',
    };
    const color = colorMapping[student.profileColor];
    return color ? { borderColor: color } : {};
  }, [student.profileColor]);


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

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    const chatId = [currentUser.id, student.id].sort().join('--');
    router.push(`/chat/${chatId}`);
  }
  
  const FollowButton = () => {
    if (!onFollowToggle || !currentUserId || isOwnProfile) return null;

    if (isFollowing) {
        return (
            <Button variant="ghost" size="icon" onClick={handleFollowClick} disabled={!currentUserId} className="h-8 w-8 text-primary hover:bg-accent/20" aria-label="Unfollow">
                <UserCheck />
            </Button>
        )
    }
    if (hasSentRequest) {
        return (
            <Button variant="ghost" size="icon" onClick={handleCancelRequestClick} disabled={!currentUserId || !onCancelRequest} className="h-8 w-8 text-muted-foreground hover:bg-accent/20" aria-label="Cancel follow request">
                <UserMinus />
            </Button>
        )
    }
    return (
        <Button variant="ghost" size="icon" onClick={handleFollowClick} disabled={!currentUserId} className="h-8 w-8 text-muted-foreground hover:bg-accent/20" aria-label="Follow">
            <UserPlus />
        </Button>
    )
  }
  
  const ActionMenu = () => {
    if (isOwnProfile) return null;
    
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
    <Card 
        className="flex flex-col transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 bg-card overflow-hidden border-2"
        style={borderColorStyle}
    >
        <Link href={`/profile/${student.id}`} className="flex-grow flex flex-col">
            <div className={cn("h-16 w-full", bannerClass)} style={bannerStyle} />
            <CardHeader className="flex-row gap-4 items-center p-4">
                <Avatar>
                    <AvatarImage src={student.profilePicture || undefined} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-lg leading-tight hover:underline truncate text-card-foreground">{displayName}</h3>
                    <p className="text-sm text-muted-foreground leading-tight truncate">{student.course}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                        <Building size={12}/>
                        <span>{student.collegeName}</span>
                    </div>
                </div>
            </CardHeader>
        </Link>
      <CardFooter className="p-2 flex justify-between items-center border-t mt-auto">
          <div className="flex items-center gap-1 text-muted-foreground">
             <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/20" onClick={handleTrustLikeClick} disabled={!currentUserId || isOwnProfile}>
                   <ShieldCheck className={cn("h-5 w-5", hasTrustLiked ? "text-green-500 fill-current" : "text-muted-foreground")} />
                </Button>
                <span className="text-sm -ml-1">{trustLikeCount}</span>
            </div>
             <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/20" onClick={handleLikeClick} disabled={!currentUserId}>
                    <Heart className={cn("h-5 w-5", isLiked ? "text-red-500 fill-current" : "text-muted-foreground")} />
                </Button>
                <span className="text-sm -ml-1">{(student.likedBy || []).length}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isOwnProfile && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/20" onClick={handleChatClick}><MessageSquare className="text-muted-foreground"/></Button>}
            { (listType === 'directory' || listType === 'suggestions') && (
                <FollowButton />
            )}
            <ActionMenu />
          </div>
      </CardFooter>
    </Card>
  );
}
