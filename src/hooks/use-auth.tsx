
"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentByEmail, updateStudent, getStudentById, getStudentByRollNo, getStudentByName, addThought } from '@/lib/mock-data';
import type { Student } from '@/lib/types';
import { useToast } from './use-toast';

interface AuthContextType {
  currentUser: Student | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Student>) => Promise<void>;
  postThought: (content: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const loadUserFromStorage = useCallback(async () => {
    try {
      const storedUserId = localStorage.getItem('campus-hub-user');
      if (storedUserId) {
        const user = await getStudentById(storedUserId);
        setCurrentUser(user || null);
      }
    } catch (error) {
      console.error("Could not access localStorage or fetch user:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (identifier: string, password?: string) => {
    let user = await getStudentByEmail(identifier);
    if (!user) {
      user = await getStudentByRollNo(identifier);
    }
    if (!user) {
      user = await getStudentByName(identifier);
    }

    if (user && user.password === password) {
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
  
  const updateProfile = async (data: Partial<Student>) => {
    if (currentUser) {
        const updatedUser = await updateStudent(currentUser.id, data);
        if (updatedUser) {
            setCurrentUser(updatedUser);
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        }
    }
  }

  const postThought = async (content: string) => {
      if(currentUser) {
        const newThought = await addThought(currentUser.id, content);
        if (newThought) {
            const updatedUser = await getStudentById(currentUser.id);
            if (updatedUser) {
              //Firestore's arrayUnion does not guarantee order, so we need to sort client-side.
              updatedUser.thoughts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              setCurrentUser(updatedUser);
            }
            toast({ title: "Thought Posted!", description: "Your daily thought is now live." });
        }
      }
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, updateProfile, postThought }}>
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
