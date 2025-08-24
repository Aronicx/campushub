// A simple, mock authentication hook that uses localStorage.
// In a real app, you would replace this with a proper authentication solution.
"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentByEmail, addStudent, updateStudent, getStudentById, getStudentByRollNo, getStudentByName } from '@/lib/mock-data';
import type { Student } from '@/lib/types';
import { useToast } from './use-toast';

interface AuthContextType {
  currentUser: Student | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => boolean;
  logout: () => void;
  signup: (data: Omit<Student, 'id' | 'thoughts'>) => Student | null;
  updateProfile: (data: Partial<Student>) => void;
  postThought: (content: string) => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('campus-hub-user');
      if (storedUserId) {
        const user = getStudentById(storedUserId);
        setCurrentUser(user || null);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const login = (identifier: string, password?: string) => {
    // In our mock data, email is student{rollNo}@example.com.
    // We can try to find user by email or by roll number or by name
    let user = getStudentByEmail(identifier);
    if (!user) {
      user = getStudentByRollNo(identifier);
    }
    if (!user) {
        user = getStudentByName(identifier);
    }

    if (user && user.password === password) {
      localStorage.setItem('campus-hub-user', user.id);
      setCurrentUser(user);
      toast({ title: "Login Successful", description: `Welcome back, ${user.name || 'user'}!` });
      return true;
    }
    
    // For backwards compatibility, if password is not provided, we check old emails
    if (user && !password) {
       localStorage.setItem('campus-hub-user', user.id);
       setCurrentUser(user);
       toast({ title: "Login Successful", description: `Welcome back, ${user.name || 'user'}!` });
       return true;
    }

    toast({ variant: "destructive", title: "Login Failed", description: "Invalid identifier or password." });
    return false;
  };

  const logout = () => {
    localStorage.removeItem('campus-hub-user');
    setCurrentUser(null);
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const signup = (data: Omit<Student, 'id' | 'thoughts'>) => {
    const existingUser = getStudentByEmail(data.email);
    if (existingUser) {
        toast({ variant: "destructive", title: "Signup Failed", description: "An account with this email already exists." });
        return null;
    }
    const newUser = addStudent(data);
    if (newUser) {
        localStorage.setItem('campus-hub-user', newUser.id);
        setCurrentUser(newUser);
        toast({ title: "Account Created!", description: `Welcome to Campus Hub, ${newUser.name || 'user'}!` });
        return newUser;
    }
    return null;
  };
  
  const updateProfile = (data: Partial<Student>) => {
    if (currentUser) {
        const updatedUser = updateStudent(currentUser.id, data);
        if (updatedUser) {
            setCurrentUser(updatedUser);
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        }
    }
  }

  const postThought = (content: string) => {
      if(currentUser) {
        const newThought = addThought(currentUser.id, content);
        if (newThought) {
            const updatedUser = getStudentById(currentUser.id);
            setCurrentUser(updatedUser!);
            toast({ title: "Thought Posted!", description: "Your daily thought is now live." });
        }
      }
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, signup, updateProfile, postThought }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
