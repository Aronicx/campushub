
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
import { LayoutDashboard, LogOut, Trash2, Users, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function UserAvatar() {
  const { currentUser, logout, deleteProfile } = useAuth();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!currentUser) return null;

  const initials = (currentUser.name || "NN")
    .split(" ")
    .map((n) => n[0])
    .join("");
    
  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteProfile(password);
    // If deletion is successful, the user is logged out and redirected.
    // If it fails, the toast is shown, and we can reset the state here.
    setIsDeleting(false);
    setIsAlertOpen(false);
    setPassword("");
  }
  
  const onAlertOpenChange = (open: boolean) => {
    if (isDeleting) return;
    setIsAlertOpen(open);
    if (!open) {
      setPassword("");
    }
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
            <DropdownMenuItem asChild>
            <Link href="/connections">
                <Users className="mr-2 h-4 w-4" />
                <span>Connections</span>
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
        <AlertDialog open={isAlertOpen} onOpenChange={onAlertOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers. Please enter your password to confirm.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="password-confirm">Password</Label>
                    <Input 
                        id="password-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={!password || isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                         {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
