
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, setDoc, writeBatch, deleteDoc, arrayRemove, addDoc, serverTimestamp, onSnapshot, orderBy, Timestamp, collectionGroup } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { Student, Thought, Comment, ChatMessage, Click } from './types';
import { db, storage } from './firebase';

const studentsCollection = collection(db, 'students');
const chatMessagesCollection = collection(db, 'chatMessages');
const clicksCollection = collection(db, 'clicks');


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
            likes: [],
            comments: [],
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
        likedBy: [],
    };
    
    const studentDocRef = doc(db, 'students', newStudent.id);
    await setDoc(studentDocRef, newStudent);
    
    return newStudent;
}

export async function deleteStudent(studentId: string): Promise<void> {
    const docRef = doc(db, 'students', studentId);
    await deleteDoc(docRef);
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

export async function toggleLikeThought(authorId: string, thoughtId: string, likerId: string): Promise<Thought | undefined> {
    const authorRef = doc(db, 'students', authorId);
    const authorSnap = await getDoc(authorRef);

    if (!authorSnap.exists()) {
        throw new Error("Author not found");
    }

    const author = authorSnap.data() as Student;
    const thoughtIndex = author.thoughts.findIndex(t => t.id === thoughtId);

    if (thoughtIndex === -1) {
        throw new Error("Thought not found");
    }

    const thought = author.thoughts[thoughtIndex];
    const likeIndex = thought.likes.indexOf(likerId);

    if (likeIndex > -1) {
        // User has already liked the thought, so unlike it.
        thought.likes.splice(likeIndex, 1);
    } else {
        // User has not liked the thought, so like it.
        thought.likes.push(likerId);
    }
    
    // Update the entire thoughts array in Firestore
    await updateDoc(authorRef, { thoughts: author.thoughts });
    
    return thought;
}

export async function toggleProfileLike(studentId: string, likerId: string): Promise<boolean> {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
        throw new Error("Student not found");
    }

    const student = studentSnap.data() as Student;
    const isLiked = (student.likedBy || []).includes(likerId);

    if (isLiked) {
        // Unlike
        await updateDoc(studentRef, {
            likedBy: arrayRemove(likerId)
        });
        return false;
    } else {
        // Like
        await updateDoc(studentRef, {
            likedBy: arrayUnion(likerId)
        });
        return true;
    }
}

export async function addOrUpdateComment(
    authorId: string,
    thoughtId: string,
    commenter: { id: string; name: string; profilePicture?: string },
    content: string
): Promise<Comment[] | undefined> {
    const authorRef = doc(db, 'students', authorId);
    const authorSnap = await getDoc(authorRef);

    if (!authorSnap.exists()) {
        throw new Error("Author not found");
    }

    const author = authorSnap.data() as Student;
    const thoughtIndex = author.thoughts.findIndex(t => t.id === thoughtId);

    if (thoughtIndex === -1) {
        throw new Error("Thought not found");
    }

    const thought = author.thoughts[thoughtIndex];
    const commentIndex = thought.comments.findIndex(c => c.authorId === commenter.id);

    if (commentIndex > -1) {
        // Update existing comment
        thought.comments[commentIndex].content = content;
        thought.comments[commentIndex].timestamp = new Date().toISOString();
    } else {
        // Add new comment
        const newComment: Comment = {
            id: `${thoughtId}-${commenter.id}`,
            authorId: commenter.id,
            authorName: commenter.name,
            authorProfilePicture: commenter.profilePicture,
            content,
            timestamp: new Date().toISOString(),
        };
        thought.comments.push(newComment);
    }

    await updateDoc(authorRef, { thoughts: author.thoughts });
    return thought.comments.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function deleteComment(authorId: string, thoughtId: string, commenterId: string): Promise<Comment[] | undefined> {
    const authorRef = doc(db, 'students', authorId);
    const authorSnap = await getDoc(authorRef);

    if (!authorSnap.exists()) {
        throw new Error("Author not found");
    }

    const author = authorSnap.data() as Student;
    const thoughtIndex = author.thoughts.findIndex(t => t.id === thoughtId);

    if (thoughtIndex === -1) {
        throw new Error("Thought not found");
    }

    const thought = author.thoughts[thoughtIndex];
    thought.comments = thought.comments.filter(c => c.authorId !== commenterId);

    await updateDoc(authorRef, { thoughts: author.thoughts });
    return thought.comments;
}


export async function addChatMessage(user: Student, content: string): Promise<void> {
  if (!content.trim()) return;

  await addDoc(chatMessagesCollection, {
    authorId: user.id,
    authorName: user.name,
    authorProfilePicture: user.profilePicture || '',
    content: content.trim(),
    timestamp: serverTimestamp(),
  });
}

export function onNewMessage(callback: (messages: ChatMessage[]) => void): () => void {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const q = query(chatMessagesCollection, orderBy('timestamp', 'asc'), where('timestamp', '>=', new Date(fiveMinutesAgo)));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toMillis() || Date.now();
            
            // Additional client-side filter for safety
            if (timestamp >= fiveMinutesAgo) {
                messages.push({
                    id: doc.id,
                    ...data,
                    timestamp: timestamp
                } as ChatMessage);
            }
        });
        callback(messages);
    });

    return unsubscribe;
}

// Clicks functionality

export async function getRecentClicks(): Promise<Click[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(clicksCollection, where("timestamp", ">=", twentyFourHoursAgo.toISOString()), orderBy("timestamp", "desc"));
    
    const snapshot = await getDocs(q);
    const clicksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Click));

    // Attach student rollNo for sorting by "All"
    const students = await getStudents();
    const studentMap = new Map(students.map(s => [s.id, s]));

    return clicksData.map(click => {
        const author = studentMap.get(click.authorId);
        return {
            ...click,
            authorRollNo: author ? parseInt(author.rollNo, 10) : Infinity,
        };
    });
}

export async function getClicksByAuthor(authorId: string): Promise<Click[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // This query might need an index. If it fails, we need to filter client-side.
    const q = query(clicksCollection, 
        where("authorId", "==", authorId),
        where("timestamp", ">=", twentyFourHoursAgo.toISOString())
    );
    
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Click));
    } catch (error) {
        console.warn("Firestore query failed, falling back to client-side filtering for getClicksByAuthor. Consider adding a composite index.", error);
        // Fallback to client-side filtering if index is missing
        const allUserClicks = await getDocs(query(clicksCollection, where("authorId", "==", authorId)));
        const clicks = allUserClicks.docs.map(doc => ({ id: doc.id, ...doc.data() } as Click));
        return clicks.filter(click => new Date(click.timestamp).getTime() >= twentyFourHoursAgo.getTime());
    }
}


export async function addClick(author: Student, imageDataUrl: string): Promise<Click> {
    // Check user's click count for the last 24 hours
    const userClicks = await getClicksByAuthor(author.id);
    if (userClicks.length >= 10) {
        throw new Error("You have reached the maximum of 10 Clicks per day.");
    }

    // Upload to storage
    const timestamp = Date.now();
    const storagePath = `clicks/${author.id}/${timestamp}.webp`;
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadString(storageRef, imageDataUrl, 'data_url');
    const imageUrl = await getDownloadURL(uploadResult.ref);

    // Add to Firestore
    const newClickDoc = doc(clicksCollection);
    const newClick: Click = {
        id: newClickDoc.id,
        authorId: author.id,
        authorName: author.name,
        authorProfilePicture: author.profilePicture,
        imageUrl,
        storagePath,
        timestamp: new Date().toISOString(),
        likes: [],
    };

    await setDoc(newClickDoc, newClick);
    return newClick;
}

export async function toggleClickLike(clickId: string, likerId: string): Promise<boolean> {
    const clickRef = doc(db, 'clicks', clickId);
    const clickSnap = await getDoc(clickRef);

    if (!clickSnap.exists()) {
        throw new Error("Click not found");
    }

    const click = clickSnap.data() as Click;
    const isLiked = (click.likes || []).includes(likerId);

    if (isLiked) {
        // Unlike
        await updateDoc(clickRef, {
            likes: arrayRemove(likerId)
        });
        return false;
    } else {
        // Like
        await updateDoc(clickRef, {
            likes: arrayUnion(likerId)
        });
        return true;
    }
}


export async function deleteClick(click: Click): Promise<void> {
    // Delete from storage
    const storageRef = ref(storage, click.storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    const clickDocRef = doc(db, 'clicks', click.id);
    await deleteDoc(clickDocRef);
}

export async function cleanupExpiredClicks(): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const allClicksSnapshot = await getDocs(clicksCollection);

    const expiredClicks = allClicksSnapshot.docs.filter(doc => {
        const click = doc.data() as Click;
        return new Date(click.timestamp).getTime() < twentyFourHoursAgo.getTime();
    });

    if (expiredClicks.length === 0) return;

    const batch = writeBatch(db);
    for (const doc of expiredClicks) {
        const click = doc.data() as Click;
        // Delete from storage first
        try {
            if (click.storagePath) {
                const storageRef = ref(storage, click.storagePath);
                await deleteObject(storageRef);
            }
        } catch (error) {
            console.error(`Failed to delete from storage: ${click.storagePath}`, error)
        }
        // Then delete from firestore
        batch.delete(doc.ref);
    };

    await batch.commit();
}
