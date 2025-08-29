
"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { LayoutDashboard, LogOut, Trash2 } from "lucide-react";

export function UserAvatar() {
  const { currentUser, logout, deleteProfile } = useAuth();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  if (!currentUser) return null;

  const initials = (currentUser.name || "NN")
    .split(" ")
    .map((n) => n[0])
    .join("");
    
  const handleDelete = async () => {
    await deleteProfile();
  }

  return (
    <>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
                <AvatarImage
                src={currentUser.profilePicture || undefined}
                alt={currentUser.name || 'User'}
                />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name || '(no name)'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
                </p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
            <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Profile</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

    
