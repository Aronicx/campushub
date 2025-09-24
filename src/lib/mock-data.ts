





















import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, setDoc, writeBatch, deleteDoc, arrayRemove, addDoc, serverTimestamp, onSnapshot, orderBy, Timestamp, collectionGroup } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { Student, Thought, Comment, ChatMessage, Notification, PrivateChatMessage, ChatContact, Note, TrustLike } from './types';
import { db, storage } from './firebase';

const studentsCollection = collection(db, 'students');
const chatMessagesCollection = collection(db, 'chatMessages');
const privateChatMessagesCollection = collection(db, 'privateChatMessages');
const notesCollection = collection(db, 'notes');

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

// In-memory flag to prevent re-running the election on the same day.
// In a production app, use a persistent store (e.g., Firestore doc) for this.
let lastElectionDate: string | null = null;


async function assignCoordinatorRoles(students: Student[]): Promise<Student[]> {
    const today = new Date();
    const currentDay = today.getDate();
    const moderatorUsername = 'moderator'; // Assuming a moderator user exists with this username

    if (today.toISOString().split('T')[0] === lastElectionDate) {
        return students.map(s => ({ ...s }));
    }
    
    if (currentDay === 1) {
        lastElectionDate = today.toISOString().split('T')[0];

        const candidates = students
            .filter(s => s.username !== moderatorUsername && (s.trustLikes?.length || 0) >= 20)
            .sort((a, b) => (b.trustLikes?.length || 0) - (a.trustLikes?.length || 0));

        const newCoordinatorIds = new Set(candidates.slice(0, 2).map(c => c.id));
        
        const batch = writeBatch(db);
        students.forEach(student => {
            const studentRef = doc(db, 'students', student.id);
            const isNewCoordinator = newCoordinatorIds.has(student.id) || student.username === moderatorUsername;
            batch.update(studentRef, {
                trustLikes: [],
                isCoordinator: isNewCoordinator,
            });
        });
        await batch.commit();
        
        const updatedStudentsSnap = await getDocs(studentsCollection);
        return updatedStudentsSnap.docs.map(d => d.data() as Student);

    }

    return students.map(s => ({ ...s }));
}


export async function getStudents(filters?: { search?: string }): Promise<Student[]> {
    let q = query(studentsCollection);
    
    const snapshot = await getDocs(q);
    let students: Student[] = snapshot.docs.map(doc => doc.data() as Student);
    
    // This logic is simplified; real coordinator logic might be different
    // students = await assignCoordinatorRoles(students);
    
    students.sort((a, b) => a.name.localeCompare(b.name));

    if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        students = students.filter(s => 
            (s.name || '').toLowerCase().includes(searchTerm) ||
            s.username.toLowerCase().includes(searchTerm)
        );
    }

    return students;
}

export async function getFollowing(userId: string): Promise<Student[]> {
    const userDoc = await getStudentById(userId);
    if (!userDoc || !userDoc.following || userDoc.following.length === 0) {
        return [];
    }

    const followingIds = userDoc.following;
    if (followingIds.length === 0) return [];
    
    const q = query(studentsCollection, where('id', 'in', followingIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Student);
}

export async function getFollowers(userId: string): Promise<Student[]> {
    const userDoc = await getStudentById(userId);
    if (!userDoc || !userDoc.followers || userDoc.followers.length === 0) {
        return [];
    }

    const followerIds = userDoc.followers;
    if (followerIds.length === 0) return [];
    
    const q = query(studentsCollection, where('id', 'in', followerIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Student);
}

export async function getProfileLikers(userId: string): Promise<Student[]> {
    const userDoc = await getStudentById(userId);
    if (!userDoc || !userDoc.likedBy || userDoc.likedBy.length === 0) {
        return [];
    }

    const likerIds = userDoc.likedBy;
    if (likerIds.length === 0) return [];
    
    const q = query(studentsCollection, where('id', 'in', likerIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Student);
}


export async function getStudentById(id: string): Promise<Student | undefined> {
  const docRef = doc(db, 'students', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return undefined;
  
  return docSnap.data() as Student;
}


export async function getStudentByEmail(email: string): Promise<Student | undefined> {
  const q = query(studentsCollection, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return undefined;
  return snapshot.docs[0].data() as Student;
}

export async function getStudentByUsername(username: string): Promise<Student | undefined> {
    if (!username) return undefined;
    const docRef = doc(db, 'students', username);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return undefined;
    return docSnap.data() as Student;
}

export async function getStudentByName(name: string): Promise<Student | undefined> {
    if (!name) return undefined;
    const q = query(studentsCollection, where("name", "==", name));
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


export async function createStudent(data: { username: string; name: string; password?: string; collegeName: string; term: string; degree: string; course: string; }): Promise<Student> {
    const { username, name, password, collegeName, term, degree, course } = data;

    const usernameExists = await getStudentByUsername(username);
    if (usernameExists) {
        throw new Error("This username is already taken.");
    }

    const newStudent: Student = {
        id: username, // Use username as the document ID
        username,
        name,
        password,
        collegeName,
        term,
        degree,
        course,
        major: "Undeclared", // Can be updated by user later
        interests: [],
        profilePicture: `https://picsum.photos/seed/${username}/256/256`,
        bio: `A new member of the Campus Hub community!`,
        email: `${username}@example.com`,
        thoughts: [],
        following: [],
        followers: [],
likedBy: [],
        trustLikes: [],
        notifications: [],
        pendingFollowRequests: [],
        sentFollowRequests: [],
        isPrivate: false,
        blockedUsers: [],
        isCoordinator: false,
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

export async function toggleTrustLike(targetUserId: string, currentUserId: string): Promise<void> {
    if (targetUserId === currentUserId) return;

    const targetUserRef = doc(db, 'students', targetUserId);
    const targetUserSnap = await getDoc(targetUserRef);

    if (!targetUserSnap.exists()) {
        throw new Error("User not found.");
    }

    const targetUserData = targetUserSnap.data() as Student;
    const trustLikes = targetUserData.trustLikes || [];
    
    const existingLikeIndex = trustLikes.findIndex(like => like.userId === currentUserId);

    if (existingLikeIndex > -1) {
        await updateDoc(targetUserRef, {
            trustLikes: arrayRemove(trustLikes[existingLikeIndex])
        });
    } else {
        const newTrustLike: TrustLike = { userId: currentUserId, timestamp: Date.now() };
        await updateDoc(targetUserRef, {
            trustLikes: arrayUnion(newTrustLike)
        });
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
        thought.likes.splice(likeIndex, 1);
    } else {
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
    
    await updateDoc(authorRef, { thoughts: author.thoughts });
    
    return thought;
}

export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'students', currentUserId);
    const targetUserRef = doc(db, 'students', targetUserId);

    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
        throw new Error("User not found.");
    }
    
    const currentUserData = currentUserSnap.data() as Student;
    const targetUserData = targetUserSnap.data() as Student;

    const isFollowing = (currentUserData.following || []).includes(targetUserId);

    if (isFollowing) {
        const batch = writeBatch(db);
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
        await batch.commit();
        return;
    }

    if (targetUserData.isPrivate) {
        const batch = writeBatch(db);
        batch.update(currentUserRef, { sentFollowRequests: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { pendingFollowRequests: arrayUnion(currentUserId) });
        await batch.commit();
        
        await addNotification(targetUserId, {
            type: 'follow_request',
            message: `${currentUserData.name} wants to follow you.`,
            link: `/profile/${currentUserId}`,
            fromUser: {
                id: currentUserData.id,
                name: currentUserData.name,
                profilePicture: currentUserData.profilePicture
            }
        });
    } else {
        const batch = writeBatch(db);
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
        await batch.commit();

        await addNotification(targetUserId, {
            type: 'follow',
            message: `${currentUserData.name} started following you.`,
            link: `/profile/${currentUserId}`,
            fromUser: {
                id: currentUserData.id,
                name: currentUserData.name,
                profilePicture: currentUserData.profilePicture,
            }
        });
    }
}

export async function handleFollowRequest(requesterId: string, recipientId: string, action: 'accept' | 'reject') {
    const requesterRef = doc(db, 'students', requesterId);
    const recipientRef = doc(db, 'students', recipientId);
    const requesterSnap = await getDoc(requesterRef);
    const recipientSnap = await getDoc(recipientRef);

    if (!requesterSnap.exists() || !recipientSnap.exists()) {
        throw new Error("User not found");
    }

    const requesterData = requesterSnap.data() as Student;
    const recipientData = recipientSnap.data() as Student;

    const batch = writeBatch(db);

    batch.update(recipientRef, { pendingFollowRequests: arrayRemove(requesterId) });
    batch.update(requesterRef, { sentFollowRequests: arrayRemove(recipientId) });

    if (action === 'accept') {
        batch.update(recipientRef, { followers: arrayUnion(requesterId) });
        batch.update(requesterRef, { following: arrayUnion(recipientId) });
    }

    await batch.commit();
    
    if (action === 'accept') {
        await addNotification(requesterId, {
            type: 'follow_accepted',
            message: `${recipientData.name} accepted your follow request.`,
            link: `/profile/${recipientId}`,
            fromUser: {
                id: recipientData.id,
                name: recipientData.name,
                profilePicture: recipientData.profilePicture,
            }
        });
    }
}

export async function cancelFollowRequest(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'students', currentUserId);
    const targetUserRef = doc(db, 'students', targetUserId);

    const batch = writeBatch(db);
    batch.update(currentUserRef, { sentFollowRequests: arrayRemove(targetUserId) });
    batch.update(targetUserRef, { pendingFollowRequests: arrayRemove(currentUserId) });
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
        thought.comments[commentIndex].content = content;
        thought.comments[commentIndex].timestamp = new Date().toISOString();
    } else {
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

// Global Chat
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
    }).filter(notif => notif.type !== 'follow_request' || notificationIds.includes(notif.id) === false);


    await updateDoc(userRef, { notifications: updatedNotifications });
}

// Private Chat
export async function addPrivateChatMessage(chatId: string, authorId: string, content: string): Promise<void> {
    if (!content.trim()) return;

    const chatDocRef = doc(privateChatMessagesCollection, chatId);
    const messagesCollectionRef = collection(chatDocRef, 'messages');

    await addDoc(messagesCollectionRef, {
        authorId,
        content: content.trim(),
        timestamp: serverTimestamp(),
    });
}

export function onNewPrivateMessage(chatId: string, callback: (messages: PrivateChatMessage[]) => void): () => void {
    const messagesCollectionRef = collection(doc(privateChatMessagesCollection, chatId), 'messages');
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const allMessages: PrivateChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allMessages.push({
                id: doc.id,
                chatId: chatId,
                ...data,
                timestamp: data.timestamp?.toMillis() || Date.now()
            } as PrivateChatMessage);
        });

        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentMessages = allMessages
            .filter(msg => msg.timestamp >= twentyFourHoursAgo)
            .sort((a, b) => a.timestamp - b.timestamp);
            
        callback(recentMessages);
    });

    return unsubscribe;
}

export async function getChatContacts(userId: string): Promise<ChatContact[]> {
    const user = await getStudentById(userId);
    if (!user) return [];

    const followingIds = user.following || [];
    const followerIds = user.followers || [];
    const allContactIds = [...new Set([...followingIds, ...followerIds])];

    if (allContactIds.length === 0) return [];
    
    const contactChunks: string[][] = [];
    for (let i = 0; i < allContactIds.length; i += 10) {
        contactChunks.push(allContactIds.slice(i, i + 10));
    }

    const allContacts: ChatContact[] = [];

    for (const chunk of contactChunks) {
        const q = query(studentsCollection, where('id', 'in', chunk));
        const snapshot = await getDocs(q);
        const contacts = snapshot.docs.map(doc => {
            const student = doc.data() as Student;
            return {
                ...student,
                isFollowing: followingIds.includes(student.id),
                isFollower: followerIds.includes(student.id),
            };
        });
        allContacts.push(...contacts);
    }
    
    return allContacts;
}


export async function blockUser(currentUserId: string, targetUserId: string): Promise<void> {
    const userRef = doc(db, 'students', currentUserId);
    await updateDoc(userRef, {
        blockedUsers: arrayUnion(targetUserId)
    });
}

export async function unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    const userRef = doc(db, 'students', currentUserId);
    await updateDoc(userRef, {
        blockedUsers: arrayRemove(targetUserId)
    });
}

export async function removeFollower(currentUserId: string, followerId: string): Promise<void> {
    const currentUserRef = doc(db, 'students', currentUserId);
    const followerRef = doc(db, 'students', followerId);

    const batch = writeBatch(db);
    batch.update(currentUserRef, { followers: arrayRemove(followerId) });
    batch.update(followerRef, { following: arrayRemove(currentUserId) });
    await batch.commit();
}




// Notes
export async function addNote(author: Student, data: { heading: string, description: string, link: string, password?: string }): Promise<Note> {
    const newNoteDoc = doc(notesCollection);
    const newNote: Note = {
        id: newNoteDoc.id,
        authorId: author.id,
        authorName: author.name,
        authorProfilePicture: author.profilePicture,
        heading: data.heading,
        description: data.description,
        link: data.link,
        password: data.password,
        timestamp: Date.now(),
    };
    await setDoc(newNoteDoc, newNote);
    return newNote;
}

export async function getNotes(): Promise<Note[]> {
    const q = query(notesCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Note);
}

export async function getNoteById(noteId: string): Promise<Note | undefined> {
    const docRef = doc(db, 'notes', noteId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as Note : undefined;
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note | undefined> {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { ...updates, timestamp: Date.now() });
    return getNoteById(noteId);
}

export async function deleteNote(noteId: string): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
}

// Coordinator functions
export async function restrictFromGlobalChat(userId: string): Promise<void> {
    const userRef = doc(db, 'students', userId);
    const restrictionEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await updateDoc(userRef, {
        globalChatRestrictedUntil: restrictionEndDate.toISOString()
    });
}
