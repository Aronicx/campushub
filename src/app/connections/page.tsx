
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getFollowers, getFollowing, getProfileLikers, toggleFollow, removeFollower, getSuggestedConnections, toggleProfileLike } from '@/lib/mock-data';
import type { Student } from '@/lib/types';
import { StudentCard } from '@/components/student-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users, Heart, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ConnectionList({ 
    students, 
    currentUserId,
    onFollowToggle, 
    onRemoveFollower,
    onLikeToggle,
    emptyState,
    isLoading,
    listType
}: { 
    students: Student[], 
    currentUserId?: string,
    onFollowToggle?: (studentId: string) => void,
    onRemoveFollower?: (studentId: string) => void,
    onLikeToggle?: (studentId: string) => void,
    emptyState: React.ReactNode,
    isLoading: boolean,
    listType: 'followers' | 'following' | 'likes' | 'suggestions'
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
                    onLikeToggle={onLikeToggle} 
                    onRemoveFollower={onRemoveFollower}
                    listType={listType}
                />
            ))}
        </div>
    );
}

export default function ConnectionsPage() {
    const { currentUser, isLoading: isAuthLoading, refreshCurrentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [followers, setFollowers] = useState<Student[]>([]);
    const [following, setFollowing] = useState<Student[]>([]);
    const [likers, setLikers] = useState<Student[]>([]);
    const [suggestions, setSuggestions] = useState<Student[]>([]);

    const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);
    const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
    const [isLoadingLikers, setIsLoadingLikers] = useState(true);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !currentUser) {
            router.push('/login');
        }
    }, [isAuthLoading, currentUser, router]);

    const fetchAllConnections = async () => {
        if (currentUser) {
            setIsLoadingFollowers(true);
            getFollowers(currentUser.id).then(setFollowers).finally(() => setIsLoadingFollowers(false));

            setIsLoadingFollowing(true);
            getFollowing(currentUser.id).then(setFollowing).finally(() => setIsLoadingFollowing(false));

            setIsLoadingLikers(true);
            getProfileLikers(currentUser.id).then(setLikers).finally(() => setIsLoadingLikers(false));

            setIsLoadingSuggestions(true);
            getSuggestedConnections(currentUser.id).then(setSuggestions).finally(() => setIsLoadingSuggestions(false));
        }
    }

    useEffect(() => {
        fetchAllConnections();
    }, [currentUser]);

    const handleFollowToggle = async (studentId: string) => {
        if (!currentUser) return;
        try {
            await toggleFollow(currentUser.id, studentId);
            toast({ title: "Updated", description: `Follow status changed.` });
            await refreshCurrentUser();
            // Refetch suggestions as they might change
            getSuggestedConnections(currentUser.id).then(setSuggestions);
        } catch (error) {
            console.error("Failed to toggle follow", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not toggle follow status.' });
        }
    };

    const handleUnfollow = async (studentId: string) => {
        if (!currentUser) return;
        
        const originalFollowing = [...following];
        setFollowing(prevFriends => prevFriends.filter(f => f.id !== studentId));

        try {
            await toggleFollow(currentUser.id, studentId);
            toast({ title: "Unfollowed", description: `You are no longer following them.` });
            await refreshCurrentUser();
        } catch (error) {
            console.error("Failed to unfollow", error);
            setFollowing(originalFollowing);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not unfollow user.' });
        }
    };
    
    const handleRemoveFollower = async (studentId: string) => {
        if (!currentUser) return;

        const originalFollowers = [...followers];
        setFollowers(prevFollowers => prevFollowers.filter(f => f.id !== studentId));
        
        try {
            await removeFollower(currentUser.id, studentId);
            toast({ title: "Follower Removed", description: `They are no longer following you.` });
            await refreshCurrentUser();
        } catch (error) {
            console.error("Failed to remove follower", error);
            setFollowers(originalFollowers);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove follower.' });
        }
    }
    
    const handleLikeToggle = async (studentId: string) => {
        if (!currentUser) return;
        try {
             await toggleProfileLike(studentId, currentUser.id);
             // Re-fetch all data to ensure UI consistency for likes across different lists
             await fetchAllConnections();
        } catch (error) {
            console.error("Failed to toggle like", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update like status.' });
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
                        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="followers">
                    <ConnectionList 
                        students={followers}
                        currentUserId={currentUser?.id}
                        onRemoveFollower={handleRemoveFollower}
                        onLikeToggle={handleLikeToggle}
                        isLoading={isLoadingFollowers}
                        listType="followers"
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
                        onFollowToggle={handleUnfollow}
                        onLikeToggle={handleLikeToggle}
                        isLoading={isLoadingFollowing}
                        listType="following"
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
                        onFollowToggle={handleUnfollow}
                        onLikeToggle={handleLikeToggle}
                        isLoading={isLoadingLikers}
                        listType="likes"
                        emptyState={
                            <>
                                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">Your profile has no likes yet.</h3>
                                <p className="text-muted-foreground">Keep your profile updated and engage with others!</p>
                            </>
                        }
                    />
                </TabsContent>
                <TabsContent value="suggestions">
                     <ConnectionList 
                        students={suggestions}
                        currentUserId={currentUser?.id}
                        onFollowToggle={handleFollowToggle}
                        onLikeToggle={handleLikeToggle}
                        isLoading={isLoadingSuggestions}
                        listType="suggestions"
                        emptyState={
                            <>
                                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">No suggestions right now.</h3>
                                <p className="text-muted-foreground">We'll find some new people for you to connect with soon!</p>
                            </>
                        }
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
