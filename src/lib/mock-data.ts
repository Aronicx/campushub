import type { Student, Thought } from './types';
import {privateData} from './private-data';

// This is a placeholder for the real private data.
const _initialStudents = (privateData as any)._initialStudents as Student[];

let students: Student[] = _initialStudents;

export function getStudents(filters?: { search?: string, major?: string, interest?: string }): Student[] {
    let filteredStudents = [...students];

    if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredStudents = filteredStudents.filter(s => (s.name || '').toLowerCase().includes(searchTerm));
    }
    if (filters?.major && filters.major !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.major === filters.major);
    }
    if (filters?.interest && filters.interest !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.interests.includes(filters.interest));
    }

    return filteredStudents;
}

export function getStudentById(id: string): Student | undefined {
  return students.find(s => s.id === id);
}

export function getStudentByEmail(email: string): Student | undefined {
  return students.find(s => s.email === email);
}

export function addStudent(studentData: Omit<Student, 'id' | 'thoughts'>): Student {
    const newStudent: Student = {
        ...studentData,
        id: (students.length + 1).toString(),
        thoughts: [],
    };
    students.unshift(newStudent);
    return newStudent;
}

export function updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex > -1) {
        students[studentIndex] = { ...students[studentIndex], ...updates };
        return students[studentIndex];
    }
    return undefined;
}

export function addThought(studentId: string, content: string): Thought | undefined {
    const student = getStudentById(studentId);
    if (student) {
        const newThought: Thought = {
            id: `${studentId}-thought-${student.thoughts.length + 1}`,
            content,
            timestamp: new Date().toISOString(),
        };
        student.thoughts.unshift(newThought);
        updateStudent(studentId, { thoughts: student.thoughts });
        return newThought;
    }
    return undefined;
}

export function getUniqueMajors(): string[] {
    const majors = new Set(students.map(s => s.major));
    return Array.from(majors).sort();
}

export function getUniqueInterests(): string[] {
    const interests = new Set(students.flatMap(s => s.interests));
    return Array.from(interests).sort();
}
