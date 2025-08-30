
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, UserPlus, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOTIFICATION_LIMIT = 20;

const iconMap = {
    follow: <UserPlus className="h-5 w-5 text-blue-500" />,
    thought_like: <Heart className="h-5 w-5 text-red-500" />,
    click_like: <Heart className="h-5 w-5 text-pink-500" />,
    profile_like: <Heart className="h-5 w-5 text-yellow-500" />,
};

function NotificationItem({ notification }: { notification: Notification }) {
    const initials = (notification.fromUser.name || "NN").split(" ").map((n) => n[0]).join("");
    return (
        <Link href={notification.link} className="block hover:bg-muted/50 rounded-md">
            <div className={cn(
                "flex items-start gap-3 p-3 transition-colors",
                !notification.read && "bg-primary/10"
            )}>
                 <Avatar className="h-10 w-10 border">
                    <AvatarImage src={notification.fromUser.profilePicture} alt={notification.fromUser.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="text-sm text-card-foreground break-words">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                </div>
                <div className="flex-shrink-0 self-center">
                    {iconMap[notification.type]}
                </div>
            </div>
        </Link>
    )
}

export function Notifications() {
    const { currentUser, markNotificationsAsRead } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const sortedNotifications = useMemo(() => {
        if (!currentUser?.notifications) return [];
        return [...currentUser.notifications]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, NOTIFICATION_LIMIT);
    }, [currentUser?.notifications]);

    const unreadCount = useMemo(() => {
        return currentUser?.notifications.filter(n => !n.read).length || 0;
    }, [currentUser?.notifications]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && unreadCount > 0) {
            const unreadIds = sortedNotifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                markNotificationsAsRead(unreadIds);
            }
        }
    };
    
    if (!currentUser) return null;

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5"/>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0" align="end">
                <div className="p-3 border-b">
                    <h3 className="text-lg font-medium">Notifications</h3>
                </div>
                <ScrollArea className="h-[400px]">
                    {sortedNotifications.length > 0 ? (
                        <div className="divide-y">
                            {sortedNotifications.map(notification => (
                                <NotificationItem key={notification.id} notification={notification} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground p-10">
                            <p>You have no notifications yet.</p>
                        </div>
                    )}
                </ScrollArea>
                 <div className="p-2 text-center text-xs text-muted-foreground border-t">
                    Showing last {sortedNotifications.length} notifications.
                </div>
            </PopoverContent>
        </Popover>
    )
}
