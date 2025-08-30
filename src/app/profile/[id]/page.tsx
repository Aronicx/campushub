
'use client'

import { getStudentById, toggleFollow, toggleProfileLike, cancelFollowRequest } from "@/lib/mock-data";
import { notFound, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, BrainCircuit, CalendarDays, User, KeyRound, Instagram, MessageCircle, Phone, Link2, Users, Mail, UserPlus, UserCheck, Heart, UserMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


function ContactInfo({ student }: { student: Student }) {
    const contacts = [
        { icon: Instagram, label: "Instagram", value: student.instagram, href: student.instagram ? `https://instagram.com/${student.instagram}` : undefined },
        { icon: MessageCircle, label: "Snapchat", value: student.snapchat, href: student.snapchat ? `https://snapchat.com/add/${student.snapchat}`: undefined },
        { icon: Users, label: "Discord", value: student.discord },
        { icon: Phone, label: "Phone", value: student.phoneNumber },
        { icon: Mail, label: "Email", value: student.email, href: `mailto:${student.email}`},
        { icon: Link2, label: "Link", value: student.customLink, isLink: true, href: student.customLink },
    ].filter(c => c.value);

    if (contacts.length === 0) return null;

    return (
        <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Contact & Socials</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map(({icon: Icon, label, value, isLink, href}) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                             <Icon className="h-6 w-6 text-muted-foreground" />
                             <CardTitle className="text-lg">{label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {href ? (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</a>
                            ) : (
                                <p className="text-muted-foreground break-all">{value}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function FollowButton({ student, onFollowToggle, onLikeToggle, onCancelRequest }: { student: Student, onFollowToggle: () => void, onLikeToggle: () => void, onCancelRequest: () => void }) {
    const { currentUser } = useAuth();
    const router = useRouter();

    if (!currentUser || currentUser.id === student.id) {
        return null; // Don't show buttons on your own profile
    }

    const isFollowing = (currentUser.following || []).includes(student.id);
    const hasSentRequest = (currentUser.sentFollowRequests || []).includes(student.id);
    const isLiked = (student.likedBy || []).includes(currentUser.id);

    const handleFollow = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if(hasSentRequest) {
            onCancelRequest();
        } else {
            onFollowToggle();
        }
    }
    
     const handleLike = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        onLikeToggle();
    }
    
    let followButton;
    if (isFollowing) {
        followButton = (
             <Button onClick={handleFollow} variant="secondary">
                <UserCheck className="mr-2" /> Following
            </Button>
        )
    } else if (hasSentRequest) {
        followButton = (
            <Button onClick={handleFollow} variant="outline">
                <UserMinus className="mr-2" /> Requested
            </Button>
        )
    } else {
        followButton = (
            <Button onClick={handleFollow} variant="default">
                <UserPlus className="mr-2" /> Follow
            </Button>
        )
    }


    return (
        <div className="flex items-center gap-2">
            {followButton}
             <Button onClick={handleLike} variant="outline" size="icon">
                <Heart className={cn("h-5 w-5", isLiked ? "text-red-500 fill-current" : "text-muted-foreground")} />
            </Button>
        </div>
    )
}


export default function ProfilePage() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { toast } = useToast();

  useEffect(() => {
      async function fetchStudent() {
          if (!id) return;
          setIsLoading(true);
          const studentData = await getStudentById(id);
          if (!studentData) {
              notFound();
          }
          setStudent(studentData);
          setIsLoading(false);
      }
      fetchStudent();
  }, [id]);

  const handleFollowToggle = async () => {
        if (!currentUser || !student) return;
        try {
            await toggleFollow(currentUser.id, student.id);
            await refreshCurrentUser();
            const refreshedStudent = await getStudentById(student.id);
            setStudent(refreshedStudent || null);
             toast({ title: "Follow Request Sent!" });
        } catch (error) {
             console.error("Failed to toggle follow", error);
             toast({ variant: "destructive", title: "Error", description: "Failed to send follow request." });
        }
    }
    
    const handleCancelRequest = async () => {
        if (!currentUser || !student) return;
        try {
            await cancelFollowRequest(currentUser.id, student.id);
            await refreshCurrentUser();
            const refreshedStudent = await getStudentById(student.id);
            setStudent(refreshedStudent || null);
            toast({ title: "Follow Request Canceled" });
        } catch (error) {
            console.error("Failed to cancel follow request", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to cancel follow request." });
        }
    }
    
    const handleLikeToggle = async () => {
        if (!currentUser || !student) return;

        const originalIsLiked = (student.likedBy || []).includes(currentUser.id);

        setStudent(prevStudent => {
            if (!prevStudent) return null;
            const currentLikedBy = prevStudent.likedBy || [];
            const newLikedBy = originalIsLiked 
                ? currentLikedBy.filter(id => id !== currentUser.id)
                : [...currentLikedBy, currentUser.id];
            return {...prevStudent, likedBy: newLikedBy};
        });

        try {
            await toggleProfileLike(student.id, currentUser.id);
        } catch (error) {
             console.error("Failed to toggle like", error);
             const studentData = await getStudentById(id);
             setStudent(studentData || null);
        }
    }
  
  if (isLoading || !student) {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <Skeleton className="h-[500px] w-full" />
        </div>
    )
  }

  const initials = (student.name || "NN")
    .split(" ")
    .map((n) => n[0])
    .join("");
  
  const displayName = student.name || '(no name)';

  const recentThoughts = (student.thoughts || [])
    .filter(thought => {
        const thoughtDate = new Date(thought.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return thoughtDate > oneDayAgo;
    });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="overflow-hidden shadow-lg">
        <div className="bg-muted h-32" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-20">
             <Dialog>
              <DialogTrigger asChild>
                <Avatar className="h-32 w-32 border-4 border-background cursor-pointer">
                  <AvatarImage src={student.profilePicture || undefined} alt={displayName} />
                  <AvatarFallback className="text-4xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent className="p-0 max-w-sm sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="sr-only">{displayName}'s Profile Picture</DialogTitle>
                </DialogHeader>
                {student.profilePicture && (
                   <Image src={student.profilePicture} alt={displayName} width={400} height={400} className="object-cover rounded-lg" data-ai-hint="profile picture" />
                )}
              </DialogContent>
            </Dialog>
            <div className="mt-4 sm:mt-0 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-end">
                <div>
                    <h1 className="text-3xl font-bold text-primary">{displayName}</h1>
                    <p className="text-lg text-muted-foreground">{student.major}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Roll No: {student.rollNo}</span>
                        <span>{(student.followers?.length || 0)} Followers</span>
                        <span>{(student.following?.length || 0)} Following</span>
                        <span>{(student.likedBy?.length || 0)} Likes</span>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0">
                    <FollowButton student={student} onFollowToggle={handleFollowToggle} onLikeToggle={handleLikeToggle} onCancelRequest={handleCancelRequest} />
                </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><KeyRound size={24} /> Roll No.</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{student.rollNo}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><User size={24} /> Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{student.bio}</p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit size={24} /> Interests</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {student.interests.map((interest) => (
                            <Badge key={interest} variant="default" className="bg-primary/80 hover:bg-primary text-primary-foreground">
                                {interest}
                            </Badge>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <ContactInfo student={student} />
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen /> Recent Daily Thoughts
        </h2>
        {recentThoughts.length > 0 ? (
          <div className="space-y-4">
            {recentThoughts.map((thought) => (
              <Card key={thought.id}>
                <CardContent className="p-4">
                  <p>{thought.content}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <CalendarDays size={14} /> 
                    {formatDistanceToNow(new Date(thought.timestamp), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8 border-dashed">
            <p className="text-muted-foreground">{displayName} hasn't shared any thoughts in the last 24 hours.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
