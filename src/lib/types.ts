
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
  likedBy: string[];
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
}
