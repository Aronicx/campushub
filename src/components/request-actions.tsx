
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { handleFollowRequest } from "@/lib/mock-data";
import type { Notification } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RequestActionsProps {
  notification: Notification;
  onActionHandled: () => void;
}

export function RequestActions({ notification, onActionHandled }: RequestActionsProps) {
  const { currentUser, markNotificationsAsRead } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<"accept" | "reject" | null>(null);

  const handleAction = async (action: "accept" | "reject") => {
    if (!currentUser) return;
    setIsLoading(action);
    try {
      await handleFollowRequest(notification.fromUser.id, currentUser.id, action);
      toast({
        title: `Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        description: `You have ${action === 'accept' ? 'accepted' : 'rejected'} ${notification.fromUser.name}'s follow request.`
      });
      // Mark this specific notification as "read" and remove it
      await markNotificationsAsRead([notification.id]);
      onActionHandled();
    } catch (error) {
      console.error(`Failed to ${action} follow request`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not ${action} the request.`,
      });
    } finally {
        setIsLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2 mt-2">
      <Button
        size="sm"
        variant="default"
        onClick={() => handleAction("accept")}
        disabled={!!isLoading}
      >
        {isLoading === 'accept' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
        Accept
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={!!isLoading}
      >
         {isLoading === 'reject' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
        Reject
      </Button>
    </div>
  );
}
