

"use client";

import { getStudents, toggleFollow, toggleProfileLike, cancelFollowRequest, toggleTrustLike } from "@/lib/mock-data";
import { StudentCard } from "@/components/student-card";
import { Input } from "@/components/ui/input";
import { Suspense, useEffect, useState, useTransition } from 'react';
import type { Student } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, RefreshCw, Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StudentList({ students, currentUserId, onFollowToggle, onLikeToggle, onTrustLikeToggle, onCancelRequest }: { students: Student[], currentUserId?: string, onFollowToggle: (studentId: string) => void, onLikeToggle: (studentId: string) => void, onTrustLikeToggle: (studentId: string) => void, onCancelRequest: (studentId: string) => void }) {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No students found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} currentUserId={currentUserId} onFollowToggle={onFollowToggle} onLikeToggle={onLikeToggle} onTrustLikeToggle={onTrustLikeToggle} onCancelRequest={onCancelRequest} />
      ))}
    </div>
  );
}

function StudentDirectoryContent() {
  const searchParams = useSearchParams();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currentUser, refreshCurrentUser } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const shuffleAndPick = (students: Student[], count: number) => {
    return [...students].sort(() => 0.5 - Math.random()).slice(0, count);
  };
  
  const fetchData = async () => {
    setIsLoading(true);
    let studentsData = await getStudents();
    setAllStudents(studentsData);
    setDisplayedStudents(shuffleAndPick(studentsData, 20));
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    let studentsData = await getStudents();
    setAllStudents(studentsData);
    setDisplayedStudents(shuffleAndPick(studentsData, 20));
    setIsRefreshing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchTerm('');
  };
  
  const filteredStudents = allStudents.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const studentsToDisplay = searchTerm ? filteredStudents : displayedStudents;

  const handleFollowToggle = async (studentId: string) => {
      if (!currentUser) return;
      try {
        await toggleFollow(currentUser.id, studentId);
        await refreshCurrentUser();
        // No full refetch, just update the local state for current user
        toast({ title: "Follow Request Sent" });
      } catch (error) {
          console.error("Failed to toggle follow", error);
          toast({ variant: "destructive", title: "Error", description: "Could not send follow request." });
      }
  };

  const handleCancelRequest = async (studentId: string) => {
    if (!currentUser) return;
    try {
        await cancelFollowRequest(currentUser.id, studentId);
        await refreshCurrentUser();
        toast({ title: "Follow Request Canceled" });
    } catch (error) {
        console.error("Failed to cancel request", error);
        toast({ variant: "destructive", title: "Error", description: "Could not cancel follow request." });
    }
  }
  
    const handleLikeToggle = async (studentId: string) => {
        if (!currentUser) return;
        await toggleProfileLike(studentId, currentUser.id);
        const updatedStudents = await getStudents();
        setAllStudents(updatedStudents);

        // Update displayed students with new data, preserving their order if not searching
        if(!searchTerm) {
          setDisplayedStudents(prev => {
              const newDisplayed = prev.map(ds => {
                  const updated = updatedStudents.find(us => us.id === ds.id);
                  return updated || ds;
              });
              return newDisplayed;
          });
        }
    };

    const handleTrustLikeToggle = async (studentId: string) => {
        if (!currentUser) return;
        await toggleTrustLike(studentId, currentUser.id);
        const updatedStudents = await getStudents();
        setAllStudents(updatedStudents);

         if(!searchTerm) {
            setDisplayedStudents(prev => {
                const newDisplayed = prev.map(ds => {
                    const updated = updatedStudents.find(us => us.id === ds.id);
                    return updated || ds;
                });
                return newDisplayed;
            });
        }
    };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Campus Connect</h1>
        <p className="mt-2 text-lg text-muted-foreground">Find and connect with students across campus.</p>
      </div>
      <div className="mb-8 p-6 bg-card rounded-lg shadow-sm border">
        <div className="relative w-full sm:flex-1">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          />
          <Input 
            name="search" 
            placeholder="Search all students..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <>
            <StudentList students={studentsToDisplay} currentUserId={currentUser?.id} onFollowToggle={handleFollowToggle} onLikeToggle={handleLikeToggle} onTrustLikeToggle={handleTrustLikeToggle} onCancelRequest={handleCancelRequest} />
            {!searchTerm && (
                <div className="mt-12 text-center">
                    <Button onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Loading...' : 'Load More Students'}
                    </Button>
                </div>
            )}
        </>
      )}
    </div>
  );
}


export default function StudentDirectoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentDirectoryContent />
    </Suspense>
  )
}
