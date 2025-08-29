

import { getStudents, getUniqueMajors, getUniqueInterests } from "@/lib/mock-data";
import { StudentCard } from "@/components/student-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Suspense } from 'react';
import type { Student } from "@/lib/types";

function FilterControls({ majors, interests }: { majors: string[], interests: string[] }) {
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
        <Input name="search" placeholder="Search by name or roll no..." className="pl-10" />
      </div>
      <Select name="major">
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by Major" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Majors</SelectItem>
          {majors.map(major => <SelectItem key={major} value={major}>{major}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select name="interest">
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

function StudentList({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No students found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}

export default async function StudentDirectoryPage({
  searchParams,
}: {
  searchParams: { search?: string, major?: string, interest?: string }
}) {
  const students = await getStudents(searchParams);
  const majors = await getUniqueMajors();
  const interests = await getUniqueInterests();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Student Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Find and connect with students across campus.</p>
      </div>
      <form className="mb-8 p-6 bg-card rounded-lg shadow-sm border">
        <Suspense>
          <FilterControls majors={majors} interests={interests} />
        </Suspense>
      </form>
      <Suspense fallback={<p>Loading students...</p>}>
        <StudentList students={students} />
      </Suspense>
    </div>
  );
}
