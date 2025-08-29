export interface Thought {
  id: string;
  content: string;
  timestamp: string;
  likes: string[];
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
  password?: string;
  instagram?: string;
  snapchat?: string;
  discord?: string;
  phoneNumber?: string;
  customLink?: string;
}
