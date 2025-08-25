import type { Student, Thought } from './types';
import {privateData} from './private-data';

// This is a placeholder for the real private data.
const _initialStudents = (privateData as any)._initialStudents as Student[];

let students: Student[];

// Helper to get students from localStorage or initialize it
function getStudentsFromStorage(): Student[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedStudents = localStorage.getItem('campus-hub-students');
        if (storedStudents) {
            try {
                return JSON.parse(storedStudents);
            } catch (e) {
                console.error("Failed to parse students from localStorage", e);
                // If parsing fails, fallback to initial data
            }
        }
    }
    return _initialStudents;
}

// Helper to save students to localStorage
function saveStudentsToStorage(studentsToSave: Student[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            localStorage.setItem('campus-hub-students', JSON.stringify(studentsToSave));
        } catch (e) {
            console.error("Failed to save students to localStorage", e);
        }
    }
}

// Initialize students
students = getStudentsFromStorage();

export function getStudents(filters?: { search?: string, major?: string, interest?: string }): Student[] {
    let filteredStudents = [...students];

    if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredStudents = filteredStudents.filter(s => 
            (s.name || '').toLowerCase().includes(searchTerm) ||
            s.rollNo.toLowerCase().includes(searchTerm)
        );
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

export function getStudentByName(name: string): Student | undefined {
    if (!name) return undefined;
    return students.find(s => s.name.toLowerCase() === name.toLowerCase());
}

export function getStudentByRollNo(rollNo: string): Student | undefined {
    return students.find(s => s.rollNo === rollNo);
}

export function updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex > -1) {
        students[studentIndex] = { ...students[studentIndex], ...updates };
        saveStudentsToStorage(students);
        return students[studentIndex];
    }
    return undefined;
}

export function addThought(studentId: string, content: string): Thought | undefined {
    const student = getStudentById(studentId);
    if (student) {
        const newThought: Thought = {
            id: `${studentId}-thought-${Date.now()}`,
            content,
            timestamp: new Date().toISOString(),
        };
        student.thoughts.unshift(newThought);
        updateStudent(studentId, { thoughts: student.thoughts });
        // updateStudent already saves to storage
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
