
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getFollowers, getFollowing, getProfileLikers, toggleFollow } from '@/lib/mock-data';
import type { Student } from '@/lib/types';
import { StudentCard } from '@/components/student-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users, Heart } from 'lucide-react';

function ConnectionList({ 
    students, 
    currentUserId,
    onFollowToggle, 
    emptyState,
    isLoading
}: { 
    students: Student[], 
    currentUserId?: string,
    onFollowToggle: (studentId: string) => void,
    emptyState: React.ReactNode,
    isLoading: boolean
}) {
    if (isLoading) {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        )
    }

    if (students.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-10 border-dashed text-center">
                {emptyState}
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {students.map((student) => (
                <StudentCard 
                    key={student.id} 
                    student={student} 
                    currentUserId={currentUserId} 
                    onFollowToggle={onFollowToggle} 
                />
            ))}
        </div>
    );
}

export default function ConnectionsPage() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [followers, setFollowers] = useState<Student[]>([]);
    const [following, setFollowing] = useState<Student[]>([]);
    const [likers, setLikers] = useState<Student[]>([]);

    const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);
    const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
    const [isLoadingLikers, setIsLoadingLikers] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !currentUser) {
            router.push('/login');
        }
    }, [isAuthLoading, currentUser, router]);

    useEffect(() => {
        if (currentUser) {
            setIsLoadingFollowers(true);
            getFollowers(currentUser.id).then(setFollowers).finally(() => setIsLoadingFollowers(false));

            setIsLoadingFollowing(true);
            getFollowing(currentUser.id).then(setFollowing).finally(() => setIsLoadingFollowing(false));

            setIsLoadingLikers(true);
            getProfileLikers(currentUser.id).then(setLikers).finally(() => setIsLoadingLikers(false));
        }
    }, [currentUser]);

    const handleFollowToggle = async (studentId: string) => {
        if (!currentUser) return;
        
        const originalFollowing = following;
        setFollowing(prevFriends => prevFriends.filter(f => f.id !== studentId));

        try {
            await toggleFollow(currentUser.id, studentId);
        } catch (error) {
            console.error("Failed to unfollow", error);
            setFollowing(originalFollowing);
        }
    };

    if (isAuthLoading || !currentUser) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Skeleton className="h-10 w-1/2 mx-auto mb-4" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
             <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">My Connections</h1>
                <p className="mt-2 text-lg text-muted-foreground">Manage your network and see who's in your circle.</p>
            </div>
            <Tabs defaultValue="followers" className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList>
                        <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
                        <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
                        <TabsTrigger value="likes">Likes ({likers.length})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="followers">
                    <ConnectionList 
                        students={followers}
                        currentUserId={currentUser?.id}
                        onFollowToggle={handleFollowToggle}
                        isLoading={isLoadingFollowers}
                        emptyState={
                            <>
                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">You don't have any followers yet.</h3>
                                <p className="text-muted-foreground">Share your profile to get connected!</p>
                            </>
                        }
                    />
                </TabsContent>
                <TabsContent value="following">
                     <ConnectionList 
                        students={following}
                        currentUserId={currentUser?.id}
                        onFollowToggle={handleFollowToggle}
                        isLoading={isLoadingFollowing}
                        emptyState={
                            <>
                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">You are not following anyone.</h3>
                                <p className="text-muted-foreground">Browse the directory to find and follow friends.</p>
                            </>
                        }
                    />
                </TabsContent>
                <TabsContent value="likes">
                     <ConnectionList 
                        students={likers}
                        currentUserId={currentUser?.id}
                        onFollowToggle={handleFollowToggle}
                        isLoading={isLoadingLikers}
                        emptyState={
                            <>
                                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">Your profile has no likes yet.</h3>
                                <p className="text-muted-foreground">Keep your profile updated and engage with others!</p>
                            </>
                        }
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

