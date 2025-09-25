
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
import { Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function FilterControls() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleFilterChange = (type: 'search', value: string) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      if (!value) {
        current.delete(type);
      } else {
        current.set(type, value);
      }
      
      const search = current.toString();
      const query = search ? `?${search}` : "";
      
      // We are not using router.push to prevent re-fetching from server on filter change
      // The filtering will happen on the client side.
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative w-full sm:flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <Input 
          name="search" 
          placeholder="Search by name or username..." 
          className="pl-10" 
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>
    </div>
  );
}

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
    const studentsData = await getStudents();
    setAllStudents(studentsData);
    setDisplayedStudents(shuffleAndPick(studentsData, 20));
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const studentsData = await getStudents();
    setAllStudents(studentsData);
    setDisplayedStudents(shuffleAndPick(studentsData, 20));
    setIsRefreshing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const filteredStudents = displayedStudents.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        setDisplayedStudents(prev => {
            const newDisplayed = prev.map(ds => {
                const updated = updatedStudents.find(us => us.id === ds.id);
                return updated || ds;
            });
            return newDisplayed;
        });
    };

    const handleTrustLikeToggle = async (studentId: string) => {
        if (!currentUser) return;
        await toggleTrustLike(studentId, currentUser.id);
        const updatedStudents = await getStudents();
        setAllStudents(updatedStudents);
        setDisplayedStudents(prev => {
            const newDisplayed = prev.map(ds => {
                const updated = updatedStudents.find(us => us.id === ds.id);
                return updated || ds;
            });
            return newDisplayed;
        });
    };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Campus Connect</h1>
        <p className="mt-2 text-lg text-muted-foreground">Find and connect with students across campus.</p>
      </div>
      <div className="mb-8 p-6 bg-card rounded-lg shadow-sm border">
        <div className="relative w-full sm:flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input 
            name="search" 
            placeholder="Search displayed students..." 
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
            <StudentList students={filteredStudents} currentUserId={currentUser?.id} onFollowToggle={handleFollowToggle} onLikeToggle={handleLikeToggle} onTrustLikeToggle={handleTrustLikeToggle} onCancelRequest={handleCancelRequest} />
            <div className="mt-12 text-center">
                <Button onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Loading...' : 'Load More Students'}
                </Button>
            </div>
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
