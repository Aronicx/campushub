
import { getStudents } from "@/lib/mock-data";
import { StudentCard } from "@/components/student-card";
import { Suspense } from 'react';
import type { Student } from "@/lib/types";

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

export default async function HomePage() {
  const students = await getStudents();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Student Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Log in to edit your profile and connect with others.</p>
      </div>
      <Suspense fallback={<p>Loading students...</p>}>
        <StudentList students={students} />
      </Suspense>
    </div>
  );
}
