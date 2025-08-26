
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, setDoc, writeBatch } from 'firebase/firestore';
import type { Student, Thought } from './types';
import { db } from './firebase';

const studentsCollection = collection(db, 'students');

export async function getStudents(filters?: { search?: string, major?: string, interest?: string }): Promise<Student[]> {
    let q = query(studentsCollection);
    
    // Note: Firestore does not support case-insensitive search or partial string matching natively.
    // A more robust search solution like Algolia or Elasticsearch would be needed for that.
    // For now, we will fetch all and filter client-side, which is not ideal for large datasets.
    
    const snapshot = await getDocs(q);
    let students: Student[] = snapshot.docs.map(doc => doc.data() as Student);
    
    // Sort by roll number numerically
    students.sort((a, b) => parseInt(a.rollNo, 10) - parseInt(b.rollNo, 10));


    if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        students = students.filter(s => 
            (s.name || '').toLowerCase().includes(searchTerm) ||
            s.rollNo.toLowerCase().includes(searchTerm)
        );
    }
    if (filters?.major && filters.major !== 'all') {
        students = students.filter(s => s.major === filters.major);
    }
    if (filters?.interest && filters.interest !== 'all') {
        students = students.filter(s => s.interests.includes(filters.interest as string));
    }

    return students;
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const docRef = doc(db, 'students', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as Student : undefined;
}


export async function getStudentByEmail(email: string): Promise<Student | undefined> {
  const q = query(studentsCollection, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return undefined;
  return snapshot.docs[0].data() as Student;
}

export async function getStudentByName(name: string): Promise<Student | undefined> {
    if (!name) return undefined;
    const q = query(studentsCollection, where("name", "==", name));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Student;
}

export async function getStudentByRollNo(rollNo: string): Promise<Student | undefined> {
    const q = query(studentsCollection, where("rollNo", "==", rollNo));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Student;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const docRef = doc(db, 'students', id);
    await updateDoc(docRef, updates);
    return await getStudentById(id);
}

export async function addThought(studentId: string, content: string): Promise<Thought | undefined> {
    const student = await getStudentById(studentId);
    if (student) {
        const newThought: Thought = {
            id: `${studentId}-thought-${Date.now()}`,
            content,
            timestamp: new Date().toISOString(),
        };
        const docRef = doc(db, 'students', studentId);
        await updateDoc(docRef, {
            thoughts: arrayUnion(newThought)
        });
        return newThought;
    }
    return undefined;
}

export async function createStudent(data: { rollNo: string; name: string; password?: string; }): Promise<Student> {
    const { rollNo, name, password } = data;

    // Check for uniqueness
    const rollNoExists = await getStudentByRollNo(rollNo);
    if (rollNoExists) {
        throw new Error("A user with this roll number already exists.");
    }
    const nameExists = await getStudentByName(name);
    if (nameExists) {
        throw new Error("A user with this name already exists.");
    }

    const newStudent: Student = {
        id: rollNo, // Use rollNo as the document ID for simplicity
        rollNo,
        name,
        password,
        major: "Undeclared",
        interests: [],
        profilePicture: `https://picsum.photos/seed/${rollNo}/256/256`,
        bio: `A new member of the Campus Hub community!`,
        email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
        thoughts: [],
    };
    
    const studentDocRef = doc(db, 'students', newStudent.id);
    await setDoc(studentDocRef, newStudent);
    
    return newStudent;
}


export async function getUniqueMajors(): Promise<string[]> {
    const snapshot = await getDocs(studentsCollection);
    const majors = new Set(snapshot.docs.map(d => (d.data() as Student).major));
    return Array.from(majors).sort();
}

export async function getUniqueInterests(): Promise<string[]> {
    const snapshot = await getDocs(studentsCollection);
    const interests = new Set(snapshot.docs.flatMap(d => (d.data() as Student).interests));
    return Array.from(interests).sort();
}
