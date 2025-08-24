export interface Thought {
  id: string;
  content: string;
  timestamp: string;
}

export interface Student {
  id: string;
  name: string;
  major: string;
  interests: string[];
  profilePicture: string;
  bio: string;
  email: string;
  thoughts: Thought[];
}
