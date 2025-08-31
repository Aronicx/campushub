
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  getStudentById,
  onNewPrivateMessage,
  addPrivateChatMessage,
  blockUser,
  unblockUser,
} from '@/lib/mock-data';
import type { PrivateChatMessage, Student } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  ShieldOff,
  Shield,
  UserX,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function ChatMessageItem({
  message,
  isOwn,
}: {
  message: PrivateChatMessage;
  isOwn: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-end gap-2 max-w-xs sm:max-w-md',
        isOwn ? 'self-end' : 'self-start'
      )}
    >
      <div
        className={cn(
          'rounded-lg px-3 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <p className="text-sm break-words">{message.content}</p>
      </div>
    </div>
  );
}

export default function PrivateChatPage() {
  const { currentUser, isLoading: isAuthLoading, refreshCurrentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;

  const [messages, setMessages] = useState<PrivateChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);
  
  const otherUserId = useMemo(() => {
    if (!chatId || !currentUser) return null;
    const ids = chatId.split('--');
    return ids.find((id) => id !== currentUser.id) || null;
  }, [chatId, currentUser]);


  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser && !otherUserId) {
        // This can happen briefly on load, but if it persists, something is wrong with the chatId
        // For now, we can just wait or redirect to the main chat page if it's clearly invalid.
        if (chatId && chatId.split('--').length !== 2) {
             router.push('/chat');
        }
        return;
    }
  }, [isAuthLoading, currentUser, otherUserId, chatId, router]);

  useEffect(() => {
    if (!otherUserId) return;
    setIsLoading(true);
    getStudentById(otherUserId)
      .then((user) => {
        if (user) {
          setOtherUser(user);
        } else {
          // This could happen if a user was deleted.
          toast({ variant: 'destructive', title: 'User not found' });
          router.push('/chat');
        }
      })
      .finally(() => setIsLoading(false));
  }, [otherUserId, router, toast]);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = onNewPrivateMessage(chatId, setMessages);

    return () => unsubscribe();
  }, [chatId]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;

    setIsSending(true);
    try {
      await addPrivateChatMessage(chatId, currentUser.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ variant: 'destructive', title: 'Error sending message.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !otherUser) return;
    try {
      await blockUser(currentUser.id, otherUser.id);
      await refreshCurrentUser();
      toast({ title: "User Blocked", description: `You have blocked ${otherUser.name}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not block user.' });
    }
  };

  const handleUnblock = async () => {
    if (!currentUser || !otherUser) return;
    try {
      await unblockUser(currentUser.id, otherUser.id);
      await refreshCurrentUser();
      toast({ title: "User Unblocked", description: `You have unblocked ${otherUser.name}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not block user.' });
    }
  };
  
  if (isLoading || isAuthLoading || !currentUser || !otherUser) {
    return <div className="container mx-auto max-w-2xl px-0 sm:px-4 py-8">
      <Skeleton className="h-[calc(100vh-8rem)] w-full" />
    </div>;
  }
  
  const isFollowing = currentUser.following.includes(otherUser.id);
  const isFollowedBy = currentUser.followers.includes(otherUser.id);
  const canChat = isFollowing || isFollowedBy;
  
  const amIBlocked = (otherUser.blockedUsers || []).includes(currentUser.id);
  const isOtherUserBlocked = (currentUser.blockedUsers || []).includes(otherUser.id);
  const chatDisabled = !canChat || amIBlocked || isOtherUserBlocked;

  return (
    <div className="container mx-auto max-w-2xl px-0 sm:px-4 py-8">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 p-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.push('/chat')}>
            <ArrowLeft />
          </Button>
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} />
              <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold">{otherUser.name}</p>
                <p className="text-xs text-muted-foreground">{ canChat ? "Online" : "Not following"}</p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/profile/${otherUser.id}`}>View Profile</Link>
                </DropdownMenuItem>
                {isOtherUserBlocked ? (
                    <DropdownMenuItem onClick={handleUnblock}>
                        <ShieldOff className="mr-2 h-4 w-4" /> Unblock User
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={handleBlock}>
                        <Shield className="mr-2 h-4 w-4 text-destructive"/> Block User
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isOwn={msg.authorId === currentUser.id}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground m-auto">
              <p>No messages yet.</p>
              <p className="text-xs">Messages disappear 10 minutes after they are sent.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="p-4 border-t">
          {chatDisabled ? (
            <div className="w-full text-center text-sm text-muted-foreground flex items-center justify-center gap-2 bg-muted p-3 rounded-lg">
              <UserX size={16} />
              {amIBlocked && `You are blocked by ${otherUser.name}.`}
              {isOtherUserBlocked && `You have blocked ${otherUser.name}.`}
              {!amIBlocked && !isOtherUserBlocked && !canChat && 'You must follow each other to chat.'}
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="w-full flex items-center gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                disabled={isSending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || !newMessage.trim()}
              >
                <Send />
              </Button>
            </form>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
