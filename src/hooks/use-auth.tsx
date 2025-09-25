
"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentByEmail, updateStudent, getStudentById, getStudentByUsername, addThought, deleteStudent, markNotificationsAsRead as markNotificationsAsReadBackend } from '@/lib/mock-data';
import type { Student, Notification } from '@/lib/types';
import { useToast } from './use-toast';

interface AuthContextType {
  currentUser: Student | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Student>) => Promise<void>;
  updateProfileFollowing: (following: string[]) => void;
  postThought: (content: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  deleteProfile: (password: string) => Promise<void>;
  markNotificationsAsRead: (notificationIds: string[]) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const refreshCurrentUser = useCallback(async () => {
    if (currentUser?.id) {
      const user = await getStudentById(currentUser.id);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [currentUser?.id]);
  
  useEffect(() => {
    let isMounted = true;
    const loadUserFromStorage = async () => {
      setIsLoading(true);
      try {
        const storedUserId = localStorage.getItem('campus-hub-user');
        if (storedUserId) {
          const user = await getStudentById(storedUserId);
          if (isMounted) {
            if (user) {
              setCurrentUser(user);
            } else {
              localStorage.removeItem('campus-hub-user');
              setCurrentUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load user from storage", error);
        if (isMounted) {
            setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUserFromStorage();

    return () => {
      isMounted = false;
    }
  }, []);


  const login = async (identifier: string, password?: string) => {
    const user = await getStudentByUsername(identifier.toLowerCase());
    
    if (user && user.password === password) {
      localStorage.setItem('campus-hub-user', user.id);
      setCurrentUser(user);
      toast({ title: "Login Successful", description: `Welcome back, ${user.name || 'user'}!` });
      return true;
    }
    
    toast({ variant: "destructive", title: "Login Failed", description: "Invalid username or password." });
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

  const updateProfileFollowing = (following: string[]) => {
      if (currentUser) {
          setCurrentUser({ ...currentUser, following });
      }
  }

  const postThought = async (content: string) => {
      if(currentUser) {
        const newThought = await addThought(currentUser.id, content);
        if (newThought) {
            const updatedUser = await getStudentById(currentUser.id);
            if (updatedUser) {
              updatedUser.thoughts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              setCurrentUser(updatedUser);
            }
            toast({ title: "Thought Posted!", description: "Your daily thought is now live." });
        }
      }
  }

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to change your password.' });
      return false;
    }
    if (currentUser.password !== oldPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'The current password you entered is incorrect.' });
      return false;
    }
    try {
      const updatedUser = await updateStudent(currentUser.id, { password: newPassword });
      if (updatedUser) {
        setCurrentUser(updatedUser);
        toast({ title: 'Success', description: 'Your password has been changed successfully.' });
        return true;
      }
      return false;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to change password.' });
      return false;
    }
  };

  const deleteProfile = async (password: string) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to delete your profile.' });
      return;
    }

    if (currentUser.password !== password) {
      toast({ variant: 'destructive', title: 'Incorrect Password', description: 'The password you entered is incorrect. Profile not deleted.' });
      return;
    }

    try {
      await deleteStudent(currentUser.id);
      logout();
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      router.push('/signup');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete your account.' });
    }
  };

  const markUserNotificationsAsRead = async (notificationIds: string[]) => {
    if (!currentUser) return;
    try {
        await markNotificationsAsReadBackend(currentUser.id, notificationIds);
        const updatedNotifications = currentUser.notifications.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
        );
        setCurrentUser({ ...currentUser, notifications: updatedNotifications });
    } catch (error) {
        console.error("Failed to mark notifications as read:", error);
    }
  }
  
  const value = { currentUser, isLoading, login, logout, updateProfile, postThought, changePassword, deleteProfile, updateProfileFollowing, markNotificationsAsRead: markUserNotificationsAsRead, refreshCurrentUser };

  return (
    <AuthContext.Provider value={value}>
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
