

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
    type: 'follow' | 'thought_like' | 'profile_like' | 'follow_request' | 'follow_accepted';
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

export interface TrustLike {
    userId: string;
    timestamp: number;
}

export interface Student {
  id: string; // This will be the username
  username: string;
  name:string;
  collegeName: string;
  term: string; // e.g., "1st Year", "2nd Year"
  degree: string; // e.g., "B.Sc.", "B.Eng"
  course: string; // e.g., "Computer Science"
  major: string;
  interests: string[];
  profilePicture: string;
  bio: string;
  email: string;
  thoughts: Thought[];
  following: string[];
  followers: string[];
  likedBy: string[];
  trustLikes?: TrustLike[];
  notifications: Notification[];
  password?: string;
  instagram?: string;
  snapchat?: string;
  discord?: string;
  phoneNumber?: string;
  customLink?: string;
  pendingFollowRequests: string[]; // IDs of users who want to follow this student
  sentFollowRequests: string[]; // IDs of users this student has requested to follow
  isPrivate: boolean;
  blockedUsers?: string[];
  isCoordinator?: boolean;
  globalChatRestrictedUntil?: string;
}

export interface ChatMessage {
    id: string;
    authorId: string;
    authorName: string;
    authorProfilePicture?: string;
    content: string;
    timestamp: number; // Use Firestore server timestamp
}

export interface PrivateChatMessage {
    id: string;
    chatId: string;
    authorId: string;
    content: string;
    timestamp: number;
}

export interface ChatContact extends Student {
    isFollowing: boolean;
    isFollower: boolean;
}

export interface Note {
    id: string;
    authorId: string;
    authorName: string;
    authorProfilePicture?: string;
    heading: string;
    description: string;
    link: string;
    timestamp: number;
}
