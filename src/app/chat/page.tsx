
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { onNewMessage, addChatMessage } from "@/lib/mock-data";
import type { ChatMessage } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MESSAGE_EXPIRATION_MS = 8 * 60 * 1000; // 8 minutes

function MessageItem({ message }: { message: ChatMessage }) {
    const initials = (message.authorName || "NN").split(" ").map((n) => n[0]).join("");

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
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
        </div>
    );
}

export default function ChatPage() {
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!isAuthLoading && !currentUser) {
            router.push('/login');
            return;
        }

        const unsubscribe = onNewMessage((newMessages) => {
             setMessages(newMessages.filter(m => Date.now() - m.timestamp < MESSAGE_EXPIRATION_MS));
        });

        // Periodically filter out old messages
        const intervalId = setInterval(() => {
            setMessages(prevMessages => 
                prevMessages.filter(m => Date.now() - m.timestamp < MESSAGE_EXPIRATION_MS)
            );
        }, 1000); // Check every second

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [isAuthLoading, currentUser, router]);

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
    
    if (isAuthLoading || !currentUser) {
        return (
             <div className="container mx-auto max-w-3xl px-4 py-8">
                <Skeleton className="h-12 w-1/2 mb-2" />
                <Skeleton className="h-8 w-3/4 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-3xl px-0 sm:px-4 py-8">
            <Card className="h-[calc(100vh-10rem)] flex flex-col">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">Global Chat</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock size={14}/> Messages disappear 8 minutes after they are sent.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.length > 0 ? (
                        messages.map(msg => <MessageItem key={msg.id} message={msg} />)
                    ) : (
                        <div className="text-center text-muted-foreground pt-10">
                            No messages yet. Be the first to say something!
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="p-4 border-t">
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
                </CardFooter>
            </Card>
        </div>
    );
}
