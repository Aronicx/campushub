
import { StudentList } from "@/components/student-list";
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Student Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Log in to edit your profile and connect with others.</p>
      </div>
      <Suspense fallback={<p>Loading students...</p>}>
        <StudentList />
      </Suspense>
    </div>
  );
}
