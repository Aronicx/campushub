
"use client";

import { getStudents, getUniqueMajors, getUniqueInterests, toggleProfileLike } from "@/lib/mock-data";
import { StudentCard } from "@/components/student-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Suspense, useEffect, useState, useTransition } from 'react';
import type { Student } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function FilterControls({ majors, interests }: { majors: string[], interests: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleFilterChange = (type: 'search' | 'major' | 'interest', value: string) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      if (!value || value === 'all') {
        current.delete(type);
      } else {
        current.set(type, value);
      }
      
      const search = current.toString();
      const query = search ? `?${search}` : "";
      
      router.push(`${pathname}${query}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative w-full sm:w-1/2 md:w-1/3">
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
      <Select name="major" onValueChange={(value) => handleFilterChange('major', value)} defaultValue={searchParams.get('major') || 'all'}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Major" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Majors</SelectItem>
          {majors.map(major => <SelectItem key={major} value={major}>{major}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select name="interest" onValueChange={(value) => handleFilterChange('interest', value)} defaultValue={searchParams.get('interest') || 'all'}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Interest" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Interests</SelectItem>
          {interests.map(interest => <SelectItem key={interest} value={interest}>{interest}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function StudentList({ students, currentUserId, onLikeToggle }: { students: Student[], currentUserId?: string, onLikeToggle: (studentId: string) => void }) {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No students found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} currentUserId={currentUserId} onLikeToggle={onLikeToggle} />
      ))}
    </div>
  );
}

function StudentDirectoryContent() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const filters = {
        search: searchParams.get('search') || undefined,
        major: searchParams.get('major') || undefined,
        interest: searchParams.get('interest') || undefined,
      };
      const [studentsData, majorsData, interestsData] = await Promise.all([
        getStudents(filters),
        getUniqueMajors(),
        getUniqueInterests(),
      ]);
      setStudents(studentsData);
      setMajors(majorsData);
      setInterests(interestsData);
      setIsLoading(false);
    }
    fetchData();
  }, [searchParams]);

  const handleLikeToggle = async (studentId: string) => {
      if (!currentUser) return;
      
      const isLiked = await toggleProfileLike(studentId, currentUser.id);

      setStudents(prevStudents => 
          prevStudents.map(student => {
              if (student.id === studentId) {
                  const newLikedBy = isLiked
                      ? [...student.likedBy, currentUser.id]
                      : student.likedBy.filter(id => id !== currentUser.id);
                  return { ...student, likedBy: newLikedBy };
              }
              return student;
          })
      );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Student Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Find and connect with students across campus.</p>
      </div>
      <div className="mb-8 p-6 bg-card rounded-lg shadow-sm border">
          <FilterControls majors={majors} interests={interests} />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <StudentList students={students} currentUserId={currentUser?.id} onLikeToggle={handleLikeToggle}/>
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
