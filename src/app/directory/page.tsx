
"use client";

import { getStudents, getUniqueMajors, getUniqueInterests, toggleFollow } from "@/lib/mock-data";
import { StudentCard } from "@/components/student-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Suspense, useEffect, useState, useTransition } from 'react';
import type { Student } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users } from "lucide-react";

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
      
      router.push(`${pathname}${query}`);
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
          placeholder="Search by name or roll no..." 
          className="pl-10" 
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>
      <Button asChild>
        <Link href="/friends">
            <Users className="mr-2" /> My Friends
        </Link>
      </Button>
    </div>
  );
}

function StudentList({ students, currentUserId, onFollowToggle }: { students: Student[], currentUserId?: string, onFollowToggle: (studentId: string) => void }) {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No students found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} currentUserId={currentUserId} onFollowToggle={onFollowToggle} />
      ))}
    </div>
  );
}

function StudentDirectoryContent() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const filters = {
        search: searchParams.get('search') || undefined,
      };
      const studentsData = await getStudents(filters);
      setStudents(studentsData);
      setIsLoading(false);
    }
    fetchData();
  }, [searchParams]);

  const handleFollowToggle = async (studentId: string) => {
      if (!currentUser) return;
      
      // Optimistically update the UI
      setStudents(prevStudents => 
          prevStudents.map(student => {
              if (student.id === studentId) {
                  const isFollowing = (student.followers || []).includes(currentUser.id);
                  const newFollowers = isFollowing
                      ? (student.followers || []).filter(id => id !== currentUser.id)
                      : [...(student.followers || []), currentUser.id];
                  return { ...student, followers: newFollowers };
              }
              return student;
          })
      );
      
      // Call the backend to update the follow status
      await toggleFollow(currentUser.id, studentId);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Student Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Find and connect with students across campus.</p>
      </div>
      <div className="mb-8 p-6 bg-card rounded-lg shadow-sm border">
          <FilterControls />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <StudentList students={students} currentUserId={currentUser?.id} onFollowToggle={handleFollowToggle}/>
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
