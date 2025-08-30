
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  content: string;
  timestamp: string;
}

export interface Thought {
  id: string;
  content: string;
  timestamp: string;
  likes: string[];
  comments: Comment[];
}

export interface Notification {
    id: string;
    type: 'follow' | 'thought_like' | 'click_like' | 'profile_like';
    message: string;
    link: string; // e.g., /profile/[id], /thought-bubbles#thought-[id]
    timestamp: string;
    read: boolean;
    fromUser: {
        id: string;
        name: string;
        profilePicture?: string;
    }
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  major: string;
  interests: string[];
  profilePicture: string;
  bio: string;
  email: string;
  thoughts: Thought[];
  following: string[];
  followers: string[];
  likedBy: string[];
  notifications: Notification[];
  password?: string;
  instagram?: string;
  snapchat?: string;
  discord?: string;
  phoneNumber?: string;
  customLink?: string;
}

export interface ChatMessage {
    id: string;
    authorId: string;
    authorName: string;
    authorProfilePicture?: string;
    content: string;
    timestamp: number; // Use Firestore server timestamp
}

export interface Click {
  id: string; // document id
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  imageUrl: string;
  storagePath: string;
  timestamp: string; // ISO string
  likes: string[]; // Array of student IDs who liked the click
}
