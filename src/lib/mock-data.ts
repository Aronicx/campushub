
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, setDoc, writeBatch, deleteDoc, arrayRemove, addDoc, serverTimestamp, onSnapshot, orderBy, Timestamp, collectionGroup } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { Student, Thought, Comment, ChatMessage, Click, Notification } from './types';
import { db, storage } from './firebase';

const studentsCollection = collection(db, 'students');
const chatMessagesCollection = collection(db, 'chatMessages');
const clicksCollection = collection(db, 'clicks');

async function addNotification(userId: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const userRef = doc(db, 'students', userId);
    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    await updateDoc(userRef, {
        notifications: arrayUnion(newNotification)
    });
}

export async function getStudents(filters?: { search?: string }): Promise<Student[]> {
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

    return students;
}

export async function getFollowing(userId: string): Promise<Student[]> {
    const userDoc = await getStudentById(userId);
    if (!userDoc || !userDoc.following || userDoc.following.length === 0) {
        return [];
    }

    // Firestore 'in' query is limited to 30 items. For larger lists, you'd need multiple queries.
    const followingIds = userDoc.following;
    if (followingIds.length === 0) return [];
    
    const q = query(studentsCollection, where('id', 'in', followingIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Student);
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

export async function updateThought(studentId: string, thoughtId: string, newContent: string): Promise<Thought | undefined> {
    const authorRef = doc(db, 'students', studentId);
    const authorSnap = await getDoc(authorRef);

    if (!authorSnap.exists()) {
        throw new Error("Author not found");
    }

    const author = authorSnap.data() as Student;
    const thoughtIndex = author.thoughts.findIndex(t => t.id === thoughtId);

    if (thoughtIndex === -1) {
        throw new Error("Thought not found");
    }

    author.thoughts[thoughtIndex].content = newContent;
    
    await updateDoc(authorRef, { thoughts: author.thoughts });
    
    return author.thoughts[thoughtIndex];
}

export async function deleteThought(studentId: string, thoughtId: string): Promise<void> {
    const authorRef = doc(db, 'students', studentId);
    const authorSnap = await getDoc(authorRef);

    if (!authorSnap.exists()) {
        throw new Error("Author not found");
    }

    const author = authorSnap.data() as Student;
    const updatedThoughts = author.thoughts.filter(t => t.id !== thoughtId);
    
    await updateDoc(authorRef, { thoughts: updatedThoughts });
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
        following: [],
        followers: [],
        likedBy: [],
        notifications: [],
    };
    
    const studentDocRef = doc(db, 'students', newStudent.id);
    await setDoc(studentDocRef, newStudent);
    
    return newStudent;
}

export async function deleteStudent(studentId: string): Promise<void> {
    const docRef = doc(db, 'students', studentId);
    await deleteDoc(docRef);
}

export async function toggleProfileLike(targetUserId: string, currentUserId: string): Promise<void> {
    const targetUserRef = doc(db, 'students', targetUserId);
    const targetUserSnap = await getDoc(targetUserRef);
    const currentUserSnap = await getDoc(doc(db, 'students', currentUserId));


    if (!targetUserSnap.exists() || !currentUserSnap.exists()) {
        throw new Error("User not found.");
    }

    const targetUserData = targetUserSnap.data() as Student;
    const currentUserData = currentUserSnap.data() as Student;
    const isLiked = (targetUserData.likedBy || []).includes(currentUserId);

    if (isLiked) {
        await updateDoc(targetUserRef, { likedBy: arrayRemove(currentUserId) });
    } else {
        await updateDoc(targetUserRef, { likedBy: arrayUnion(currentUserId) });
        // Add notification
        if (targetUserId !== currentUserId) {
            await addNotification(targetUserId, {
                type: 'profile_like',
                message: `${currentUserData.name} liked your profile.`,
                link: `/profile/${currentUserId}`,
                fromUser: {
                    id: currentUserData.id,
                    name: currentUserData.name,
                    profilePicture: currentUserData.profilePicture
                }
            })
        }
    }
}


export async function toggleLikeThought(authorId: string, thoughtId: string, likerId: string): Promise<Thought | undefined> {
    const authorRef = doc(db, 'students', authorId);
    const authorSnap = await getDoc(authorRef);
    const likerSnap = await getDoc(doc(db, 'students', likerId));


    if (!authorSnap.exists() || !likerSnap.exists()) {
        throw new Error("User not found");
    }

    const author = authorSnap.data() as Student;
    const liker = likerSnap.data() as Student;
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
        if (authorId !== likerId) {
            await addNotification(authorId, {
                type: 'thought_like',
                message: `${liker.name} liked your thought.`,
                link: `/thought-bubbles#${thoughtId}`,
                fromUser: {
                    id: liker.id,
                    name: liker.name,
                    profilePicture: liker.profilePicture
                }
            })
        }
    }
    
    // Update the entire thoughts array in Firestore
    await updateDoc(authorRef, { thoughts: author.thoughts });
    
    return thought;
}

export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'students', currentUserId);
    const targetUserRef = doc(db, 'students', targetUserId);

    const currentUserSnap = await getDoc(currentUserRef);
    if (!currentUserSnap.exists()) throw new Error("Current user not found.");
    
    const currentUserData = currentUserSnap.data() as Student;
    const isFollowing = (currentUserData.following || []).includes(targetUserId);

    const batch = writeBatch(db);

    if (isFollowing) {
        // Unfollow
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
    } else {
        // Follow
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
        
        // Add notification
         if (targetUserId !== currentUserId) {
            await addNotification(targetUserId, {
                type: 'follow',
                message: `${currentUserData.name} started following you.`,
                link: `/profile/${currentUserId}`,
                fromUser: {
                    id: currentUserData.id,
                    name: currentUserData.name,
                    profilePicture: currentUserData.profilePicture
                }
            })
        }
    }

    await batch.commit();
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
    const eightMinutesAgo = Date.now() - (8 * 60 * 1000);
    const q = query(chatMessagesCollection, orderBy('timestamp', 'asc'), where('timestamp', '>=', new Date(eightMinutesAgo)));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toMillis() || Date.now();
            
            // Additional client-side filter for safety
            if (timestamp >= eightMinutesAgo) {
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
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
    const q = query(clicksCollection, where("timestamp", ">=", twentyHoursAgo.toISOString()), orderBy("timestamp", "desc"));
    
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
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
    // Query requires a composite index on authorId and timestamp.
    // To avoid crashes for users, we'll query only by authorId and filter client-side.
    // The ideal solution is for the user to create the index via the Firebase console link in the error.
    const q = query(clicksCollection, where("authorId", "==", authorId));
    
    const snapshot = await getDocs(q);
    const clicks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Click));

    // Client-side filtering
    return clicks.filter(click => new Date(click.timestamp).getTime() >= twentyHoursAgo.getTime());
}


export async function addClick(author: Student, imageDataUrl: string): Promise<Click> {
    // Check user's click count for the last 20 hours
    const userClicks = await getClicksByAuthor(author.id);
    if (userClicks.length >= 3) {
        throw new Error("You have reached the maximum of 3 active Clicks.");
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
    const likerSnap = await getDoc(doc(db, 'students', likerId));

    if (!clickSnap.exists() || !likerSnap.exists()) {
        throw new Error("Click or Liker not found");
    }

    const click = clickSnap.data() as Click;
    const liker = likerSnap.data() as Student;
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
        if (click.authorId !== likerId) {
            await addNotification(click.authorId, {
                type: 'click_like',
                message: `${liker.name} liked your click.`,
                link: `/clicks#${click.id}`,
                 fromUser: {
                    id: liker.id,
                    name: liker.name,
                    profilePicture: liker.profilePicture
                }
            });
        }
        return true;
    }
}


export async function deleteClick(click: Click): Promise<void> {
    // Delete from storage
    try {
        if (click.storagePath) {
            const storageRef = ref(storage, click.storagePath);
            await deleteObject(storageRef);
        }
    } catch (error: any) {
       // If file doesn't exist, we can ignore the error
       if (error.code !== 'storage/object-not-found') {
           console.error(`Failed to delete from storage: ${click.storagePath}`, error);
           // We might still want to proceed to delete the Firestore doc
       }
    }

    // Delete from Firestore
    const clickDocRef = doc(db, 'clicks', click.id);
    await deleteDoc(clickDocRef);
}

export async function cleanupExpiredClicks(): Promise<void> {
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
    
    // Fetch all clicks and filter client-side to avoid needing a specific index on timestamp.
    const allClicksSnapshot = await getDocs(clicksCollection);

    const expiredClicks = allClicksSnapshot.docs.filter(doc => {
        const click = doc.data() as Click;
        return new Date(click.timestamp).getTime() < twentyHoursAgo.getTime();
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
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error(`Failed to delete from storage: ${click.storagePath}`, error)
            }
        }
        // Then delete from firestore
        batch.delete(doc.ref);
    };

    await batch.commit();
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const userRef = doc(db, 'students', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("User not found");
    }

    const user = userSnap.data() as Student;
    const updatedNotifications = user.notifications.map(notif => {
        if (notificationIds.includes(notif.id)) {
            return { ...notif, read: true };
        }
        return notif;
    });

    await updateDoc(userRef, { notifications: updatedNotifications });
}
