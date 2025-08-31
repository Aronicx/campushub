
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { onNewMessage, addChatMessage, getChatContacts, restrictFromGlobalChat } from "@/lib/mock-data";
import type { ChatMessage, ChatContact, Student } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Users, Search, MoreVertical, Shield, ArrowLeft, Globe, Lock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";


const MESSAGE_EXPIRATION_MS = 8 * 60 * 1000; // 8 minutes

function MessageItem({ message, currentUser, onRestrict }: { message: ChatMessage, currentUser: Student, onRestrict: (userId: string) => void }) {
    const initials = (message.authorName || "NN").split(" ").map((n) => n[0]).join("");
    const isOwnMessage = message.authorId === currentUser.id;

    return (
        <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Link href={`/profile/${message.authorId}`}>
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={message.authorProfilePicture} alt={message.authorName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <Link href={`/profile/${message.authorId}`} className="font-semibold text-primary hover:underline">
                        {message.authorName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), "h:mm aa")}
                    </p>
                </div>
                <p className="text-card-foreground break-words">{message.content}</p>
            </div>
             {!isOwnMessage && currentUser.isCoordinator && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onRestrict(message.authorId)} className="text-destructive focus:text-destructive">
                            <Shield className="mr-2" /> Restrict User (24h)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

function GlobalChat({ onBack }: { onBack: () => void }) {
    const { currentUser, refreshCurrentUser } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = onNewMessage((newMessages) => {
             setMessages(newMessages.filter(m => Date.now() - m.timestamp < MESSAGE_EXPIRATION_MS));
        });

        const intervalId = setInterval(() => {
            setMessages(prevMessages => 
                prevMessages.filter(m => Date.now() - m.timestamp < MESSAGE_EXPIRATION_MS)
            );
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [currentUser]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        setIsSending(true);
        try {
            await addChatMessage(currentUser, newMessage);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleRestrictUser = async (userId: string) => {
        try {
            await restrictFromGlobalChat(userId);
            toast({
                title: "User Restricted",
                description: `The user has been restricted from Global Chat for 24 hours.`
            });
            await refreshCurrentUser(); // Refresh to get updated restriction status
        } catch (error) {
            console.error("Failed to restrict user:", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not restrict the user."
            });
        }
    };

    if (!currentUser) return null; // Should be handled by parent but good practice

    const isRestricted = currentUser.globalChatRestrictedUntil && new Date(currentUser.globalChatRestrictedUntil) > new Date();
    const restrictionLiftTime = isRestricted ? formatDistanceToNow(new Date(currentUser.globalChatRestrictedUntil), { addSuffix: true }) : '';

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft />
                </Button>
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">Global Chat</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock size={14}/> Messages disappear 8 minutes after they are sent.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length > 0 ? (
                    messages.map(msg => <MessageItem key={msg.id} message={msg} currentUser={currentUser} onRestrict={handleRestrictUser} />)
                ) : (
                    <div className="text-center text-muted-foreground pt-10">
                        No messages yet. Be the first to say something!
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="p-4 border-t">
                {isRestricted ? (
                    <div className="w-full text-center text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        You are restricted from global chat. Your access will be restored {restrictionLiftTime}.
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                        <Avatar className="hidden sm:inline-flex h-10 w-10 border">
                            <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.name || ''} />
                            <AvatarFallback>{(currentUser?.name || "NN").split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            autoComplete="off"
                            disabled={isSending}
                        />
                        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                            <Send />
                        </Button>
                    </form>
                )}
            </CardFooter>
        </Card>
    );
}

function PrivateChatList({ onBack }: { onBack: () => void }) {
    const { currentUser } = useAuth();
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) return;
        setIsLoading(true);
        getChatContacts(currentUser.id)
            .then(setContacts)
            .finally(() => setIsLoading(false));
    }, [currentUser]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contacts, searchTerm]);

    const getChatId = (otherUserId: string) => {
        if (!currentUser) return '';
        return [currentUser.id, otherUserId].sort().join('--');
    };

    if (isLoading) {
        return <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
    }

    return (
        <Card className="h-full flex flex-col">
             <CardHeader className="flex flex-row items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft />
                </Button>
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">Private Chat</CardTitle>
                    <CardDescription>Select a contact to start chatting.</CardDescription>
                </div>
            </CardHeader>
             <div className="p-4 border-b border-t">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
             <div className="flex-1 overflow-y-auto">
                {filteredContacts.length > 0 ? (
                    <div className="divide-y">
                        {filteredContacts.map(contact => (
                            <Link key={contact.id} href={`/chat/${getChatId(contact.id)}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={contact.profilePicture} alt={contact.name} />
                                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{contact.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {contact.isFollowing && contact.isFollower ? "You follow each other" : contact.isFollower ? "Follows you" : "You follow"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground">
                        <p>No contacts found.</p>
                        <p className="text-sm">Follow students to start chatting with them.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function ChatPage() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const [mode, setMode] = useState<'select' | 'global' | 'private'>('select');
    const router = useRouter();
    
    useEffect(() => {
        if (!isAuthLoading && !currentUser) {
            router.push('/login');
        }
    }, [isAuthLoading, currentUser, router]);

    if (isAuthLoading || !currentUser) {
        return (
             <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="flex flex-col items-center mb-8">
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        )
    }

    const renderContent = () => {
        switch(mode) {
            case 'global':
                return <GlobalChat onBack={() => setMode('select')} />;
            case 'private':
                return <PrivateChatList onBack={() => setMode('select')} />;
            case 'select':
            default:
                return (
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-primary">Chat</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Choose a chat mode to get started.</p>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <Card onClick={() => setMode('global')} className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform">
                                <CardHeader className="items-center text-center">
                                    <Globe className="h-12 w-12 text-primary mb-4" />
                                    <CardTitle className="text-2xl">Global Chat</CardTitle>
                                    <CardDescription>Public chat with everyone on campus. Messages disappear quickly!</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card onClick={() => setMode('private')} className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform">
                                <CardHeader className="items-center text-center">
                                    <Lock className="h-12 w-12 text-primary mb-4" />
                                    <CardTitle className="text-2xl">Private Chat</CardTitle>
                                    <CardDescription>Have one-on-one conversations with your connections.</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                );
        }
    }


    return (
        <div className="container mx-auto max-w-4xl px-0 sm:px-4 py-8">
            <div className="h-[calc(100vh-8rem)]">
                {renderContent()}
            </div>
        </div>
    );
}
