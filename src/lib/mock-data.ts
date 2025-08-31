









import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, setDoc, writeBatch, deleteDoc, arrayRemove, addDoc, serverTimestamp, onSnapshot, orderBy, Timestamp, collectionGroup } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { Student, Thought, Comment, ChatMessage, Notification, PrivateChatMessage, ChatContact, Note } from './types';
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

function assignCoordinatorRoles(students: Student[]): Student[] {
    const moderatorRollNo = '75';
    const twentyDaysAgo = Date.now() - 20 * 24 * 60 * 60 * 1000;

    // First, find the moderator and rename them
    const studentsWithModeratorName = students.map(s => {
        if (s.rollNo === moderatorRollNo) {
            return { ...s, name: 'Moderator' };
        }
        return s;
    });

    // Calculate recent trust likes for all users
    const studentsWithRecentTrustLikes = studentsWithModeratorName.map(s => {
        const recentLikes = (s.trustLikes || []).filter(like => like.timestamp >= twentyDaysAgo);
        return { ...s, recentTrustLikeCount: recentLikes.length };
    });

    // Identify potential coordinators (not the moderator, >= 50 likes)
    const potentialCoordinators = studentsWithRecentTrustLikes
        .filter(s => s.rollNo !== moderatorRollNo && s.recentTrustLikeCount >= 50)
        .sort((a, b) => b.recentTrustLikeCount - a.recentTrustLikeCount);

    // Get the top two
    const topLikedCoordinators = potentialCoordinators.slice(0, 2);
    const coordinatorIds = new Set(topLikedCoordinators.map(s => s.id));
    
    // Assign coordinator status
    return studentsWithRecentTrustLikes.map(student => ({
        ...student,
        isCoordinator: student.rollNo === moderatorRollNo || coordinatorIds.has(student.id)
    }));
}


export async function getStudents(filters?: { search?: string }): Promise<Student[]> {
    let q = query(studentsCollection);
    
    const snapshot = await getDocs(q);
    let students: Student[] = snapshot.docs.map(doc => doc.data() as Student);
    
    students = assignCoordinatorRoles(students);
    
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
  
  const student = docSnap.data() as Student;
  
  // This is a simple way to check coordinator status on a single user fetch.
  // A more robust system would involve a separate coordinator collection or claims.
  const allStudentsSnap = await getDocs(studentsCollection);
  const allStudents = allStudentsSnap.docs.map(doc => doc.data() as Student);
  const studentsWithCoordinator = assignCoordinatorRoles(allStudents);
  
  const studentWithCoordinatorStatus = studentsWithCoordinator.find(s => s.id === id);

  return studentWithCoordinatorStatus;
}


export async function getStudentByEmail(email: string): Promise<Student | undefined> {
  const q = query(studentsCollection, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return undefined;
  return snapshot.docs[0].data() as Student;
}

export async function getStudentByName(name: string): Promise<Student | undefined> {
    if (!name) return undefined;
    if (name === 'Moderator') return getStudentByRollNo('75');
    const q = query(studentsCollection, where("name", "==", name));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Student;
}

export async function getStudentByRollNo(rollNo: string): Promise<Student | undefined> {
    const q = query(studentsCollection, where("rollNo", "==", rollNo));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    const student = snapshot.docs[0].data() as Student;
    if (student.rollNo === '75') {
        student.name = 'Moderator';
    }
    return student;
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
        trustLikes: [],
        notifications: [],
        pendingFollowRequests: [],
        sentFollowRequests: [],
        isPrivate: false,
        blockedUsers: [],
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
        // User has already liked, so we remove the like
        await updateDoc(targetUserRef, {
            trustLikes: arrayRemove(trustLikes[existingLikeIndex])
        });
    } else {
        // New like, add it with a timestamp
        const newTrustLike = { userId: currentUserId, timestamp: Date.now() };
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
export async function getChatContacts(userId: string): Promise<ChatContact[]> {
  const user = await getStudentById(userId);
  if (!user) return [];

  const followingIds = user.following || [];
  const followersIds = user.followers || [];
  const contactIds = [...new Set([...followingIds, ...followersIds])];

  if (contactIds.length === 0) return [];
  
  // Firestore 'in' query limit is 30. Chunk if necessary.
  const chunks = [];
  for (let i = 0; i < contactIds.length; i += 30) {
      chunks.push(contactIds.slice(i, i + 30));
  }
  
  const contactPromises = chunks.map(chunk => 
    getDocs(query(studentsCollection, where('id', 'in', chunk)))
  );

  const chunkSnapshots = await Promise.all(contactPromises);
  const contacts: Student[] = chunkSnapshots.flatMap(snap => snap.docs.map(doc => doc.data() as Student));
  
  return contacts.map(contact => ({
      ...contact,
      isFollowing: followingIds.includes(contact.id),
      isFollower: followersIds.includes(contact.id)
  }));
}

export async function addPrivateChatMessage(chatId: string, authorId: string, content: string): Promise<void> {
    if (!content.trim()) return;

    await addDoc(privateChatMessagesCollection, {
        chatId,
        authorId,
        content: content.trim(),
        timestamp: serverTimestamp(),
    });
}

export function onNewPrivateMessage(chatId: string, callback: (messages: PrivateChatMessage[]) => void): () => void {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const q = query(
        privateChatMessagesCollection, 
        where('chatId', '==', chatId), 
        where('timestamp', '>=', new Date(tenMinutesAgo)),
        orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: PrivateChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toMillis() || Date.now();
            
            if (timestamp >= tenMinutesAgo) {
                messages.push({
                    id: doc.id,
                    ...data,
                    timestamp: timestamp
                } as PrivateChatMessage);
            }
        });
        callback(messages);
    });

    return unsubscribe;
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
export async function addNote(author: Student, data: { heading: string, description: string, link: string }): Promise<Note> {
    const newNoteDoc = doc(notesCollection);
    const newNote: Note = {
        id: newNoteDoc.id,
        authorId: author.id,
        authorName: author.name,
        authorProfilePicture: author.profilePicture,
        heading: data.heading,
        description: data.description,
        link: data.link,
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
