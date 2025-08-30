
"use client";

import { getFollowing, toggleFollow } from "@/lib/mock-data";
import { StudentCard } from "@/components/student-card";
import { Suspense, useEffect, useState } from 'react';
import type { Student } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

function StudentList({ students, currentUserId, onFollowToggle }: { students: Student[], currentUserId?: string, onFollowToggle: (studentId: string) => void }) {
  if (students.length === 0) {
    return (
        <div className="text-center text-muted-foreground mt-8">
            <Users size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold">You're not following anyone yet.</h3>
            <p>Go to the directory to find and follow friends!</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} currentUserId={currentUserId} onFollowToggle={onFollowToggle} />
      ))}
    </div>
  );
}

function FriendsContent() {
  const [friends, setFriends] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
        router.push('/login');
        return;
    }

    async function fetchFriends() {
      if (currentUser) {
          setIsLoading(true);
          const friendsData = await getFollowing(currentUser.id);
          setFriends(friendsData);
          setIsLoading(false);
      }
    }
    fetchFriends();
  }, [currentUser, isAuthLoading, router]);

  const handleFollowToggle = async (studentId: string) => {
      if (!currentUser) return;
      
      // Optimistically remove the friend from the list
      const originalFriends = friends;
      setFriends(prevFriends => prevFriends.filter(f => f.id !== studentId));
      
      try {
        await toggleFollow(currentUser.id, studentId);
      } catch (error) {
          console.error("Failed to unfollow", error);
          // Revert on error
          setFriends(originalFriends);
      }
  };
  
  if (isAuthLoading || !currentUser) {
    return (
         <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <Skeleton className="h-10 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-3/4 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">My Friends</h1>
        <p className="mt-2 text-lg text-muted-foreground">The people you are following.</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <StudentList students={friends} currentUserId={currentUser?.id} onFollowToggle={handleFollowToggle}/>
      )}
    </div>
  );
}


export default function FriendsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FriendsContent />
    </Suspense>
  )
}
